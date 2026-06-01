import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Activity, Upload, AlertCircle, LogOut,
  FileText, Download, RefreshCw, User, ChevronRight, Eye, Maximize2, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { predictImage } from '../services/api';
import { generatePDF } from '../utils/generatePDF';
import './Dashboard.css';

// Métadonnées des classes de diagnostic
const CLASS_META = {
  covid:     { label: 'COVID-19',  color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)'  },
  normal:    { label: 'Normal',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)'   },
  pneumonia: { label: 'Pneumonie', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
};

// Patient vide
const EMPTY_PATIENT = { 
  nom: '', prenom: '', cin: '', dateNaissance: '', sexe: '', telephone: '', medecin: '' 
};


// Composant: Champ de formulaire
function Field({ label, name, placeholder, half, value, onChange, error, required }) {
  return (
    <div className={`field ${half ? 'half' : ''}`}>
      <label className="field-label">
        {label}{required && <span className="required">*</span>}
      </label>
      <input
        className={`field-input ${error ? 'field-input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(name, e.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// Composant: Formulaire patient
function PatientForm({ onSubmit, onBack, preview }) {
  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setPatient(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!patient.nom.trim()) newErrors.nom = 'Requis';
    if (!patient.prenom.trim()) newErrors.prenom = 'Requis';
    if (!patient.cin.trim()) newErrors.cin = 'Requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(patient);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="patient-form">
      <div className="patient-form-header">
        <div className="patient-form-header-left">
          <div className="patient-form-icon"><User size={18} color="#93c5fd" /></div>
          <div>
            <div className="patient-form-title">Informations du patient</div>
            <div className="patient-form-subtitle">Renseignez les coordonnées avant de lancer l'analyse</div>
          </div>
        </div>
        {preview && <img src={preview} alt="preview" className="patient-preview-thumb" />}
      </div>

      <div className="patient-form-grid">
        <Field label="Nom" name="nom" placeholder="Ben Ahmed" half value={patient.nom} onChange={handleChange} error={errors.nom} required />
        <Field label="Prénom" name="prenom" placeholder="Karim" half value={patient.prenom} onChange={handleChange} error={errors.prenom} required />
        <Field label="CIN" name="cin" placeholder="12345678" half value={patient.cin} onChange={handleChange} error={errors.cin} required />

        <div className="field half">
          <label className="field-label">Sexe</label>
          <select className="field-input" value={patient.sexe} onChange={e => handleChange('sexe', e.target.value)}>
            <option value="">— Sélectionner —</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
        </div>

        <Field label="Date de naissance" name="dateNaissance" placeholder="jj/mm/aaaa" half value={patient.dateNaissance} onChange={handleChange} />
        <Field label="Téléphone" name="telephone" placeholder="+216 XX XXX XXX" half value={patient.telephone} onChange={handleChange} />
        <Field label="Médecin traitant" name="medecin" placeholder="Dr. Dupont" value={patient.medecin} onChange={handleChange} />
      </div>

      <p className="patient-form-note">* Champs obligatoires</p>

      <div className="patient-form-actions">
        <button onClick={onBack} className="back-button-custom">← Changer de fichier</button>
        <button onClick={handleSubmit} className="submit-button-custom">
          Lancer l'analyse
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// Composant: Modal de zoom
function ZoomModal({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="zoom-modal"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="zoom-modal-content"
      >
        <img src={src} alt={alt} className="zoom-modal-image" />
        <button onClick={onClose} className="zoom-modal-close">
          <X size={17} />
        </button>
        <div className="zoom-modal-caption">{alt}</div>
      </motion.div>
    </motion.div>
  );
}

// Composant: Carte image avec zoom
function ImageCard({ label, src, caption, isBase64 }) {
  const [zoomed, setZoomed] = useState(false);
  const imgSrc = isBase64 ? `data:image/png;base64,${src}` : src;

  return (
    <>
      <div className="image-card">
        <div className="image-card-header">
          <span className="image-card-label">{label}</span>
          <button onClick={() => setZoomed(true)} className="zoom-button" title="Agrandir">
            <Maximize2 size={13} color="#93c5fd" />
            <span>Agrandir</span>
          </button>
        </div>
        <div className="image-wrapper" onClick={() => setZoomed(true)}>
          <img src={imgSrc} alt={label} className="image-preview" />
          <div className="image-overlay">
            <Maximize2 size={20} color="rgba(255,255,255,0.8)" />
          </div>
        </div>
        {caption && <p className="image-caption">{caption}</p>}
      </div>
      {zoomed && <ZoomModal src={imgSrc} alt={label} onClose={() => setZoomed(false)} />}
    </>
  );
}

// Composant principal Dashboard
export default function Dashboard({ user, onLogout }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'patient' | 'loading' | 'result'
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [imgBase64, setImgBase64] = useState(null);
  const [imgFormat, setImgFormat] = useState('JPEG');
  const [patient, setPatient] = useState(null);
  const [comment, setComment] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  // Ajoutez cet état avec les autres useState
const [verifying, setVerifying] = useState(false);
  // Gestion du drop d'image
  const onDrop = useCallback(async (acceptedFiles) => {
  const file = acceptedFiles[0];
  if (!file) return;

  const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
  setImgFormat(format);

  // Afficher la preview immédiatement
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result;
    setPreview(dataUrl);
    setImgBase64(dataUrl.split(',')[1]);
  };
  reader.readAsDataURL(file);
  
  setPendingFile(file);
  setVerifying(true);

  try {
    const data = await predictImage(file);
    
    if (data.success) {
      setResult(data);
      setStep('patient');
      toast.success('Image validée ! Veuillez compléter les informations patient.');
    } else {
      toast.error(data.error || "Image non valide pour l'analyse");
      setStep('upload');
      setPreview(null);
      setPendingFile(null);
      setResult(null);
    }
  } catch (err) {
    toast.error(err.message || "Erreur de connexion au serveur");
    setStep('upload');
    setPreview(null);
    setPendingFile(null);
    setResult(null);
  } finally {
    setVerifying(false);
  }
}, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    disabled: step === 'loading',
  });

  // Soumission du formulaire patient + appel API
  // Modifiez la fonction handlePatientSubmit
const handlePatientSubmit = async (patientData) => {
  setPatient(patientData);
  setStep('loading');
  
  // Simuler un petit délai pour l'effet visuel
  // (le résultat est déjà dans result, on ne refait pas l'appel)
  setTimeout(() => {
    setStep('result');
    toast.success('Analyse terminée avec succès !');
  }, 800);
};

  // Réinitialisation complète
  const reset = () => {
    setResult(null);
    setPreview(null);
    setImgBase64(null);
    setPatient(null);
    setPendingFile(null);
    setComment('');
    setStep('upload');
  };

  // Génération du PDF
  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF({ user, patient, result, imgBase64, imgFormat, gradcamSrc: result.gradcam, comment });
      toast.success('Rapport PDF généré !');
    } catch {
      toast.error('Erreur lors de la génération PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const meta = result ? CLASS_META[result.class] || CLASS_META.normal : null;

  return (
    <div className="dashboard">
      <Toaster position="top-right" toastOptions={{ className: 'dashboard-toast' }} />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Activity size={20} color="#93c5fd" /></div>
          <div>
            <div className="sidebar-brand-name">RadioScan AI</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-item active">
            <Eye size={15} />
            Analyse
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button onClick={onLogout} className="sidebar-logout" title="Déconnexion">
            <LogOut size={14} color="#64748b" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 className="page-title">Analyse Radiographique</h1>
            <p className="page-subtitle">Importez une radiographie thoracique pour obtenir un diagnostic IA</p>
          </div>
          {result && (
            <button onClick={reset} className="reset-button">
              <RefreshCw size={13} /> Nouvelle analyse
            </button>
          )}
        </div>

        <div className="content-area">
          {/* Upload zone */}
          {step === 'upload' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="upload-wrapper">
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${verifying ? 'dropzone-disabled' : ''}`}>
                <input {...getInputProps()} disabled={verifying} />
                <div className="upload-icon">
                  {verifying ? (
      <div className="upload-spinner-small" />
    ) : (
      <Upload size={28} color={isDragActive ? '#93c5fd' : '#4b6a9b'} />
    )}
                </div>
                <h3 className="upload-title">
    {verifying ? 'Vérification en cours...' : (isDragActive ? 'Déposez ici' : 'Glissez-déposez une radiographie')}
  </h3>
  <p className="upload-subtitle">
    {verifying ? 'Analyse CLIP en cours...' : 'ou cliquez pour sélectionner un fichier'}
  </p>
                <div className="upload-tags">
                  <span className="tag tag-primary">JPG</span>
                  <span className="tag tag-primary">PNG</span>
                  <span className="tag tag-secondary">Max 16 MB</span>
                </div>
              </div>
              <div className="info-bar">
                <span className="info-bar-icon">⚡</span>
                <span>Filtrage automatique CLIP — images non-thoraciques rejetées</span>
              </div>
            </motion.div>
          )}

          {/* Patient form */}
          {step === 'patient' && (
            <PatientForm
              preview={preview}
              onSubmit={handlePatientSubmit}
              onBack={() => { setStep('upload'); setPreview(null); setPendingFile(null); }}
            />
          )}

          {/* Loading */}
          <AnimatePresence>
            {step === 'loading' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="loading-wrapper">
                <div className="loading-spinner" />
                <p className="loading-title">Analyse en cours…</p>
                <p className="loading-subtitle">CLIP + VGG19 + Grad-CAM</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {step === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              {/* Patient info banner */}
              {patient && (
                <div className="patient-banner">
                  <User size={14} color="#93c5fd" />
                  <div className="patient-banner-content">
                    <span className="patient-name">{patient.prenom} {patient.nom}</span>
                    <span className="patient-sep">·</span>
                    <span className="patient-detail">CIN : {patient.cin}</span>
                    {patient.dateNaissance && <><span className="patient-sep">·</span><span className="patient-detail">Né(e) le {patient.dateNaissance}</span></>}
                    {patient.sexe && <><span className="patient-sep">·</span><span className="patient-detail">{patient.sexe}</span></>}
                    {patient.telephone && <><span className="patient-sep">·</span><span className="patient-detail">{patient.telephone}</span></>}
                    {patient.medecin && <><span className="patient-sep">·</span><span className="patient-detail">Médecin : {patient.medecin}</span></>}
                  </div>
                </div>
              )}

              {/* Results grid */}
              <div className="results-grid">
                {/* Diagnosis card */}
                <div className={`diagnosis-card ${result.class}`}>
                  <div className="diagnosis-label">Diagnostic IA</div>
                  <div className="diagnosis-value" style={{ color: meta.color }}>{meta.label}</div>
                  <div className="diagnosis-divider" />
                  <div className="diagnosis-label">Confiance</div>
                  <div className="diagnosis-confidence" style={{ color: meta.color }}>{result.confidence}%</div>
                  <div className="diagnosis-divider" />
                  
                  <div className="probabilities">
                    {Object.entries(result.all_probabilities).map(([cls, prob]) => {
                      const cm = CLASS_META[cls] || CLASS_META.normal;
                      const isTop = cls === result.class;
                      return (
                        <div key={cls} className="prob-item">
                          <div className="prob-header">
                            <span className={`prob-label ${isTop ? 'prob-label-bold' : ''}`} style={{ color: isTop ? cm.color : '#7a93b8' }}>
                              {cm.label}
                            </span>
                            <span className="prob-value" style={{ color: isTop ? cm.color : '#4b6a9b' }}>
                              {prob.toFixed(1)}%
                            </span>
                          </div>
                          <div className="prob-bar-bg">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${prob}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="prob-bar-fill"
                              style={{ background: cm.color, opacity: isTop ? 1 : 0.28 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Images row */}
                <div className="images-row">
                  <ImageCard label="Radiographie originale" src={preview} isBase64={false} />
                  <ImageCard 
                    label={`Grad-CAM — ${meta.label}`} 
                    src={result.gradcam} 
                    isBase64={true}
                    caption="Zones d'attention du modèle (rouge = forte activation)"
                  />
                </div>
              </div>

              {/* Observations and actions */}
              <div className="observations-card">
                <div className="observations-header">
                  <FileText size={14} color="#93c5fd" />
                  <span className="observations-label">Observations du radiologue</span>
                </div>
                <textarea
                  className="observations-textarea"
                  placeholder="Rédigez vos observations cliniques, remarques ou recommandations à l'attention du médecin traitant…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                />
                <div className="actions-row">
                  <div className="disclaimer">
                    <AlertCircle size={13} color="#fbbf24" />
                    <span>
                      <strong>Outil d'aide au diagnostic.</strong> Résultat à confirmer par un professionnel de santé.
                    </span>
                  </div>
                  <button onClick={handlePDF} disabled={pdfLoading} className="pdf-button">
                    {pdfLoading ? <span className="pdf-spinner" /> : <Download size={15} />}
                    {pdfLoading ? 'Génération…' : 'Générer le rapport PDF'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}