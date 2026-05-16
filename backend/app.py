# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import base64
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
from PIL import Image
import numpy as np
from model_utils import MedicalImageClassifier

app = Flask(__name__)

# Configuration CORS pour React (port 3000)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configuration des dossiers
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
RESULTS_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'results')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Chargement du modèle
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'vgg19_hybrid.pth')
classifier = MedicalImageClassifier(MODEL_PATH, num_classes=3)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_gradcam_image(image_path, result):
    """Génère une image Grad-CAM superposée"""
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    axes[0].imshow(result['original_image'])
    axes[0].set_title('Image Originale', fontsize=12)
    axes[0].axis('off')
    
    axes[1].imshow(result['original_image'])
    axes[1].imshow(result['heatmap'], cmap='jet', alpha=0.45)
    axes[1].set_title(f'Grad-CAM: {result["label"]}\nConfiance: {result["confidence"]:.1f}%', fontsize=12)
    axes[1].axis('off')
    
    axes[2].imshow(result['original_image'])
    axes[2].imshow(result['heatmap'], cmap='jet', alpha=0.6)
    axes[2].set_title("Régions d'intérêt", fontsize=12)
    axes[2].axis('off')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    
    return base64.b64encode(buf.getvalue()).decode('utf-8')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': True})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Vérification de base (si le fichier est présent)
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Aucune image fournie'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Format non supporté. Utilisez JPG ou PNG'}), 400
        
        # 2. Sauvegarde temporaire de l'image
        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # ==============================================================
        # 3. ÉTAPE DE FILTRAGE (Le "Gardien")
        # On vérifie si l'image est bien une radiographie du thorax
        # ==============================================================
        # Note : utilise ici le nom de la fonction que tu as créé (ex: verify_image ou is_lung_xray)
        is_valid, info = classifier.gatekeeper.verify_image(filepath)
        
        if not is_valid:
            os.remove(filepath) # Supprimer l'image immédiatement si c'est un chat/chien/IRM
            return jsonify({
                'success': False, 
                'error': f"Image rejetée : {info}" 
            }), 400
        # ==============================================================

        # 4. PRÉDICTION MÉDICALE (Uniquement si l'image est valide)
        # Appel à ton modèle VGG19 hybride
        result = classifier.predict(filepath)
        
        # 5. GÉNÉRATION GRAD-CAM
        # Pour visualiser les zones d'intérêt sur le poumon
        gradcam_result = classifier.predict_with_gradcam(filepath)
        gradcam_image = generate_gradcam_image(filepath, gradcam_result)
        
        # 6. NETTOYAGE ET RÉPONSE
        os.remove(filepath) # Supprimer l'image après traitement
        
        return jsonify({
            'success': True,
            'prediction': result['label'],
            'class': result['class'],
            'confidence': result['confidence'],
            'all_probabilities': result['all_probabilities'],
            'color': result['color'],
            'gradcam': gradcam_image
        })
    
    except Exception as e:
        # En cas d'erreur critique, on essaie de supprimer le fichier si il existe
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'success': False, 'error': f"Erreur interne : {str(e)}"}), 500
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 API de diagnostic médical")
    print("="*50)
    print(f"📁 Modèle chargé: {MODEL_PATH}")
    print(f"🌐 API accessible sur: http://localhost:5000")
    print(f"🔗 Endpoint: POST /predict")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False)