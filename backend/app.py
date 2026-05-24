# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, uuid, base64
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
from PIL import Image
import numpy as np
from model_utils import MedicalImageClassifier

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
RESULTS_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'results')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'vgg19_hybrid.pth')
classifier = MedicalImageClassifier(MODEL_PATH, num_classes=3)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_gradcam_image(result):
    """
    Génère UNIQUEMENT le panneau de prédiction Grad-CAM (image originale + heatmap).
    Retourne un base64 PNG d'une seule image (pas le triptyque).
    """
    fig, ax = plt.subplots(1, 1, figsize=(5, 5))
    ax.imshow(result['original_image'])
    ax.imshow(result['heatmap'], cmap='jet', alpha=0.5)
    ax.set_title(f"{result['label']} — {result['confidence']:.1f}%", fontsize=13, fontweight='bold', pad=10)
    ax.axis('off')
    plt.tight_layout(pad=0.5)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': True})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Format non supporté. Utilisez JPG ou PNG'}), 400

        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Gatekeeper CLIP
        is_valid, info = classifier.gatekeeper.verify_image(filepath)
        if not is_valid:
            os.remove(filepath)
            return jsonify({'success': False, 'error': f"Image rejetée : {info}"}), 400

        # Prédiction
        result = classifier.predict(filepath)

        # Grad-CAM — un seul panneau (prédiction uniquement)
        gradcam_result = classifier.predict_with_gradcam(filepath)
        gradcam_image = generate_gradcam_image(gradcam_result)

        os.remove(filepath)

        return jsonify({
            'success': True,
            'prediction': result['label'],
            'class': result['class'],
            'confidence': result['confidence'],
            'all_probabilities': result['all_probabilities'],
            'color': result['color'],
            'gradcam': gradcam_image,   # image unique : original + heatmap superposée
        })

    except Exception as e:
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'success': False, 'error': f"Erreur interne : {str(e)}"}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 RadioScan AI — API de diagnostic médical")
    print("="*50)
    print(f"📁 Modèle : {MODEL_PATH}")
    print(f"🌐 URL    : http://localhost:5000")
    print(f"🔗 Route  : POST /predict")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)