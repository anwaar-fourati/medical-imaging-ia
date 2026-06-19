// frontend/src/components/Historique.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, X, Loader, Eye, Calendar } from 'lucide-react';
import { getAnalyses } from '../services/api';
import toast from 'react-hot-toast';
import './Historique.css';

const CLASS_META = {
  covid:     { label: 'COVID-19',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  normal:    { label: 'Normal',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
  pneumonia: { label: 'Pneumonie', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)'  },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
       + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Historique({ onViewAnalyse }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalyses();
      setAnalyses(data.analyses || []);
    } catch {
      toast.error('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  const filtered = analyses.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.nom?.toLowerCase().includes(q)   ||
      a.prenom?.toLowerCase().includes(q) ||
      a.cin?.toLowerCase().includes(q)   ||
      a.label?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="historique-page">
      {/* Header */}
      <div className="hist-header">
        <div>
          <h2 className="hist-title">Historique des analyses</h2>
          <p className="hist-subtitle">{analyses.length} analyse{analyses.length !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Search */}
      <div className="hist-search-bar">
        <Search size={15} color="#4b6a9b" className="hist-search-icon" />
        <input
          className="hist-search-input"
          placeholder="Rechercher par patient, CIN, diagnostic"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="hist-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="hist-loading">
          <Loader size={22} color="#3b82f6" className="hist-spin" />
          <span>Chargement…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hist-empty">
          <FileText size={36} color="#1d3461" />
          <p>{search ? 'Aucun résultat pour cette recherche.' : 'Aucune analyse enregistrée.'}</p>
        </div>
      ) : (
        <div className="hist-table-wrapper">
          <table className="hist-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>CIN</th>
                <th>Diagnostic</th>
                <th>Confiance</th>
                <th>Radiologue</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const meta = CLASS_META[a.prediction] || CLASS_META.normal;
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="hist-row"
                  >
                    <td>
                      <div className="hist-patient-cell">
                        <div className="hist-avatar">
                          {a.prenom?.[0]}{a.nom?.[0]}
                        </div>
                        <span className="hist-name">{a.prenom} {a.nom}</span>
                      </div>
                    </td>
                    <td><span className="hist-cin">{a.cin}</span></td>
                    <td>
                      <span
                        className="hist-badge"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <span className="hist-conf" style={{ color: meta.color }}>
                        {typeof a.confidence === 'number' ? a.confidence.toFixed(1) : a.confidence}%
                      </span>
                    </td>
                    <td><span className="hist-dim">{a.radiologue_name || '—'}</span></td>
                    <td>
                      <div className="hist-date">
                        <Calendar size={11} color="#4b6a9b" />
                        <span>{formatDate(a.created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="hist-view-btn"
                        onClick={() => onViewAnalyse && onViewAnalyse(a.id)}
                        title="Consulter"
                      >
                        <Eye size={13} />
                        Voir
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}