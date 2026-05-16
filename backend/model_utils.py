import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from transformers import CLIPProcessor, CLIPModel
import cv2
import numpy as np
from PIL import Image
import os

# ============================================
# DÉFINITION DES CLASSES DU MODÈLE (IDENTIQUE À L'ENTRAÎNEMENT)
# ============================================

class ChannelAttention(nn.Module):
    def __init__(self, in_channels, reduction=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        mid = max(in_channels // reduction, 4)
        self.fc = nn.Sequential(
            nn.Linear(in_channels, mid, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(mid, in_channels, bias=False)
        )
    
    def forward(self, x):
        b, c, _, _ = x.shape
        avg_out = self.fc(self.avg_pool(x).view(b, c))
        max_out = self.fc(self.max_pool(x).view(b, c))
        return x * torch.sigmoid(avg_out + max_out).view(b, c, 1, 1)


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size // 2, bias=False)
    
    def forward(self, x):
        avg_map = x.mean(dim=1, keepdim=True)
        max_map, _ = x.max(dim=1, keepdim=True)
        return x * torch.sigmoid(self.conv(torch.cat([avg_map, max_map], dim=1)))


class CBAM(nn.Module):
    def __init__(self, in_channels=512, reduction=16, kernel_size=7):
        super().__init__()
        self.channel_att = ChannelAttention(in_channels, reduction)
        self.spatial_att = SpatialAttention(kernel_size)
    
    def forward(self, x):
        return self.spatial_att(self.channel_att(x))


class ResidualClassifier(nn.Module):
    def __init__(self, num_classes, dropout_rates=(0.5, 0.4, 0.3)):
        super().__init__()
        d1, d2, d3 = dropout_rates
        self.fc1 = nn.Linear(25088, 1024)
        self.bn1 = nn.BatchNorm1d(1024)
        self.act1 = nn.ReLU(inplace=True)
        self.drop1 = nn.Dropout(d1)
        self.fc2 = nn.Linear(1024, 512)
        self.bn2 = nn.BatchNorm1d(512)
        self.act2 = nn.ReLU(inplace=True)
        self.drop2 = nn.Dropout(d2)
        self.fc3 = nn.Linear(512, 256)
        self.bn3 = nn.BatchNorm1d(256)
        self.act3 = nn.ReLU(inplace=True)
        self.drop3 = nn.Dropout(d3)
        self.skip = nn.Linear(1024, 256, bias=False)
        self.out = nn.Linear(256, num_classes)
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, nonlinearity='relu')
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.BatchNorm1d):
                nn.init.ones_(m.weight)
                nn.init.zeros_(m.bias)

    def forward(self, x):
        h1 = self.drop1(self.act1(self.bn1(self.fc1(x))))
        h2 = self.drop2(self.act2(self.bn2(self.fc2(h1))))
        h3 = self.drop3(self.act3(self.bn3(self.fc3(h2))))
        return self.out(h3 + self.skip(h1))


class VGG19_CBAM(nn.Module):
    def __init__(self, num_classes=3, use_cbam=True, use_residual=True):
        super().__init__()
        # ⚠️ IMPORTANT: On utilise weights=None pour éviter le téléchargement
        # On va charger UNIQUEMENT l'architecture, pas les poids
        backbone = models.vgg19(weights=None)
        self.features = backbone.features
        self.use_cbam = use_cbam
        if use_cbam:
            self.cbam = CBAM(in_channels=512, reduction=16, kernel_size=7)
        self.avgpool = backbone.avgpool
        self.classifier = ResidualClassifier(num_classes) if use_residual else None
    
    def forward(self, x):
        x = self.features(x)
        if self.use_cbam:
            x = self.cbam(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

class CLIPGatekeeper:
    def __init__(self, device):
        self.device = device
        # Modèle très léger de CLIP (environ 80 Mo)
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # On définit les catégories pour le filtrage
        self.labels = [
            "a chest x-ray",              # Ce qu'on veut (Index 0)
            "a brain mri scan",           # IRM Cérébral
            "a photo of an animal",       # Chat, chien
            "a photo of a person's face", # Visages
            "a bone x-ray of hand or leg",# Autres radios (main, jambe)
            "an everyday object"          # Objets divers
        ]

    def verify_image(self, image_path):
        image = Image.open(image_path).convert('RGB')
        
        # Préparation des données pour CLIP
        inputs = self.processor(
            text=self.labels, 
            images=image, 
            return_tensors="pt", 
            padding=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            # Calcul des probabilités (Softmax sur les textes)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)
            
        # Récupération des scores
        confidences = {self.labels[i]: probs[0][i].item() for i in range(len(self.labels))}
        
        # LOGIQUE DE VALIDATION :
        # L'image est acceptée UNIQUEMENT si "chest x-ray" est le gagnant 
        # ET qu'il a un score minimum (ex: 40%)
        top_label = self.labels[probs.argmax().item()]
        chest_xray_score = confidences["a chest x-ray"]

        if top_label == "a chest x-ray" and chest_xray_score > 0.45:
            return True, chest_xray_score
        else:
            # On retourne la raison du refus pour le debug
            return False, f"Détecté comme : {top_label} ({round(probs.max().item()*100)}%)"
# ============================================
# CHARGEMENT DU MODÈLE - SANS TÉLÉCHARGEMENT
# ============================================

class MedicalImageClassifier:
    def __init__(self, model_path, num_classes=3, device=None):
        self.device = device if device else torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Initialisation du gardien
        self.gatekeeper = CLIPGatekeeper(self.device)
        self.num_classes = num_classes
        self.class_names = ['covid', 'normal', 'pneumonia']
        self.class_labels = {
            'covid': 'COVID-19',
            'normal': 'Normal',
            'pneumonia': 'Pneumonie'
        }
        self.class_colors = {
            'covid': '#dc3545',
            'normal': '#28a745',
            'pneumonia': '#ffc107'
        }
        
        # Charger le modèle SANS téléchargement
        self.model = self._load_model_without_download(model_path)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        print(f"✅ Modèle chargé sur {self.device}")
        print(f"📊 Classes: {self.class_names}")
    
    def _load_model_without_download(self, model_path):
        """Charge le modèle SANS télécharger les poids ImageNet"""
        
        # 1. Créer l'architecture (sans poids pré-entraînés)
        print("🔄 Création de l'architecture VGG19...")
        model = VGG19_CBAM(num_classes=self.num_classes, use_cbam=True, use_residual=True)
        
        # 2. Charger UNIQUEMENT vos poids entraînés
        print(f"📥 Chargement des poids entraînés depuis {model_path}...")
        if os.path.exists(model_path):
            state_dict = torch.load(model_path, map_location=self.device, weights_only=True)
            model.load_state_dict(state_dict)
            print("✅ Poids chargés avec succès !")
        else:
            raise FileNotFoundError(f"❌ Modèle non trouvé: {model_path}")
        
        model = model.to(self.device)
        model.eval()
        
        # Afficher les stats
        total_params = sum(p.numel() for p in model.parameters())
        print(f"📊 Paramètres totaux: {total_params:,}")
        
        return model
    
    def preprocess_image(self, image_path):
        image = Image.open(image_path).convert('RGB')
        tensor = self.transform(image).unsqueeze(0)
        return tensor.to(self.device)
    
    def predict(self, image_path):
        tensor = self.preprocess_image(image_path)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
            predicted_class = self.class_names[predicted.item()]
            confidence_score = confidence.item() * 100
            
            all_probs = {self.class_names[i]: probabilities[0][i].item() * 100 
                        for i in range(self.num_classes)}
        
        return {
            'class': predicted_class,
            'label': self.class_labels[predicted_class],
            'confidence': round(confidence_score, 2),
            'all_probabilities': all_probs,
            'color': self.class_colors[predicted_class]
        }
    
    def predict_with_gradcam(self, image_path, target_layer_idx=28):
        """Prédiction avec Grad-CAM"""
        import matplotlib.pyplot as plt
        
        tensor = self.preprocess_image(image_path)
        target_layer = self.model.features[target_layer_idx]
        
        activations = []
        gradients = []
        
        def forward_hook(module, input, output):
            activations.append(output)
        
        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0])
        
        forward_handle = target_layer.register_forward_hook(forward_hook)
        backward_handle = target_layer.register_backward_hook(backward_hook)
        
        outputs = self.model(tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
        
        self.model.zero_grad()
        outputs[0, predicted].backward()
        
        activations = activations[0].detach()
        gradients = gradients[0].detach()
        
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=(224, 224), mode='bilinear', align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        
        forward_handle.remove()
        backward_handle.remove()
        
        original_image = np.array(Image.open(image_path).convert('RGB').resize((224, 224))) / 255.0
        
        predicted_class = self.class_names[predicted.item()]
        
        return {
            'original_image': original_image,
            'heatmap': cam,
            'class': predicted_class,
            'label': self.class_labels[predicted_class],
            'confidence': confidence.item() * 100
        }