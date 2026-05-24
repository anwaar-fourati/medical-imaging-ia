import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Brain, ArrowRight, ChevronDown, CheckCircle } from 'lucide-react';

const STATS = [
  { value: '97.25%', label: 'Précision diagnostique' },
  { value: '6 939', label: 'Radiographies d\'entraînement' },
  { value: '3',     label: 'Pathologies détectées' },
  { value: '<2s',   label: 'Temps d\'analyse' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'VGG19 + CBAM',
    desc: 'Architecture hybride avec mécanisme d\'attention dual-canal pour une localisation précise des anomalies.',
  },
  {
    icon: Zap,
    title: 'Grad-CAM',
    desc: 'Visualisation des zones d\'activation — les régions décisives sont mises en évidence directement sur la radio.',
  },
  {
    icon: Shield,
    title: 'Filtre CLIP',
    desc: 'Gatekeeper intelligent : seules les radiographies thoraciques valides sont acceptées pour l\'analyse.',
  },
];

const CLASSES = [
  { name: 'COVID-19',  color: '#f87171', bar: 92 },
  { name: 'Pneumonie', color: '#fbbf24', bar: 97 },
  { name: 'Normal',    color: '#4ade80', bar: 99 },
];

// Animated counter hook
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setCount(target); return; }
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const suffix = target.replace(/[0-9.]/g, '');
      const decimals = target.includes('.') ? 2 : 0;
      setCount((num * eased).toFixed(decimals) + suffix);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatCard({ value, label, delay, started }) {
  const animated = useCounter(value, 1600, started);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={s.statCard}
    >
      <div style={s.statValue}>{animated || value}</div>
      <div style={s.statLabel}>{label}</div>
    </motion.div>
  );
}

export default function Landing({ onEnter }) {
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStatsStarted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-slow { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes scan { 0%{top:0} 100%{top:100%} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:3px; }
      `}</style>

      {/* ── Background layers ── */}
      <div style={s.bgBase} />
      <div style={s.bgRadial1} />
      <div style={s.bgRadial2} />
      <div style={s.bgGrid} />

      {/* Scanning line effect */}
      <div style={s.scanLine} />

      {/* Floating X-ray decorative circles */}
      <div style={{ ...s.orb, width:'320px', height:'320px', top:'8%', right:'6%', animationDelay:'0s' }} />
      <div style={{ ...s.orb, width:'180px', height:'180px', bottom:'20%', left:'4%', animationDelay:'1.2s' }} />
      <div style={{ ...s.orb, width:'80px', height:'80px', top:'40%', left:'12%', animationDelay:'0.6s', opacity:0.3 }} />

      {/* ── NAV ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={s.nav}
      >
        <div style={s.navBrand}>
          <div style={s.navIcon}><Activity size={18} color="#93c5fd" /></div>
          <span style={s.navName}>RadioScan AI</span>
        </div>
        <div style={s.navBadge}>Outil clinique — usage accrédité</div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={s.heroContent}
        >
          {/* Eyebrow */}
          <div style={s.eyebrow}>
            <div style={s.eyebrowDot} />
            Plateforme de diagnostic radiologique par IA
          </div>

          {/* Title */}
          <h1 style={s.heroTitle}>
            Diagnostic pulmonaire
            <br />
            <em style={s.heroTitleEm}>augmenté par l'IA</em>
          </h1>

          <p style={s.heroDesc}>
            Un outil d'aide au diagnostic conçu pour les radiologues —
            analyse automatisée des radiographies thoraciques avec
            visualisation Grad-CAM et génération de rapports PDF.
          </p>

          {/* CTA */}
          <div style={s.ctaRow}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(59,130,246,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              style={s.ctaBtn}
            >
              Accéder à la plateforme
              <ArrowRight size={18} />
            </motion.button>
            <div style={s.ctaNote}>
              <CheckCircle size={13} color="#4ade80" />
              Réservé aux radiologues accrédités
            </div>
          </div>
        </motion.div>

        {/* Animated X-ray mockup panel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={s.mockupWrap}
        >
          <div style={s.mockupCard}>
            {/* Header strip */}
            <div style={s.mockupHeader}>
              <div style={s.mockupDots}>
                <span style={{ ...s.dot, background:'#f87171' }}/>
                <span style={{ ...s.dot, background:'#fbbf24' }}/>
                <span style={{ ...s.dot, background:'#4ade80' }}/>
              </div>
              <span style={s.mockupTitle}>RadioScan AI — Analyse</span>
            </div>
            {/* Fake xray image */}
            <div style={s.xrayBox}>
              <div style={s.xrayGlow} />
              {/* Ribs lines */}
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{
                  position:'absolute', left:'10%', right:'10%',
                  top: `${22 + i * 11}%`, height:'2px',
                  background: `rgba(147,197,253,${0.08 + i*0.02})`,
                  borderRadius:'50%', transform:'scaleX(0.9)',
                }} />
              ))}
              {/* Heatmap blobs */}
              <div style={{ ...s.blob, width:'60px', height:'55px', top:'28%', left:'22%', background:'rgba(251,191,36,0.35)', filter:'blur(14px)' }} />
              <div style={{ ...s.blob, width:'80px', height:'70px', top:'35%', right:'18%', background:'rgba(248,113,113,0.4)', filter:'blur(18px)', animation:'pulse-slow 3s ease-in-out infinite' }} />
              <div style={{ ...s.blob, width:'45px', height:'40px', bottom:'25%', left:'38%', background:'rgba(251,191,36,0.25)', filter:'blur(10px)' }} />
              {/* Label overlay */}
              <div style={s.xrayLabel}>
                <span style={{ color:'#fbbf24', fontWeight:'700', fontSize:'0.85rem' }}>Pneumonie</span>
                <span style={{ color:'#94a3b8', fontSize:'0.75rem', marginLeft:'8px' }}>95.6%</span>
              </div>
            </div>
            {/* Prob bars */}
            <div style={s.mockupBars}>
              {CLASSES.map((c, i) => (
                <div key={c.name} style={{ marginBottom: i < 2 ? '8px' : 0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.72rem', color:'#7a93b8', fontFamily:"'DM Sans',sans-serif" }}>{c.name}</span>
                    <span style={{ fontSize:'0.72rem', color: c.color, fontWeight:'600', fontFamily:"'DM Sans',sans-serif" }}>{c.bar}%</span>
                  </div>
                  <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.bar}%` }}
                      transition={{ delay: 1 + i * 0.15, duration: 1, ease: 'easeOut' }}
                      style={{ height:'100%', background: c.color, borderRadius:'2px' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={s.statsSection}>
        <div style={s.statsGrid}>
          {STATS.map((st, i) => (
            <StatCard key={st.label} value={st.value} label={st.label} delay={0.1 * i} started={statsStarted} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={s.featuresSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={s.sectionHead}
        >
          <div style={s.sectionEye}>Technologie</div>
          <h2 style={s.sectionTitle}>Une architecture conçue pour la clinique</h2>
        </motion.div>

        <div style={s.featuresGrid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -4, borderColor: 'rgba(59,130,246,0.35)' }}
              style={s.featureCard}
            >
              <div style={s.featureIcon}>
                <f.icon size={22} color="#93c5fd" />
              </div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section style={s.workflowSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={s.sectionHead}
        >
          <div style={s.sectionEye}>Processus</div>
          <h2 style={s.sectionTitle}>De la radio au rapport en 4 étapes</h2>
        </motion.div>

        <div style={s.stepsRow}>
          {[
            { n:'01', t:'Upload',       d:'Glissez-déposez la radiographie thoracique (JPG/PNG).' },
            { n:'02', t:'Validation',   d:'CLIP vérifie que l\'image est bien une radio thoracique.' },
            { n:'03', t:'Diagnostic',   d:'VGG19+CBAM prédit la classe avec score de confiance.' },
            { n:'04', t:'Rapport PDF',  d:'Générez un rapport signé avec Grad-CAM et vos observations.' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              style={s.stepCard}
            >
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepConnector} />
              <h4 style={s.stepTitle}>{step.t}</h4>
              <p style={s.stepDesc}>{step.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section style={s.ctaSection}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={s.ctaBox}
        >
          <div style={s.ctaBoxGlow} />
          <div style={s.ctaBoxIcon}><Activity size={28} color="#93c5fd" /></div>
          <h2 style={s.ctaBoxTitle}>Prêt à analyser ?</h2>
          <p style={s.ctaBoxDesc}>Connectez-vous avec vos identifiants de radiologue pour accéder à la plateforme.</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(59,130,246,0.55)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            style={s.ctaBtn}
          >
            Se connecter
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerBrand}>
          <Activity size={14} color="#4b6a9b" />
          <span>RadioScan AI</span>
        </div>
        <span style={s.footerSep}>—</span>
        <span>Outil d'aide au diagnostic — Usage clinique exclusif</span>
        <span style={s.footerSep}>—</span>
        <span>© 2024 Données protégées</span>
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#060d1f',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: '#e2eaf8',
    overflowX: 'hidden',
    position: 'relative',
  },

  // Backgrounds
  bgBase: { position:'fixed', inset:0, background:'#060d1f', zIndex:0 },
  bgRadial1: {
    position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
    background:'radial-gradient(ellipse 70% 50% at 60% 0%, rgba(30,64,175,0.28) 0%, transparent 65%)',
  },
  bgRadial2: {
    position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
    background:'radial-gradient(ellipse 50% 40% at 10% 80%, rgba(15,31,61,0.9) 0%, transparent 60%)',
  },
  bgGrid: {
    position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
    backgroundImage:`linear-gradient(rgba(147,197,253,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(147,197,253,0.025) 1px, transparent 1px)`,
    backgroundSize:'48px 48px',
  },
  scanLine: {
    position:'fixed', left:0, right:0, height:'2px', zIndex:1, pointerEvents:'none',
    background:'linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent)',
    animation:'scan 8s linear infinite',
  },
  orb: {
    position:'fixed', zIndex:0, pointerEvents:'none', borderRadius:'50%',
    border:'1px solid rgba(147,197,253,0.06)',
    background:'radial-gradient(circle, rgba(30,64,175,0.04) 0%, transparent 70%)',
    animation:'float 6s ease-in-out infinite',
  },

  // Nav
  nav: {
    position:'fixed', top:0, left:0, right:0, zIndex:100,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1rem 2.5rem',
    background:'rgba(6,13,31,0.8)', backdropFilter:'blur(20px)',
    borderBottom:'1px solid rgba(255,255,255,0.05)',
  },
  navBrand: { display:'flex', alignItems:'center', gap:'10px' },
  navIcon: {
    width:'34px', height:'34px', borderRadius:'9px',
    background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(59,130,246,0.3)',
  },
  navName: { fontSize:'0.95rem', fontWeight:'700', color:'#dbeafe', letterSpacing:'-0.01em' },
  navBadge: {
    fontSize:'0.7rem', color:'#4b6a9b', padding:'4px 12px',
    borderRadius:'20px', border:'1px solid rgba(255,255,255,0.07)',
    background:'rgba(255,255,255,0.02)',
  },

  // Hero
  hero: {
    position:'relative', zIndex:10,
    minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'space-between',
    padding:'6rem 2.5rem 4rem',
    maxWidth:'1200px', margin:'0 auto',
    gap:'3rem',
  },
  heroContent: { flex:'1', maxWidth:'560px' },
  eyebrow: {
    display:'inline-flex', alignItems:'center', gap:'8px',
    fontSize:'0.75rem', fontWeight:'600', color:'#60a5fa',
    textTransform:'uppercase', letterSpacing:'0.1em',
    marginBottom:'1.5rem',
  },
  eyebrowDot: {
    width:'6px', height:'6px', borderRadius:'50%',
    background:'#3b82f6', boxShadow:'0 0 10px #3b82f6',
  },
  heroTitle: {
    fontFamily:"'DM Serif Display', Georgia, serif",
    fontSize:'clamp(2.4rem, 4.5vw, 3.4rem)',
    fontWeight:'400', color:'#f0f8ff',
    lineHeight:'1.12', letterSpacing:'-0.02em',
    marginBottom:'1.5rem',
  },
  heroTitleEm: {
    fontStyle:'italic', color:'transparent',
    background:'linear-gradient(135deg, #60a5fa, #93c5fd)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  heroDesc: {
    fontSize:'1rem', color:'#64748b', lineHeight:'1.7',
    marginBottom:'2.2rem', maxWidth:'460px',
  },
  ctaRow: { display:'flex', alignItems:'center', gap:'1.2rem', flexWrap:'wrap' },
  ctaBtn: {
    display:'inline-flex', alignItems:'center', gap:'10px',
    padding:'14px 28px',
    background:'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    border:'none', borderRadius:'12px', color:'#fff',
    fontSize:'0.95rem', fontWeight:'600', cursor:'pointer',
    boxShadow:'0 8px 28px rgba(59,130,246,0.38)',
    letterSpacing:'-0.01em',
  },
  ctaNote: {
    display:'flex', alignItems:'center', gap:'6px',
    fontSize:'0.78rem', color:'#4b6a9b',
  },

  // Mockup
  mockupWrap: { flex:'1', maxWidth:'480px', position:'relative' },
  mockupCard: {
    background:'rgba(10,20,45,0.9)',
    border:'1px solid rgba(255,255,255,0.09)',
    borderRadius:'18px', overflow:'hidden',
    boxShadow:'0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
  },
  mockupHeader: {
    display:'flex', alignItems:'center', gap:'10px',
    padding:'12px 16px',
    background:'rgba(255,255,255,0.03)',
    borderBottom:'1px solid rgba(255,255,255,0.06)',
  },
  mockupDots: { display:'flex', gap:'6px' },
  dot: { width:'10px', height:'10px', borderRadius:'50%' },
  mockupTitle: { fontSize:'0.75rem', color:'#4b6a9b', fontWeight:'500' },

  xrayBox: {
    height:'240px', background:'rgba(5,12,30,0.95)',
    position:'relative', overflow:'hidden',
    backgroundImage:'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(15,31,61,0.8) 0%, rgba(5,12,30,1) 100%)',
  },
  xrayGlow: {
    position:'absolute', inset:0,
    background:'radial-gradient(ellipse 80% 80% at 50% 45%, rgba(147,197,253,0.04) 0%, transparent 70%)',
  },
  blob: { position:'absolute', borderRadius:'50%' },
  xrayLabel: {
    position:'absolute', bottom:'12px', left:'50%', transform:'translateX(-50%)',
    background:'rgba(10,20,45,0.85)', backdropFilter:'blur(8px)',
    padding:'5px 14px', borderRadius:'20px',
    border:'1px solid rgba(251,191,36,0.25)',
    display:'flex', alignItems:'center',
  },
  mockupBars: { padding:'14px 16px' },

  // Stats
  statsSection: {
    position:'relative', zIndex:10,
    borderTop:'1px solid rgba(255,255,255,0.05)',
    borderBottom:'1px solid rgba(255,255,255,0.05)',
    background:'rgba(10,20,45,0.5)',
    backdropFilter:'blur(10px)',
    padding:'2.5rem 2.5rem',
  },
  statsGrid: {
    maxWidth:'1000px', margin:'0 auto',
    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem',
  },
  statCard: {
    textAlign:'center', padding:'1.2rem',
    borderRadius:'12px',
    background:'rgba(255,255,255,0.02)',
    border:'1px solid rgba(255,255,255,0.06)',
  },
  statValue: {
    fontFamily:"'DM Serif Display',Georgia,serif",
    fontSize:'2rem', color:'#93c5fd',
    fontWeight:'400', letterSpacing:'-0.02em', marginBottom:'4px',
  },
  statLabel: { fontSize:'0.75rem', color:'#4b6a9b', letterSpacing:'0.04em' },

  // Features
  featuresSection: {
    position:'relative', zIndex:10,
    padding:'5rem 2.5rem',
    maxWidth:'1100px', margin:'0 auto',
  },
  sectionHead: { textAlign:'center', marginBottom:'3rem' },
  sectionEye: {
    display:'inline-block',
    fontSize:'0.72rem', fontWeight:'600', color:'#3b82f6',
    textTransform:'uppercase', letterSpacing:'0.12em',
    marginBottom:'0.75rem',
  },
  sectionTitle: {
    fontFamily:"'DM Serif Display',Georgia,serif",
    fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:'400',
    color:'#f0f8ff', letterSpacing:'-0.02em',
  },
  featuresGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' },
  featureCard: {
    padding:'2rem 1.75rem',
    background:'rgba(10,20,45,0.7)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:'16px', transition:'border-color 0.3s, transform 0.3s',
  },
  featureIcon: {
    width:'46px', height:'46px', borderRadius:'12px',
    background:'rgba(59,130,246,0.12)',
    border:'1px solid rgba(59,130,246,0.2)',
    display:'flex', alignItems:'center', justifyContent:'center',
    marginBottom:'1.2rem',
  },
  featureTitle: {
    fontSize:'1rem', fontWeight:'700', color:'#dbeafe',
    marginBottom:'0.6rem', letterSpacing:'-0.01em',
  },
  featureDesc: { fontSize:'0.84rem', color:'#4b6a9b', lineHeight:'1.65' },

  // Workflow
  workflowSection: {
    position:'relative', zIndex:10,
    padding:'4rem 2.5rem 5rem',
    background:'rgba(10,20,45,0.4)',
    borderTop:'1px solid rgba(255,255,255,0.04)',
  },
  stepsRow: {
    display:'grid', gridTemplateColumns:'repeat(4,1fr)',
    gap:'1.5rem', maxWidth:'1100px', margin:'0 auto',
  },
  stepCard: {
    padding:'1.75rem 1.5rem',
    background:'rgba(10,20,45,0.6)',
    border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:'14px', position:'relative',
  },
  stepNum: {
    fontFamily:"'DM Serif Display',Georgia,serif",
    fontSize:'2.2rem', color:'rgba(59,130,246,0.3)',
    fontWeight:'400', marginBottom:'0.5rem',
  },
  stepConnector: {
    width:'32px', height:'2px',
    background:'linear-gradient(90deg,#3b82f6,transparent)',
    marginBottom:'1rem', borderRadius:'1px',
  },
  stepTitle: { fontSize:'0.92rem', fontWeight:'700', color:'#dbeafe', marginBottom:'0.5rem' },
  stepDesc: { fontSize:'0.8rem', color:'#4b6a9b', lineHeight:'1.6' },

  // CTA section
  ctaSection: {
    position:'relative', zIndex:10,
    padding:'5rem 2.5rem',
    display:'flex', justifyContent:'center',
  },
  ctaBox: {
    position:'relative',
    maxWidth:'580px', width:'100%', textAlign:'center',
    padding:'3.5rem 2.5rem',
    background:'rgba(10,20,45,0.9)',
    border:'1px solid rgba(59,130,246,0.2)',
    borderRadius:'24px',
    boxShadow:'0 40px 80px rgba(0,0,0,0.4)',
    overflow:'hidden',
  },
  ctaBoxGlow: {
    position:'absolute', top:'-60px', left:'50%', transform:'translateX(-50%)',
    width:'300px', height:'200px',
    background:'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
    pointerEvents:'none',
  },
  ctaBoxIcon: {
    width:'56px', height:'56px', borderRadius:'14px',
    background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    margin:'0 auto 1.5rem',
    boxShadow:'0 8px 24px rgba(59,130,246,0.35)',
  },
  ctaBoxTitle: {
    fontFamily:"'DM Serif Display',Georgia,serif",
    fontSize:'2rem', color:'#f0f8ff',
    fontWeight:'400', marginBottom:'0.75rem',
  },
  ctaBoxDesc: { fontSize:'0.9rem', color:'#4b6a9b', marginBottom:'2rem', lineHeight:'1.6' },

  // Footer
  footer: {
    position:'relative', zIndex:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    gap:'10px', flexWrap:'wrap',
    padding:'1.5rem 2.5rem',
    borderTop:'1px solid rgba(255,255,255,0.05)',
    fontSize:'0.72rem', color:'#334155',
  },
  footerBrand: { display:'flex', alignItems:'center', gap:'5px' },
  footerSep: { color:'rgba(255,255,255,0.1)' },
};