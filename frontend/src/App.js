// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getMe } from './services/api';

const fade = {
  initial: { opacity: 0, filter: 'blur(6px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } },
  exit:    { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.25 } },
};

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user,   setUser]   = useState(null);
  const [checking, setChecking] = useState(true);

  // Vérifier si une session serveur est déjà active
  useEffect(() => {
    getMe()
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setScreen('dashboard');
        }
      })
      .catch(() => {}) // pas de session — on reste sur landing
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('landing');
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060d1f',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'landing' && (
        <motion.div key="landing" {...fade}>
          <Landing onEnter={() => setScreen('login')} />
        </motion.div>
      )}
      {screen === 'login' && (
        <motion.div key="login" {...fade}>
          <Login onLogin={handleLogin} onBack={() => setScreen('landing')} />
        </motion.div>
      )}
      {screen === 'dashboard' && user && (
        <motion.div key="dashboard" {...fade}>
          <Dashboard user={user} onLogout={handleLogout} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}