import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

const DEMO_CREDENTIALS = [
  { username: 'dr.martin', password: 'radio2024', name: 'Dr. Sophie Martin', role: 'Radiologue Senior' },
  { username: 'dr.ahmed', password: 'radio2024', name: 'Dr. Karim Ahmed', role: 'Radiologue' },
];

export default function Login({ onLogin, onBack }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const user = DEMO_CREDENTIALS.find(
      u => u.username === form.username && u.password === form.password
    );
    if (user) {
      onLogin(user);
    } else {
      setError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.grid} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={styles.card}
      >
        {/* Back button */}
        {onBack && (
          <button onClick={onBack} style={styles.backBtn}>
            <ArrowLeft size={14} />
            Retour à l'accueil
          </button>
        )}

        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <Activity size={28} color="#60a5fa" strokeWidth={2} />
          </div>
          <div>
            <div style={styles.logoTitle}>RadioScan AI</div>
            <div style={styles.logoSub}>Plateforme de diagnostic radiologique</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.heading}>Connexion</h2>
        <p style={styles.sub}>Accès réservé aux radiologues accrédités</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Identifiant</label>
            <div style={styles.inputWrap}>
              <User size={16} color="#64748b" style={styles.inputIcon} />
              <input
                style={styles.input}
                type="text"
                placeholder="dr.nom"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrap}>
              <Lock size={16} color="#64748b" style={styles.inputIcon} />
              <input
                style={{ ...styles.input, paddingRight: '44px' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.errorBox}
            >
              <AlertCircle size={15} color="#f87171" />
              <span style={{ fontSize: '0.82rem', color: '#f87171' }}>{error}</span>
            </motion.div>
          )}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div style={styles.hint}>
          <strong>Démo :</strong> dr.martin / radio2024
        </div>
      </motion.div>

      <div style={styles.footer}>
        © 2024 RadioScan AI — Usage clinique exclusif — Données protégées
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#060d1f',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: 'relative',
    padding: '2rem',
  },
  bg: {
    position: 'fixed', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,64,175,0.35) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  grid: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
  },
  card: {
    background: 'rgba(10, 20, 45, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    position: 'relative', zIndex: 1,
  },
  logoArea: {
    display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem',
  },
  logoIcon: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
  },
  logoTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#f0f6ff', letterSpacing: '-0.02em' },
  logoSub: { fontSize: '0.75rem', color: '#64748b', marginTop: '2px' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 0 1.5rem 0' },
  heading: { fontSize: '1.4rem', fontWeight: '700', color: '#f0f6ff', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
  sub: { fontSize: '0.82rem', color: '#475569', margin: '0 0 1.8rem 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '11px 14px 11px 40px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#f0f6ff',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: '12px', background: 'none',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
  },
  btn: {
    marginTop: '0.5rem', padding: '13px',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    border: 'none', borderRadius: '10px', color: '#fff',
    fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
    transition: 'transform 0.1s',
    minHeight: '46px',
  },
  spinner: {
    width: '18px', height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  hint: {
    marginTop: '1.4rem', fontSize: '0.78rem', color: '#475569',
    textAlign: 'center', padding: '10px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
  },
  footer: {
    marginTop: '2rem', fontSize: '0.72rem', color: '#334155',
    textAlign: 'center', zIndex: 1, position: 'relative',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    marginBottom: '1.2rem',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.78rem', color: '#4b6a9b',
    padding: '4px 0', transition: 'color 0.2s',
  },
};