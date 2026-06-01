// frontend/src/components/Login.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { loginUser } from '../services/api';
import './Login.css';

export default function Login({ onLogin, onBack }) {
  const [form, setForm]               = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(form.username.trim(), form.password.trim());
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Identifiants incorrects.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Erreur de connexion au serveur. Vérifiez que le backend est démarré.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-grid" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="login-card"
      >
        {onBack && (
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={14} />
            Retour à l'accueil
          </button>
        )}

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
                {showPassword
                  ? <EyeOff size={16} color="#64748b" />
                  : <Eye    size={16} color="#64748b" />}
              </button>
            </div>
          </div>

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

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}