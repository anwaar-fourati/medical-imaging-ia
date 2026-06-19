// frontend/src/components/Dashboard.js
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Activity, Upload, AlertCircle, LogOut,
  FileText, Download, RefreshCw, Users,
  Eye, Maximize2, X, ChevronRight, Search,
  Clock, Stethoscope, Check, Loader
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { predictImage, getPatients, logoutUser } from '../services/api';
import { generatePDF } from '../utils/generatePDF';
import Patients from './Patients';
import Historique from './Historique';
import './Dashboard.css';

// ─── Méta classes ─────────────────────────────────────────────────────────────
const CLASS_META = {
  covid:     { label: 'COVID-19',  color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)'  },
  normal:    { label: 'Normal',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)'   },
  pneumonia: { label: 'Pneumonie', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
};

// ─── Modal Zoom ───────────────────────────────────────────────────────────────
function ZoomModal({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="zoom-modal"
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.92,    opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()} className="zoom-modal-content"
      >
        <img src={src} alt={alt} className="zoom-modal-image" />
        <button onClick={onClose} className="zoom-modal-close"><X size={17} /></button>
        <div className="zoom-modal-caption">{alt}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Carte image avec zoom ────────────────────────────────────────────────────
function ImageCard({ label, src, caption, isBase64 }) {
  const [zoomed, setZoomed] = useState(false);
  const imgSrc = isBase64 ? `data:image/png;base64,${src}` : src;
  return (
    <>
      <div className="image-card">
        <div className="image-card-header">
          <span className="image-card-label">{label}</span>
          <button onClick={() => setZoomed(true)} className="zoom-button">
            <Maximize2 size={13} color="#93c5fd" /><span>Agrandir</span>
          </button>
        </div>
        <div className="image-wrapper" onClick={() => setZoomed(true)}>
          <img src={imgSrc} alt={label} className="image-preview" />
          <div className="image-overlay"><Maximize2 size={20} color="rgba(255,255,255,0.8)" /></div>
        </div>
        {caption && <p className="image-caption">{caption}</p>}
      </div>
      <AnimatePresence>
        {zoomed && <ZoomModal src={imgSrc} alt={label} onClose={() => setZoomed(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Sélecteur de patient ─────────────────────────────────────────────────────
function PatientSelector({ onSelect, onCancel }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const fetchPatients = useCallback(async (q = '') => {
    try {
      setLoading(true);
      const data = await getPatients(q);
      setPatients(data.patients || []);
    } catch {
      toast.error('Impossible de charger les patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchPatients]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ps-container"
    >
      {/* Header */}
      <div className="ps-header">
        <div className="ps-header-icon"><Stethoscope size={18} color="#93c5fd" /></div>
        <div>
          <h3 className="ps-title">Sélectionner un patient</h3>
          <p className="ps-subtitle">Choisissez le patient associé à cette analyse</p>
        </div>
      </div>

      {/* Search */}
      <div className="ps-search-wrap">
        <Search size={14} color="#4b6a9b" className="ps-search-icon" />
        <input
          className="ps-search"
          placeholder="Rechercher par nom, prénom ou CIN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {search && (
          <button className="ps-search-clear" onClick={() => setSearch('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="ps-list">
        {loading ? (
          <div className="ps-loading">
            <Loader size={18} color="#3b82f6" className="ps-spin" />
            <span>Chargement…</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="ps-empty">
            <p>{search ? 'Aucun patient trouvé.' : 'Aucun patient enregistré.'}</p>
          </div>
        ) : (
          patients.map(p => (
            <div
              key={p.id}
              className={`ps-item ${selected?.id === p.id ? 'ps-item-selected' : ''}`}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
            >
              <div className="ps-item-avatar">
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div className="ps-item-info">
                <div className="ps-item-name">{p.prenom} {p.nom}</div>
                <div className="ps-item-details">
                  <span className="ps-item-cin">CIN : {p.cin}</span>
                  {p.date_naissance && <span> · {p.date_naissance}</span>}
                  {p.sexe && <span> · {p.sexe}</span>}
                </div>
              </div>
              {selected?.id === p.id && (
                <div className="ps-item-check"><Check size={14} /></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="ps-actions">
        <button className="ps-cancel" onClick={onCancel}>← Changer d'image</button>
        <button
          className="ps-confirm"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          Lancer l'analyse
          <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Vue résultat ──────────────────────────────────────────────────────────────
function ResultView({ result, patient, user, preview, onReset }) {
  const [comment, setComment]   = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const meta = CLASS_META[result.class] || CLASS_META.normal;

  const imgBase64 = preview?.startsWith('data:')
    ? preview.split(',')[1]
    : result.image_b64 || '';
  const imgFormat = preview?.startsWith('data:image/png') ? 'PNG' : 'JPEG';

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF({
        user,
        patient: {
          nom: patient.nom, prenom: patient.prenom, cin: patient.cin,
          dateNaissance: patient.date_naissance, sexe: patient.sexe,
          telephone: patient.telephone, medecin: patient.medecin,
        },
        result,
        imgBase64,
        imgFormat,
        gradcamSrc: result.gradcam,
        comment,
      });
      toast.success('Rapport PDF généré !');
    } catch {
      toast.error('Erreur lors de la génération PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      {/* Patient banner */}
      <div className="patient-banner">
        <Users size={14} color="#93c5fd" />
        <div className="patient-banner-content">
          <span className="patient-name">{patient.prenom} {patient.nom}</span>
          <span className="patient-sep">·</span>
          <span className="patient-detail">CIN : {patient.cin}</span>
          {patient.date_naissance && <><span className="patient-sep">·</span><span className="patient-detail">Né(e) le {patient.date_naissance}</span></>}
          {patient.sexe && <><span className="patient-sep">·</span><span className="patient-detail">{patient.sexe}</span></>}
          {patient.medecin && <><span className="patient-sep">·</span><span className="patient-detail">Médecin : {patient.medecin}</span></>}
        </div>
      </div>

      {/* Grid résultats */}
      <div className="results-grid">
        {/* Diagnostic */}
        <div className={`diagnosis-card ${result.class}`}>
          <div className="diagnosis-label">Diagnostic IA</div>
          <div className="diagnosis-value" style={{ color: meta.color }}>{meta.label}</div>
          <div className="diagnosis-divider" />
          <div className="diagnosis-label">Confiance</div>
          <div className="diagnosis-confidence" style={{ color: meta.color }}>{result.confidence}%</div>
          <div className="diagnosis-divider" />
          <div className="probabilities">
            {Object.entries(result.all_probabilities).map(([cls, prob]) => {
              const cm   = CLASS_META[cls] || CLASS_META.normal;
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

        {/* Images */}
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

      {/* Observations */}
      <div className="observations-card">
        <div className="observations-header">
          <FileText size={14} color="#93c5fd" />
          <span className="observations-label">Observations du radiologue</span>
        </div>
        <textarea
          className="observations-textarea"
          placeholder="Rédigez vos observations cliniques, remarques ou recommandations…"
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
  );
}

// ─── Composant principal Dashboard ────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  // Navigation
  const [activeTab, setActiveTab] = useState('analyse'); // 'analyse' | 'patients' | 'historique'

  // Analyse flow: 'upload' | 'select-patient' | 'loading' | 'result'
  const [step, setStep]         = useState('upload');
  const [result, setResult]     = useState(null);
  const [preview, setPreview]   = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [verifying, setVerifying]   = useState(false);

  // Écoute expiration session
  useEffect(() => {
    const handler = () => {
      toast.error('Session expirée, veuillez vous reconnecter.');
      onLogout();
    };
    window.addEventListener('session_expired', handler);
    return () => window.removeEventListener('session_expired', handler);
  }, [onLogout]);

  // ── Drop ──────────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview immédiate
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setPendingFile(file);
    setVerifying(true);

    // On appelle le backend juste pour la validation CLIP
    // (la vraie prédiction se fera après sélection patient)
    // Pour simplifier : on pré-valide via un appel minimal
    // En pratique on peut juste vérifier côté client que c'est une image
    // et déléguer la validation CLIP au moment du predict.
    // Ici on passe directement à select-patient pour ne pas
    // envoyer l'image deux fois.
    setVerifying(false);
    setStep('select-patient');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    disabled: verifying || step === 'loading',
  });

  // ── Sélection patient + lancement analyse ────────────────────────────────
  const handlePatientSelected = async (patient) => {
    setSelectedPatient(patient);
    setStep('loading');

    try {
      const data = await predictImage(pendingFile, patient.id);
      if (data.success) {
        setResult(data);
        setStep('result');
        toast.success('Analyse terminée avec succès !');
      } else {
        toast.error(data.error || "Erreur lors de l'analyse");
        setStep('upload');
        setPreview(null);
        setPendingFile(null);
      }
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion');
      setStep('upload');
      setPreview(null);
      setPendingFile(null);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setResult(null);
    setPreview(null);
    setPendingFile(null);
    setSelectedPatient(null);
    setStep('upload');
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    onLogout();
  };

  // ─── Initiales ────────────────────────────────────────────────────────────
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dashboard">
      <Toaster position="top-right" toastOptions={{ className: 'dashboard-toast' }} />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Activity size={20} color="#93c5fd" /></div>
          <div>
            <div className="sidebar-brand-name">RadioScan AI</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`sidebar-nav-item ${activeTab === 'analyse' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analyse'); }}
          >
            <Eye size={15} />
            <span>Analyse</span>
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <Users size={15} />
            <span>Patients</span>
          </div>
          <div
            className={`sidebar-nav-item ${activeTab === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveTab('historique')}
          >
            <Clock size={15} />
            <span>Historique</span>
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout" title="Déconnexion">
            <LogOut size={14} color="#64748b" />
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="main-content">
        <AnimatePresence mode="wait">

          {/* ── TAB : ANALYSE ─────────────────────────────────────────────── */}
          {activeTab === 'analyse' && (
            <motion.div
              key="analyse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div className="topbar">
                <div>
                  <h1 className="page-title">Analyse Radiographique</h1>
                  <p className="page-subtitle">Importez une radiographie thoracique et sélectionnez un patient</p>
                </div>
                {step === 'result' && (
                  <button onClick={reset} className="reset-button">
                    <RefreshCw size={13} /> Nouvelle analyse
                  </button>
                )}
              </div>

              <div className="content-area">
                {/* Upload */}
                {step === 'upload' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="upload-wrapper">
                    <div
                      {...getRootProps()}
                      className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${verifying ? 'dropzone-disabled' : ''}`}
                    >
                      <input {...getInputProps()} disabled={verifying} />
                      <div className="upload-icon">
                        {verifying
                          ? <div className="upload-spinner-small" />
                          : <Upload size={28} color={isDragActive ? '#93c5fd' : '#4b6a9b'} />}
                      </div>
                      <h3 className="upload-title">
                        {verifying ? 'Vérification…' : isDragActive ? 'Déposez ici' : 'Glissez-déposez une radiographie'}
                      </h3>
                      <p className="upload-subtitle">
                        {verifying ? 'Analyse CLIP en cours…' : 'ou cliquez pour sélectionner un fichier'}
                      </p>
                      <div className="upload-tags">
                        <span className="tag tag-primary">JPG</span>
                        <span className="tag tag-primary">PNG</span>
                        <span className="tag tag-secondary">Max 16 MB</span>
                      </div>
                    </div>
                    
                  </motion.div>
                )}

                {/* Sélection patient */}
                {step === 'select-patient' && (
                  <div className="select-patient-layout">
                    {/* Aperçu image */}
                    {preview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="preview-aside"
                      >
                        <div className="preview-aside-label">Radiographie sélectionnée</div>
                        <img src={preview} alt="preview" className="preview-aside-img" />
                      </motion.div>
                    )}
                    <PatientSelector
                      onSelect={handlePatientSelected}
                      onCancel={() => { setStep('upload'); setPreview(null); setPendingFile(null); }}
                    />
                  </div>
                )}

                {/* Loading */}
                <AnimatePresence>
                  {step === 'loading' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="loading-wrapper"
                    >
                      <div className="loading-spinner" />
                      <p className="loading-title">Analyse en cours…</p>
                      <p className="loading-subtitle">CLIP + VGG19 + Grad-CAM</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Résultat */}
                {step === 'result' && result && (
                  <ResultView
                    result={result}
                    patient={selectedPatient}
                    user={user}
                    preview={preview}
                    onReset={reset}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB : PATIENTS ────────────────────────────────────────────── */}
          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div className="topbar">
                <div>
                  <h1 className="page-title">Gestion des patients</h1>
                  <p className="page-subtitle">Créez, modifiez ou supprimez des dossiers patients</p>
                </div>
              </div>
              <div className="content-area">
                <Patients />
              </div>
            </motion.div>
          )}

          {/* ── TAB : HISTORIQUE ──────────────────────────────────────────── */}
          {activeTab === 'historique' && (
            <motion.div
              key="historique"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div className="topbar">
                <div>
                  <h1 className="page-title">Historique des analyses</h1>
                  <p className="page-subtitle">Consultez toutes les analyses effectuées</p>
                </div>
              </div>
              <div className="content-area">
                <Historique />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}