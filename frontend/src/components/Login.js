import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import './Login.css';

// Comptes de démonstration (pour la soutenance)
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
    
    // Simulation d'appel API (délai pour l'effet visuel)
    await new Promise(r => setTimeout(r, 800));
    
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
    <div className="login-page">
      {/* Fond décoratif */}
      <div className="login-bg" />
      <div className="login-grid" />

      {/* Carte de connexion */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="login-card"
      >
        {/* Bouton retour */}
        {onBack && (
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={14} />
            Retour à l'accueil
          </button>
        )}

        {/* Logo / Brand */}
        <div className="logo-area">
          <div className="logo-icon">
            <Activity size={28} color="#60a5fa" strokeWidth={2} />
          </div>
          <div>
            <div className="logo-title">RadioScan AI</div>
            <div className="logo-sub">Plateforme de diagnostic radiologique</div>
          </div>
        </div>

        <div className="divider" />

        <h2 className="heading">Connexion</h2>
        <p className="subheading">Accès réservé aux radiologues accrédités</p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label className="form-label">Identifiant</label>
            <div className="input-wrapper">
              <User size={16} color="#64748b" className="input-icon" />
              <input
                className="form-input"
                type="text"
                placeholder="dr.martin"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Mot de passe</label>
            <div className="input-wrapper">
              <Lock size={16} color="#64748b" className="input-icon" />
              <input
                className="form-input password-input"
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
                className="eye-button"
              >
                {showPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-message"
            >
              <AlertCircle size={15} color="#f87171" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Bouton de connexion */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        
      </motion.div>

      
    </div>
  );
}