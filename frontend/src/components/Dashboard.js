import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Activity, Upload, AlertCircle, LogOut,
  FileText, Download, RefreshCw, Zap, Eye, Maximize2, X, User, ChevronRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { predictImage } from '../services/api';
import { generatePDF } from '../utils/generatePDF';

const CLASS_META = {
  covid:     { label: 'COVID-19',  color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)'  },
  normal:    { label: 'Normal',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.3)'   },
  pneumonia: { label: 'Pneumonie', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'  },
};

const EMPTY_PATIENT = { nom: '', prenom: '', cin: '', dateNaissance: '', sexe: '', telephone: '', medecin: '' };

// ── Field component (must be outside PatientForm to avoid remount on every keystroke) ──
function Field({ label, k, placeholder, half, value, onChange, error, required }) {
  return (
    <div style={{ ...sf.field, ...(half ? sf.half : {}) }}>
      <label style={sf.label}>
        {label}{required && <span style={sf.req}>*</span>}
      </label>
      <input
        style={{ ...sf.input, ...(error ? sf.inputErr : {}) }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(k, e.target.value)}
      />
      {error && <span style={sf.errMsg}>{error}</span>}
    </div>
  );
}

// ── Patient Form ──────────────────────────────────────────────────────
function PatientForm({ onSubmit, onBack, preview }) {
  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [errors, setErrors]   = useState({});

  const handleChange = (k, v) => {
    setPatient(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!patient.nom.trim())    e.nom    = 'Requis';
    if (!patient.prenom.trim()) e.prenom = 'Requis';
    if (!patient.cin.trim())    e.cin    = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(patient); };

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={sf.wrap}>
      {/* Header */}
      <div style={sf.header}>
        <div style={sf.headerLeft}>
          <div style={sf.headerIcon}><User size={18} color="#93c5fd" /></div>
          <div>
            <div style={sf.headerTitle}>Informations du patient</div>
            <div style={sf.headerSub}>Renseignez les coordonnées avant de lancer l'analyse</div>
          </div>
        </div>
        {preview && <img src={preview} alt="preview" style={sf.thumbImg} />}
      </div>

      {/* Form grid */}
      <div style={sf.grid}>
        <Field label="Nom"              k="nom"           placeholder="Ben Ahmed"        half value={patient.nom}           onChange={handleChange} error={errors.nom}    required />
        <Field label="Prénom"           k="prenom"        placeholder="Karim"            half value={patient.prenom}        onChange={handleChange} error={errors.prenom} required />
        <Field label="CIN"              k="cin"           placeholder="12345678"         half value={patient.cin}           onChange={handleChange} error={errors.cin}    required />

        {/* Sexe select */}
        <div style={{ ...sf.field, ...sf.half }}>
          <label style={sf.label}>Sexe</label>
          <select style={sf.input} value={patient.sexe} onChange={e => handleChange('sexe', e.target.value)}>
            <option value="">— Sélectionner —</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
        </div>

        <Field label="Date de naissance" k="dateNaissance" placeholder="jj/mm/aaaa"      half value={patient.dateNaissance} onChange={handleChange} />
        <Field label="Téléphone"         k="telephone"     placeholder="+216 XX XXX XXX" half value={patient.telephone}     onChange={handleChange} />
        <Field label="Médecin traitant"  k="medecin"       placeholder="Dr. Dupont"           value={patient.medecin}       onChange={handleChange} />
      </div>

      <p style={sf.note}>* Champs obligatoires</p>

      {/* Actions */}
      <div style={sf.actions}>
        <button onClick={onBack} style={sf.backBtn}>← Changer de fichier</button>
        <button onClick={handleSubmit} style={sf.submitBtn}>
          Lancer l'analyse
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

const sf = {
  wrap: {
    maxWidth: '680px', margin: '1.5rem auto',
    background: '#0f1f3d',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', padding: '1.75rem',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem', gap: '1rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerTitle: { fontSize: '1rem', fontWeight: '700', color: '#dbeafe' },
  headerSub:   { fontSize: '0.75rem', color: '#4b6a9b', marginTop: '2px' },
  thumbImg: {
    width: '64px', height: '64px', borderRadius: '8px',
    objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
  },
  grid: {
    display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '0.75rem',
  },
  field:  { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 100%' },
  half:   { flex: '1 1 calc(50% - 6px)', minWidth: '180px' },
  label:  { fontSize: '0.72rem', fontWeight: '600', color: '#7a93b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  req:    { color: '#f87171', marginLeft: '3px' },
  input: {
    padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#dbeafe', fontSize: '0.88rem',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: "'DM Sans',sans-serif",
  },
  inputErr: { borderColor: 'rgba(248,113,113,0.5)' },
  errMsg:   { fontSize: '0.7rem', color: '#f87171', marginTop: '2px' },
  note:     { fontSize: '0.72rem', color: '#4b6a9b', marginBottom: '1.25rem' },
  actions:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  backBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px', padding: '9px 16px',
    color: '#4b6a9b', fontSize: '0.84rem', cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '10px 22px',
    background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    border: 'none', borderRadius: '9px', color: '#fff',
    fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(59,130,246,0.3)',
  },
};

// ── Image Zoom Modal ──────────────────────────────────────────────────
function ZoomModal({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2,8,23,0.96)',
        backdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            width: '80vw',
            height: '80vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            display: 'block',
          }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '-16px', right: '-16px',
            width: '38px', height: '38px', borderRadius: '50%',
            background: '#1d4ed8', border: '2px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <X size={17} />
        </button>
        <div style={{ marginTop: '14px', fontSize: '0.78rem', color: '#475569', letterSpacing: '0.03em' }}>
          {alt} — Cliquez en dehors pour fermer
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Image Card with zoom button ───────────────────────────────────────
function ImageCard({ label, src, caption, isBase64 }) {
  const [zoomed, setZoomed] = useState(false);
  const imgSrc = isBase64 ? `data:image/png;base64,${src}` : src;

  return (
    <>
      <div style={s.imgCard}>
        <div style={s.imgCardHeader}>
          <span style={s.cardLabel}>{label}</span>
          <button onClick={() => setZoomed(true)} style={s.zoomBtn} title="Agrandir">
            <Maximize2 size={13} color="#93c5fd" />
            <span style={{ fontSize: '0.7rem', color: '#93c5fd' }}>Agrandir</span>
          </button>
        </div>
        <div style={s.imgWrap} onClick={() => setZoomed(true)}>
          <img src={imgSrc} alt={label} style={s.imgPreview} />
          <div style={s.imgOverlay}>
            <Maximize2 size={20} color="rgba(255,255,255,0.8)" />
          </div>
        </div>
        {caption && <p style={s.imgCaption}>{caption}</p>}
      </div>
      {zoomed && <ZoomModal src={imgSrc} alt={label} onClose={() => setZoomed(false)} />}
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  // step: 'upload' | 'patient' | 'loading' | 'result'
  const [step, setStep]             = useState('upload');
  const [result, setResult]         = useState(null);
  const [preview, setPreview]       = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [imgBase64, setImgBase64]   = useState(null);
  const [imgFormat, setImgFormat]   = useState('JPEG');
  const [patient, setPatient]       = useState(null);
  const [comment, setComment]       = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const fmt = file.type === 'image/png' ? 'PNG' : 'JPEG';
    setImgFormat(fmt);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setImgBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
    setPendingFile(file);
    setStep('patient');
  }, []);

  const handlePatientSubmit = async (patientData) => {
    setPatient(patientData);
    setStep('loading');
    setResult(null);
    setComment('');
    try {
      const data = await predictImage(pendingFile);
      if (data.success) {
        setResult(data);
        setStep('result');
        toast.success('Analyse terminée avec succès !', { style: toastStyle });
      } else {
        toast.error(data.error || "Erreur d'analyse", { style: toastStyle });
        setStep('upload');
        setPreview(null);
      }
    } catch (err) {
      toast.error(err.message, { style: toastStyle });
      setStep('upload');
      setPreview(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    disabled: step === 'loading',
  });

  const reset = () => {
    setResult(null); setPreview(null); setImgBase64(null);
    setPatient(null); setPendingFile(null); setComment('');
    setStep('upload');
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF({ user, patient, result, imgBase64, imgFormat, gradcamSrc: result.gradcam, comment });
      toast.success('Rapport PDF généré !', { style: toastStyle });
    } catch {
      toast.error('Erreur lors de la génération PDF', { style: toastStyle });
    } finally {
      setPdfLoading(false);
    }
  };

  const meta = result ? CLASS_META[result.class] || CLASS_META.normal : null;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #475569 !important; }
        textarea:focus { border-color: rgba(96,165,250,0.5) !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
      <Toaster position="top-right" />

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandIcon}><Activity size={20} color="#93c5fd" /></div>
          <div>
            <div style={s.brandName}>RadioScan AI</div>
            <div style={s.brandVersion}>v2.0 — VGG19+CBAM</div>
          </div>
        </div>

        <nav style={s.nav}>
          <div style={{ ...s.navItem, ...s.navActive }}>
            <Eye size={15} />
            Analyse
          </div>
        </nav>

        <div style={s.sideStats}>
          {[['97.25%','Accuracy'],['3','Classes'],['6.9K','Dataset']].map(([v,l]) => (
            <div key={l} style={s.statRow}>
              <span style={s.statLbl}>{l}</span>
              <span style={s.statVal}>{v}</span>
            </div>
          ))}
        </div>

        <div style={s.userCard}>
          <div style={s.userAvatar}>{user.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>{user.role}</div>
          </div>
          <button onClick={onLogout} style={s.logoutBtn} title="Déconnexion">
            <LogOut size={14} color="#64748b" />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Analyse Radiographique</h1>
            <p style={s.pageSubtitle}>Importez une radiographie thoracique pour obtenir un diagnostic IA</p>
          </div>
          {result && (
            <button onClick={reset} style={s.resetBtn}>
              <RefreshCw size={13} /> Nouvelle analyse
            </button>
          )}
        </div>

        <div style={s.content}>

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={s.uploadWrap}>
              <div {...getRootProps()} style={{ ...s.dropzone, ...(isDragActive ? s.dzActive : {}) }}>
                <input {...getInputProps()} />
                <div style={s.uploadIcon}>
                  <Upload size={28} color={isDragActive ? '#93c5fd' : '#4b6a9b'} />
                </div>
                <h3 style={s.uploadTitle}>{isDragActive ? 'Déposez ici' : 'Glissez-déposez une radiographie'}</h3>
                <p style={s.uploadSub}>ou cliquez pour sélectionner un fichier</p>
                <div style={s.tagsRow}>
                  <span style={s.tag}>JPG</span>
                  <span style={s.tag}>PNG</span>
                  <span style={s.tagGray}>Max 16 MB</span>
                </div>
              </div>
              <div style={s.infoBar}>
                <Zap size={12} color="#93c5fd" />
                <span style={{ fontSize:'0.78rem', color:'#64748b' }}>Filtrage automatique CLIP — images non-thoraciques rejetées</span>
              </div>
            </motion.div>
          )}

          {/* ── PATIENT FORM ── */}
          {step === 'patient' && (
            <PatientForm
              preview={preview}
              onSubmit={handlePatientSubmit}
              onBack={() => { setStep('upload'); setPreview(null); setPendingFile(null); }}
            />
          )}

          {/* ── LOADING ── */}
          <AnimatePresence>
            {step === 'loading' && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={s.loadingWrap}>
                <div style={s.loadRing} />
                <p style={s.loadTitle}>Analyse en cours…</p>
                <p style={s.loadSub}>CLIP + VGG19 + Grad-CAM</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS ── */}
          {step === 'result' && result && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}>

              {/* Patient info banner */}
              {patient && (
                <div style={s.patientBanner}>
                  <User size={14} color="#93c5fd" style={{ flexShrink:0 }} />
                  <div style={s.patientBannerContent}>
                    <span style={s.patientName}>{patient.prenom} {patient.nom}</span>
                    <span style={s.patientSep}>·</span>
                    <span style={s.patientDetail}>CIN : {patient.cin}</span>
                    {patient.dateNaissance && <><span style={s.patientSep}>·</span><span style={s.patientDetail}>Né(e) le {patient.dateNaissance}</span></>}
                    {patient.sexe && <><span style={s.patientSep}>·</span><span style={s.patientDetail}>{patient.sexe}</span></>}
                    {patient.telephone && <><span style={s.patientSep}>·</span><span style={s.patientDetail}>{patient.telephone}</span></>}
                    {patient.medecin && <><span style={s.patientSep}>·</span><span style={s.patientDetail}>Médecin : {patient.medecin}</span></>}
                  </div>
                </div>
              )}

              {/* Row 1 : Diag + Images */}
              <div style={s.row}>

                {/* Diagnosis card */}
                <div style={{ ...s.card, ...s.diagCard, borderColor: meta.border, background: meta.bg }}>
                  <div style={s.diagLabel}>Diagnostic IA</div>
                  <div style={{ ...s.diagValue, color: meta.color }}>{meta.label}</div>
                  <div style={s.diagDivider} />
                  <div style={s.diagLabel}>Confiance</div>
                  <div style={{ ...s.diagConf, color: meta.color }}>{result.confidence}%</div>
                  <div style={s.diagDivider} />
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {Object.entries(result.all_probabilities).map(([cls, prob]) => {
                      const cm = CLASS_META[cls] || CLASS_META.normal;
                      const top = cls === result.class;
                      return (
                        <div key={cls}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                            <span style={{ fontSize:'0.82rem', fontWeight: top?'600':'400', color: top ? cm.color : '#7a93b8' }}>{cm.label}</span>
                            <span style={{ fontSize:'0.82rem', fontWeight:'600', color: top ? cm.color : '#4b6a9b' }}>{prob.toFixed(1)}%</span>
                          </div>
                          <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                            <motion.div
                              initial={{ width:0 }} animate={{ width:`${prob}%` }}
                              transition={{ duration:0.8, ease:'easeOut' }}
                              style={{ height:'100%', borderRadius:'3px', background: cm.color, opacity: top?1:0.28 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2 images side by side */}
                <div style={s.imagesRow}>
                  {/* Original */}
                  <ImageCard
                    label="Radiographie originale"
                    src={preview}
                    isBase64={false}
                  />
                  {/* GradCAM prediction only — extracted from the 3-panel image */}
                  <ImageCard
                    label={`Grad-CAM — ${meta.label}`}
                    src={result.gradcam}
                    isBase64={true}
                    caption="Zones d'attention du modèle (rouge = forte activation)"
                  />
                </div>

              </div>

              {/* Row 2 : Comment + actions */}
              <div style={{ ...s.card, marginTop:'1.25rem' }}>
                <div style={s.rowCenter}>
                  <FileText size={14} color="#93c5fd" />
                  <span style={s.cardLabel}>Observations du radiologue</span>
                </div>
                <textarea
                  style={s.textarea}
                  placeholder="Rédigez vos observations cliniques, remarques ou recommandations à l'attention du médecin traitant…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                />
                <div style={s.actionsRow}>
                  <div style={s.disclaimer}>
                    <AlertCircle size={13} color="#fbbf24" style={{ flexShrink:0 }} />
                    <span style={{ fontSize:'0.77rem', color:'#c4a040', lineHeight:'1.5' }}>
                      <strong>Outil d'aide au diagnostic.</strong> Résultat à confirmer par un professionnel de santé.
                    </span>
                  </div>
                  <button onClick={handlePDF} disabled={pdfLoading} style={s.pdfBtn}>
                    {pdfLoading ? <span style={s.btnSpinner} /> : <Download size={15} />}
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

const toastStyle = {
  background: '#0d1b35', color: '#e2eaf8',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px', fontSize: '0.875rem',
};

const s = {
  page: {
    display: 'flex', minHeight: '100vh',
    background: '#0b1529',
    fontFamily: "'DM Sans','Segoe UI',sans-serif", color: '#e2eaf8',
  },

  // Sidebar — légèrement plus clair
  sidebar: {
    width: '230px', flexShrink: 0,
    background: '#0f1f3d',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', flexDirection: 'column',
    padding: '1.4rem 1rem',
  },
  brand: { display:'flex', alignItems:'center', gap:'11px', marginBottom:'1.75rem' },
  brandIcon: {
    width:'38px', height:'38px', borderRadius:'10px',
    background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(59,130,246,0.3)',
  },
  brandName: { fontSize:'0.92rem', fontWeight:'700', color:'#dbeafe' },
  brandVersion: { fontSize:'0.67rem', color:'#4b6a9b', marginTop:'2px' },

  nav: { flex:1 },
  navItem: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'9px 11px', borderRadius:'8px',
    fontSize:'0.84rem', fontWeight:'500', color:'#4b6a9b',
    cursor:'pointer', marginBottom:'4px',
  },
  navActive: {
    background:'rgba(59,130,246,0.15)',
    color:'#93c5fd',
    border:'1px solid rgba(59,130,246,0.25)',
  },

  sideStats: {
    display:'flex', flexDirection:'column', gap:'7px',
    marginBottom:'1.4rem', padding:'11px',
    background:'rgba(255,255,255,0.03)',
    borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)',
  },
  statRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  statVal: { fontSize:'0.88rem', fontWeight:'700', color:'#93c5fd' },
  statLbl: { fontSize:'0.71rem', color:'#4b6a9b' },

  userCard: {
    display:'flex', alignItems:'center', gap:'9px',
    padding:'9px', borderRadius:'10px',
    background:'rgba(255,255,255,0.03)',
    border:'1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width:'32px', height:'32px', borderRadius:'8px',
    background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'0.72rem', fontWeight:'700', color:'#fff', flexShrink:0,
  },
  userName: { fontSize:'0.79rem', fontWeight:'600', color:'#dbeafe', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole: { fontSize:'0.67rem', color:'#4b6a9b' },
  logoutBtn: { background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:'6px', display:'flex', flexShrink:0 },

  // Main
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'auto' },
  topbar: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
    padding:'1.6rem 2rem 1rem',
    borderBottom:'1px solid rgba(255,255,255,0.06)',
  },
  pageTitle: { fontSize:'1.35rem', fontWeight:'700', color:'#dbeafe', letterSpacing:'-0.02em' },
  pageSubtitle: { fontSize:'0.81rem', color:'#4b6a9b', marginTop:'3px' },
  resetBtn: {
    display:'flex', alignItems:'center', gap:'6px',
    padding:'7px 13px', borderRadius:'8px',
    background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.09)',
    color:'#7a93b8', fontSize:'0.81rem', fontWeight:'500', cursor:'pointer',
  },

  content: { flex:1, padding:'1.5rem 2rem 2rem' },

  // Upload
  uploadWrap: { maxWidth:'520px', margin:'2rem auto' },
  dropzone: {
    border:'2px dashed rgba(255,255,255,0.09)', borderRadius:'14px',
    padding:'2.5rem 2rem', textAlign:'center', cursor:'pointer',
    background:'rgba(255,255,255,0.02)', transition:'all 0.25s',
  },
  dzActive: { borderColor:'rgba(147,197,253,0.5)', background:'rgba(59,130,246,0.07)' },
  uploadIcon: {
    width:'64px', height:'64px', borderRadius:'16px',
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem',
  },
  uploadTitle: { fontSize:'1rem', fontWeight:'600', color:'#dbeafe', marginBottom:'5px' },
  uploadSub: { fontSize:'0.81rem', color:'#4b6a9b', marginBottom:'0.9rem' },
  tagsRow: { display:'flex', justifyContent:'center', gap:'7px' },
  tag: {
    padding:'3px 10px', borderRadius:'20px',
    background:'rgba(59,130,246,0.13)', border:'1px solid rgba(59,130,246,0.28)',
    fontSize:'0.71rem', fontWeight:'600', color:'#93c5fd',
  },
  tagGray: {
    padding:'3px 10px', borderRadius:'20px',
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
    fontSize:'0.71rem', color:'#4b6a9b',
  },
  infoBar: {
    display:'flex', alignItems:'center', gap:'7px',
    marginTop:'0.9rem', padding:'9px 13px', borderRadius:'8px',
    background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
  },

  // Loading
  loadingWrap: {
    display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', padding:'5rem', gap:'1rem',
  },
  loadRing: {
    width:'52px', height:'52px',
    border:'3px solid rgba(255,255,255,0.07)',
    borderTop:'3px solid #3b82f6',
    borderRadius:'50%', animation:'spin 0.9s linear infinite',
  },
  loadTitle: { fontSize:'0.97rem', fontWeight:'600', color:'#dbeafe', textAlign:'center' },
  loadSub: { fontSize:'0.79rem', color:'#4b6a9b', textAlign:'center' },

  // Results
  row: { display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.25rem', alignItems:'start' },
  card: {
    background:'#0f1f3d',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'14px', padding:'1.2rem',
  },
  cardLabel: { fontSize:'0.7rem', fontWeight:'600', color:'#4b6a9b', textTransform:'uppercase', letterSpacing:'0.07em' },
  rowCenter: { display:'flex', alignItems:'center', gap:'7px', marginBottom:'10px' },

  // Diag card
  diagCard: { display:'flex', flexDirection:'column', gap:'0' },
  diagLabel: { fontSize:'0.68rem', fontWeight:'600', color:'#4b6a9b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'3px' },
  diagValue: { fontSize:'1.55rem', fontWeight:'800', letterSpacing:'-0.03em', marginBottom:'12px' },
  diagConf: { fontSize:'2rem', fontWeight:'800', letterSpacing:'-0.03em', marginBottom:'12px' },
  diagDivider: { height:'1px', background:'rgba(255,255,255,0.06)', margin:'8px 0 12px' },

  // Images
  imagesRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' },
  imgCard: {
    background:'#0f1f3d',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'14px', padding:'1rem',
  },
  imgCardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' },
  zoomBtn: {
    display:'flex', alignItems:'center', gap:'5px',
    background:'rgba(59,130,246,0.12)',
    border:'1px solid rgba(59,130,246,0.22)',
    borderRadius:'6px', padding:'4px 8px', cursor:'pointer',
  },
  imgWrap: {
    position:'relative', borderRadius:'8px', overflow:'hidden', cursor:'zoom-in',
  },
  imgPreview: { width:'100%', display:'block', borderRadius:'8px' },
  imgOverlay: {
    position:'absolute', inset:0,
    background:'rgba(0,0,0,0)',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background 0.2s',
    // Hover handled via CSS in style tag below
  },
  imgCaption: { fontSize:'0.7rem', color:'#4b6a9b', marginTop:'7px', lineHeight:'1.5' },

  // Comment row
  textarea: {
    width:'100%', padding:'11px',
    background:'rgba(255,255,255,0.03)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'9px', color:'#dbeafe',
    fontSize:'0.87rem', resize:'vertical', lineHeight:'1.6',
    fontFamily:"'DM Sans',sans-serif", transition:'border-color 0.2s',
    marginBottom:'10px',
  },
  actionsRow: { display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' },
  disclaimer: {
    flex:1, display:'flex', alignItems:'flex-start', gap:'8px',
    padding:'9px 12px', borderRadius:'8px',
    background:'rgba(251,191,36,0.07)',
    border:'1px solid rgba(251,191,36,0.18)',
  },
  pdfBtn: {
    display:'flex', alignItems:'center', gap:'7px',
    padding:'11px 20px', flexShrink:0,
    background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    border:'none', borderRadius:'9px', color:'#fff',
    fontSize:'0.88rem', fontWeight:'600', cursor:'pointer',
    boxShadow:'0 6px 20px rgba(59,130,246,0.3)',
    minHeight:'42px',
  },
  btnSpinner: {
    width:'15px', height:'15px',
    border:'2px solid rgba(255,255,255,0.3)',
    borderTop:'2px solid #fff',
    borderRadius:'50%', display:'inline-block',
    animation:'spin 0.8s linear infinite',
  },

  // Patient banner
  patientBanner: {
    display:'flex', alignItems:'center', gap:'10px',
    padding:'10px 14px', borderRadius:'10px', marginBottom:'1.25rem',
    background:'rgba(59,130,246,0.08)',
    border:'1px solid rgba(59,130,246,0.2)',
    flexWrap:'wrap',
  },
  patientBannerContent: { display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', flex:1 },
  patientName: { fontSize:'0.88rem', fontWeight:'700', color:'#dbeafe' },
  patientSep:  { fontSize:'0.75rem', color:'#334155' },
  patientDetail: { fontSize:'0.82rem', color:'#7a93b8' },
};