"""
app.py — RadioScan AI API (Flask + PostgreSQL)
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os, base64, tempfile, json
from functools import wraps
import bcrypt
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
from PIL import Image
import numpy as np

from model_utils import MedicalImageClassifier
from database import get_db, init_db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'radioscan-secret-2024-change-in-prod')

CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'vgg19_hybrid.pth')
classifier = MedicalImageClassifier(MODEL_PATH, num_classes=3)


# ─── Helpers ──────────────────────────────────────────────────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'radiologue_id' not in session:
            return jsonify({'success': False, 'error': 'Non authentifié'}), 401
        return f(*args, **kwargs)
    return decorated


def generate_gradcam_image(result):
    fig, ax = plt.subplots(1, 1, figsize=(5, 5))
    ax.imshow(result['original_image'])
    ax.imshow(result['heatmap'], cmap='jet', alpha=0.5)
    ax.set_title(f"{result['label']} — {result['confidence']:.1f}%",
                 fontsize=13, fontweight='bold', pad=10)
    ax.axis('off')
    plt.tight_layout(pad=0.5)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')


# ─── Auth ─────────────────────────────────────────────────────────────────────
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': 'Identifiants manquants'}), 400

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, password, name, role FROM radiologues WHERE username = %s",
                (username,)
            )
            user = cur.fetchone()

    if not user:
        return jsonify({'success': False, 'error': 'Identifiants incorrects'}), 401

    # Vérification bcrypt
    if not bcrypt.checkpw(password.encode(), user['password'].encode()):
        return jsonify({'success': False, 'error': 'Identifiants incorrects'}), 401

    session['radiologue_id'] = user['id']
    return jsonify({
        'success': True,
        'user': {
            'id':       user['id'],
            'username': user['username'],
            'name':     user['name'],
            'role':     user['role'],
        }
    })


@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/auth/me', methods=['GET'])
@login_required
def me():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, name, role FROM radiologues WHERE id = %s",
                (session['radiologue_id'],)
            )
            user = cur.fetchone()
    if not user:
        return jsonify({'success': False, 'error': 'Utilisateur introuvable'}), 404
    return jsonify({'success': True, 'user': dict(user)})


# ─── Patients ─────────────────────────────────────────────────────────────────
@app.route('/patients', methods=['GET'])
@login_required
def list_patients():
    search = request.args.get('search', '').strip()
    with get_db() as conn:
        with conn.cursor() as cur:
            if search:
                q = f"%{search}%"
                cur.execute(
                    """SELECT id, nom, prenom, cin, date_naissance, sexe, telephone, medecin,
                              created_at, updated_at
                       FROM patients
                       WHERE nom ILIKE %s OR prenom ILIKE %s OR cin ILIKE %s
                       ORDER BY nom, prenom""",
                    (q, q, q)
                )
            else:
                cur.execute(
                    """SELECT id, nom, prenom, cin, date_naissance, sexe, telephone, medecin,
                              created_at, updated_at
                       FROM patients ORDER BY nom, prenom"""
                )
            rows = cur.fetchall()
    # Sérialiser les dates
    patients = []
    for r in rows:
        p = dict(r)
        if p.get('date_naissance'):
            p['date_naissance'] = p['date_naissance'].strftime('%d/%m/%Y')
        if p.get('created_at'):
            p['created_at'] = p['created_at'].isoformat()
        if p.get('updated_at'):
            p['updated_at'] = p['updated_at'].isoformat()
        patients.append(p)
    return jsonify({'success': True, 'patients': patients})


@app.route('/patients', methods=['POST'])
@login_required
def create_patient():
    data = request.get_json()
    required = ['nom', 'prenom', 'cin']
    for field in required:
        if not data.get(field, '').strip():
            return jsonify({'success': False, 'error': f'Champ requis : {field}'}), 400

    # Convertir date jj/mm/aaaa → aaaa-mm-jj
    dob = None
    if data.get('date_naissance'):
        try:
            parts = data['date_naissance'].strip().split('/')
            dob = f"{parts[2]}-{parts[1]}-{parts[0]}"
        except Exception:
            dob = None

    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """INSERT INTO patients (nom, prenom, cin, date_naissance, sexe, telephone, medecin)
                       VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (data['nom'].strip(), data['prenom'].strip(), data['cin'].strip(),
                     dob, data.get('sexe'), data.get('telephone'), data.get('medecin'))
                )
                new_id = cur.fetchone()['id']
            except Exception as e:
                if 'unique' in str(e).lower():
                    return jsonify({'success': False, 'error': 'CIN déjà enregistré'}), 409
                raise

    return jsonify({'success': True, 'id': new_id}), 201


@app.route('/patients/<int:pid>', methods=['PUT'])
@login_required
def update_patient(pid):
    data = request.get_json()

    dob = None
    if data.get('date_naissance'):
        try:
            parts = data['date_naissance'].strip().split('/')
            dob = f"{parts[2]}-{parts[1]}-{parts[0]}"
        except Exception:
            dob = None

    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """UPDATE patients
                       SET nom=%s, prenom=%s, cin=%s, date_naissance=%s,
                           sexe=%s, telephone=%s, medecin=%s, updated_at=NOW()
                       WHERE id=%s""",
                    (data.get('nom','').strip(), data.get('prenom','').strip(),
                     data.get('cin','').strip(), dob,
                     data.get('sexe'), data.get('telephone'), data.get('medecin'),
                     pid)
                )
                if cur.rowcount == 0:
                    return jsonify({'success': False, 'error': 'Patient non trouvé'}), 404
            except Exception as e:
                if 'unique' in str(e).lower():
                    return jsonify({'success': False, 'error': 'CIN déjà enregistré'}), 409
                raise

    return jsonify({'success': True})


@app.route('/patients/<int:pid>', methods=['DELETE'])
@login_required
def delete_patient(pid):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM patients WHERE id = %s", (pid,))
            if cur.rowcount == 0:
                return jsonify({'success': False, 'error': 'Patient non trouvé'}), 404
    return jsonify({'success': True})


# ─── Analyses ─────────────────────────────────────────────────────────────────
@app.route('/analyses', methods=['GET'])
@login_required
def list_analyses():
    patient_id = request.args.get('patient_id')
    with get_db() as conn:
        with conn.cursor() as cur:
            if patient_id:
                cur.execute(
                    """SELECT a.id, a.prediction, a.label, a.confidence,
                              a.all_probabilities, a.color, a.comment, a.created_at,
                              p.nom, p.prenom, p.cin,
                              r.name as radiologue_name
                       FROM analyses a
                       JOIN patients p ON p.id = a.patient_id
                       JOIN radiologues r ON r.id = a.radiologue_id
                       WHERE a.patient_id = %s
                       ORDER BY a.created_at DESC""",
                    (patient_id,)
                )
            else:
                cur.execute(
                    """SELECT a.id, a.prediction, a.label, a.confidence,
                              a.all_probabilities, a.color, a.comment, a.created_at,
                              p.nom, p.prenom, p.cin,
                              r.name as radiologue_name
                       FROM analyses a
                       JOIN patients p ON p.id = a.patient_id
                       JOIN radiologues r ON r.id = a.radiologue_id
                       ORDER BY a.created_at DESC
                       LIMIT 100"""
                )
            rows = cur.fetchall()
    analyses = []
    for r in rows:
        item = dict(r)
        if item.get('created_at'):
            item['created_at'] = item['created_at'].isoformat()
        analyses.append(item)
    return jsonify({'success': True, 'analyses': analyses})


@app.route('/analyses/<int:aid>', methods=['GET'])
@login_required
def get_analyse(aid):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT a.*, p.nom, p.prenom, p.cin, p.date_naissance, p.sexe,
                          p.telephone, p.medecin, r.name as radiologue_name, r.role as radiologue_role
                   FROM analyses a
                   JOIN patients p ON p.id = a.patient_id
                   JOIN radiologues r ON r.id = a.radiologue_id
                   WHERE a.id = %s""",
                (aid,)
            )
            row = cur.fetchone()
    if not row:
        return jsonify({'success': False, 'error': 'Analyse non trouvée'}), 404
    item = dict(row)
    for k in ('created_at', 'date_naissance'):
        if item.get(k):
            item[k] = item[k].isoformat() if hasattr(item[k], 'isoformat') else str(item[k])
    return jsonify({'success': True, 'analyse': item})

# ─── Vérification CLIP (avant sélection du patient) ───────────────────────────
@app.route('/verify-image', methods=['POST'])
@login_required
def verify_image():
    temp_path = None
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Format non supporté. Utilisez JPG ou PNG'}), 400

        suffix = '.png' if file.filename.lower().endswith('.png') else '.jpg'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        is_valid, info = classifier.gatekeeper.verify_image(temp_path)
        if not is_valid:
            return jsonify({'success': False, 'error': f"Image rejetée : {info}"}), 400

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': f"Erreur interne : {str(e)}"}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass
# ─── Prédiction ───────────────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
@login_required
def predict():
    temp_path = None
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400

        file = request.files['image']
        patient_id = request.form.get('patient_id')
        comment    = request.form.get('comment', '')

        if not patient_id:
            return jsonify({'success': False, 'error': 'patient_id requis'}), 400
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Format non supporté. Utilisez JPG ou PNG'}), 400

        # Fichier temporaire
        suffix = '.png' if file.filename.lower().endswith('.png') else '.jpg'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        # Gatekeeper CLIP
        is_valid, info = classifier.gatekeeper.verify_image(temp_path)
        if not is_valid:
            return jsonify({'success': False, 'error': f"Image rejetée : {info}"}), 400

        # Prédiction
        result      = classifier.predict(temp_path)
        gradcam_res = classifier.predict_with_gradcam(temp_path)
        gradcam_b64 = generate_gradcam_image(gradcam_res)

        # Image originale en base64
        with open(temp_path, 'rb') as f:
            img_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Sauvegarde en base
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO analyses
                       (patient_id, radiologue_id, prediction, label, confidence,
                        all_probabilities, color, gradcam_base64, image_base64, comment)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (patient_id, session['radiologue_id'],
                     result['class'], result['label'], result['confidence'],
                     json.dumps(result['all_probabilities']),
                     result['color'], gradcam_b64, img_b64, comment)
                )
                analyse_id = cur.fetchone()['id']

        return jsonify({
            'success':          True,
            'analyse_id':       analyse_id,
            'prediction':       result['label'],
            'class':            result['class'],
            'confidence':       result['confidence'],
            'all_probabilities': result['all_probabilities'],
            'color':            result['color'],
            'gradcam':          gradcam_b64,
            'image_b64':        img_b64,
        })

    except Exception as e:
        return jsonify({'success': False, 'error': f"Erreur interne : {str(e)}"}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass


@app.route('/analyses/<int:aid>/comment', methods=['PATCH'])
@login_required
def update_comment(aid):
    data    = request.get_json()
    comment = data.get('comment', '')
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE analyses SET comment=%s WHERE id=%s", (comment, aid))
    return jsonify({'success': True})


# ─── Health ────────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': True})


# ─── Démarrage ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("\n" + "=" * 55)
    print("🚀  RadioScan AI — API (Flask + PostgreSQL)")
    print("=" * 55)
    print(f"📁  Modèle  : {MODEL_PATH}")
    print(f"🌐  URL     : http://localhost:5000")
    print(f"🔗  Routes  : /auth/login  /patients  /predict  /analyses")
    print("=" * 55 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)