import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const SESSION_KEY = 'radioscan_user';

const fade = {
  initial: { opacity: 0, filter: 'blur(6px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } },
  exit:    { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.25 } },
};

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useState(null);

  // Restore session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
        setScreen('dashboard');
      }
    } catch {}
  }, []);

  const handleLogin = (userData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setScreen('landing');
  };

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