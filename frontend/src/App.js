import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { predictImage } from './services/api';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Prediction
    setIsLoading(true);
    setResult(null);

    try {
      const predictionResult = await predictImage(file);
      if (predictionResult.success) {
        setResult(predictionResult);
        toast.success('Analyse terminée avec succès!');
      } else {
        toast.error(predictionResult.error || 'Erreur lors de l\'analyse');
      }
    } catch (error) {
      toast.error(error.message);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    disabled: isLoading,
  });

  const resetAnalysis = () => {
    setResult(null);
    setPreview(null);
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <Activity size={32} />
            <h1>Diagnostic IA Médicale</h1>
          </div>
          <div className="badge">
            VGG19 + CBAM | Accuracy: 97.25%
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Zone d'upload */}
          {!result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="upload-section"
            >
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload size={48} />
                <h3>
                  {isDragActive
                    ? 'Déposez l\'image ici'
                    : 'Glissez-déposez une radiographie thoracique'}
                </h3>
                <p>ou cliquez pour sélectionner</p>
                <small>Formats: JPG, PNG | Taille max: 16MB</small>
              </div>
            </motion.div>
          )}

          {/* Loading spinner */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loading-container"
              >
                <div className="spinner"></div>
                <p>Analyse en cours...</p>
                <small>Le modèle analyse les régions d'intérêt</small>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Résultats */}
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="results-section"
            >
              <button onClick={resetAnalysis} className="reset-btn">
                <X size={20} />
                Nouvelle analyse
              </button>

              <div className="result-card">
                <div className="diagnostic-header">
                  <div
                    className="diagnostic-badge"
                    style={{ backgroundColor: `${result.color}20`, borderColor: result.color }}
                  >
                    {result.prediction}
                  </div>
                  <div className="confidence-circle">
                    <div className="confidence-value" style={{ color: result.color }}>
                      {result.confidence}%
                    </div>
                    <div className="confidence-label">Confiance</div>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="preview-section">
                    {preview && (
                      <img src={preview} alt="Preview" className="preview-image" />
                    )}
                  </div>

                  <div className="probabilities-section">
                    <h4>Probabilités par classe</h4>
                    {Object.entries(result.all_probabilities).map(([cls, prob]) => (
                      <div key={cls} className="probability-item">
                        <div className="probability-label">
                          <span className="class-name">
                            {cls === 'covid' ? 'COVID-19' : cls === 'pneumonia' ? 'Pneumonie' : 'Normal'}
                          </span>
                          <span className="probability-value">{prob.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${prob}%`,
                              backgroundColor: cls === result.class ? result.color : '#e9ecef',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grad-CAM */}
                <div className="gradcam-section">
                  <h4>
                    <Activity size={18} />
                    Visualisation Grad-CAM (zones d'attention)
                  </h4>
                  <img
                    src={`data:image/png;base64,${result.gradcam}`}
                    alt="Grad-CAM visualization"
                    className="gradcam-image"
                  />
                </div>

                <div className="disclaimer">
                  <AlertCircle size={16} />
                  <small>
                    <strong>Interprétation :</strong> Le modèle a analysé {result.prediction.toLowerCase()}
                    avec une confiance de {result.confidence}%. Ce résultat doit être confirmé par un radiologue.
                  </small>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            <Activity size={14} />
            Modèle VGG19 + CBAM + ResidualClassifier | Entraîné sur 6,939 radiographies
          </p>
          <small>
            Outil d'aide au diagnostic - Consultation médicale requise
          </small>
        </div>
      </footer>
    </div>
  );
}

export default App;