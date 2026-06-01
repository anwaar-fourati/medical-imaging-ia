import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, CheckCircle, Upload, Shield, Brain, FileText } from 'lucide-react';
import './Landing.css';

export default function Landing({ onEnter }) {
  return (
    <div className="landing-page">
      {/* Éléments de fond */}
      <div className="bg-base" />
      <div className="bg-radial-1" />
      <div className="bg-radial-2" />
      <div className="bg-grid" />
      <div className="scan-line" />

      {/* Orbes flottants décoratifs */}
      <div className="orb orb-large" />
      <div className="orb orb-medium" />
      <div className="orb orb-small" />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="landing-nav"
      >
        <div className="nav-brand">
          <div className="nav-icon"><Activity size={18} color="#93c5fd" /></div>
          <span className="nav-name">RadioScan AI</span>
        </div>
        <div className="nav-badge">Outil clinique — usage accrédité</div>
      </motion.nav>

      {/* Section Hero - simplifiée sans mockup */}
      <section className="hero-section hero-section-centered">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hero-content hero-content-centered"
        >
          <div className="eyebrow">
            <div className="eyebrow-dot" />
            Plateforme de diagnostic radiologique par IA
          </div>
          <h1 className="hero-title">
            Diagnostic pulmonaire
            <br />
            <em className="hero-title-em">augmenté par l'IA</em>
          </h1>
          <p className="hero-desc hero-desc-centered">
            Un outil d'aide au diagnostic conçu pour les radiologues —
            analyse automatisée des radiographies thoraciques avec
            visualisation Grad-CAM et génération de rapports PDF.
          </p>
          <div className="cta-row">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(59,130,246,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              className="cta-button"
            >
              Accéder à la plateforme
              <ArrowRight size={18} />
            </motion.button>
            <div className="cta-note">
              <CheckCircle size={13} color="#4ade80" />
              Réservé aux radiologues accrédités
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section Processus en 4 étapes (GARDER) */}
      <section className="workflow-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-head"
        >
          <div className="section-eye">Processus</div>
          <h2 className="section-title">De la radio au rapport en 4 étapes</h2>
        </motion.div>
        <div className="steps-row">
          {[
            { n: '01', t: 'Upload', d: 'Glissez-déposez la radiographie thoracique (JPG/PNG).', icon: Upload },
            { n: '02', t: 'Validation', d: 'CLIP vérifie que l\'image est bien une radio thoracique.', icon: Shield },
            { n: '03', t: 'Diagnostic', d: 'VGG19+CBAM prédit la classe avec score de confiance.', icon: Brain },
            { n: '04', t: 'Rapport PDF', d: 'Générez un rapport signé avec Grad-CAM et vos observations.', icon: FileText },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="step-card"
            >
              <div className="step-num">{step.n}</div>
              <div className="step-connector" />
              <div className="step-icon">
                <step.icon size={24} color="#3b82f6" />
              </div>
              <h4 className="step-title">{step.t}</h4>
              <p className="step-desc">{step.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Activity size={14} color="#4b6a9b" />
          <span>RadioScan AI</span>
        </div>
        <span className="footer-sep">—</span>
        <span>Outil d'aide au diagnostic — Usage clinique exclusif</span>
        <span className="footer-sep">—</span>
        <span>© 2026 Données protégées</span>
      </footer>
    </div>
  );
}