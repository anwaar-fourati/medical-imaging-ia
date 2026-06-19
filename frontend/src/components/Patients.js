// frontend/src/components/Patients.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Plus, Search, Edit2, Trash2, X, Check,
  AlertCircle, ChevronDown, Loader
} from 'lucide-react';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/api';
import toast from 'react-hot-toast';
import './Patients.css';

const EMPTY = {
  nom: '', prenom: '', cin: '',
  date_naissance: '', sexe: '', telephone: '', medecin: '',
};

// ─── Champ générique ──────────────────────────────────────────────────────────
function Field({ label, name, placeholder, value, onChange, error, required, half }) {
  return (
    <div className={`pf-field ${half ? 'half' : ''}`}>
      <label className="pf-label">
        {label}{required && <span className="pf-required">*</span>}
      </label>
      <input
        className={`pf-input ${error ? 'pf-input-error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(name, e.target.value)}
      />
      {error && <span className="pf-error">{error}</span>}
    </div>
  );
}

// ─── Modal Patient (création / édition) ───────────────────────────────────────
function PatientModal({ patient: initial, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm]   = useState(initial || EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.cin.trim())    e.cin    = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="pm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pm-modal"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <div className="pm-header-icon">
              <User size={18} color="#93c5fd" />
            </div>
            <div>
              <h3 className="pm-title">
                {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
              </h3>
              <p className="pm-subtitle">
                {isEdit ? 'Mettez à jour les informations' : 'Renseignez les coordonnées du patient'}
              </p>
            </div>
          </div>
          <button className="pm-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="pm-body">
          <div className="pm-grid">
            <Field label="Nom"    name="nom"    placeholder="Ben Ahmed" half value={form.nom}    onChange={handleChange} error={errors.nom}    required />
            <Field label="Prénom" name="prenom" placeholder="Karim"     half value={form.prenom} onChange={handleChange} error={errors.prenom} required />
            <Field label="CIN"    name="cin"    placeholder="12345678"  half value={form.cin}    onChange={handleChange} error={errors.cin}    required />

            <div className="pf-field half">
              <label className="pf-label">Sexe</label>
              <div className="pf-select-wrapper">
                <select
                  className="pf-input pf-select"
                  value={form.sexe}
                  onChange={e => handleChange('sexe', e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </select>
                <ChevronDown size={14} className="pf-select-icon" />
              </div>
            </div>

            <Field label="Date de naissance" name="date_naissance" placeholder="jj/mm/aaaa" half value={form.date_naissance} onChange={handleChange} />
            <Field label="Téléphone"          name="telephone"      placeholder="+216 XX XXX XXX" half value={form.telephone}     onChange={handleChange} />
            <Field label="Médecin traitant"   name="medecin"        placeholder="Dr. Dupont"      value={form.medecin}       onChange={handleChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button className="pm-cancel" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button className="pm-save" onClick={handleSubmit} disabled={saving}>
            {saving
              ? <span className="pm-spinner" />
              : <Check size={15} />}
            {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer le patient')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal de confirmation de suppression ─────────────────────────────────────
function DeleteModal({ patient, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  return (
    <motion.div
      className="pm-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pm-modal pm-modal-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pm-delete-icon"><Trash2 size={22} color="#f87171" /></div>
        <h3 className="pm-delete-title">Supprimer ce patient ?</h3>
        <p className="pm-delete-desc">
          <strong>{patient.prenom} {patient.nom}</strong> (CIN : {patient.cin}) sera
          définitivement supprimé, ainsi que toutes ses analyses.
        </p>
        <div className="pm-delete-actions">
          <button className="pm-cancel" onClick={onClose} disabled={deleting}>Annuler</button>
          <button className="pm-delete-confirm" onClick={handleConfirm} disabled={deleting}>
            {deleting ? <span className="pm-spinner" /> : <Trash2 size={14} />}
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function Patients() {
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null); // null | 'create' | { patient }
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchPatients]);

  const handleSave = async (form) => {
    try {
      if (form.id) {
        await updatePatient(form.id, form);
        toast.success('Patient mis à jour');
      } else {
        await createPatient(form);
        toast.success('Patient créé');
      }
      setModal(null);
      fetchPatients(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await deletePatient(deleteTarget.id);
      toast.success('Patient supprimé');
      setDeleteTarget(null);
      fetchPatients(search);
    } catch {
      toast.error('Erreur lors de la suppression');
      throw new Error('delete failed');
    }
  };

  return (
    <div className="patients-page">
      {/* Header */}
      <div className="pts-header">
        <div>
          <h2 className="pts-title">Gestion des patients</h2>
          <p className="pts-subtitle">{patients.length} patient{patients.length !== 1 ? 's' : ''} enregistré{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="pts-add-btn" onClick={() => setModal('create')}>
          <Plus size={15} />
          Nouveau patient
        </button>
      </div>

      {/* Search bar */}
      <div className="pts-search-bar">
        <Search size={15} color="#4b6a9b" className="pts-search-icon" />
        <input
          className="pts-search-input"
          placeholder="Rechercher par nom, prénom ou CIN"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="pts-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="pts-table-wrapper">
        {loading ? (
          <div className="pts-loading">
            <Loader size={22} color="#3b82f6" className="pts-loading-spin" />
            <span>Chargement…</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="pts-empty">
            <User size={36} color="#1d3461" />
            <p>{search ? 'Aucun patient trouvé pour cette recherche.' : 'Aucun patient enregistré.'}</p>
            {!search && (
              <button className="pts-add-btn" onClick={() => setModal('create')}>
                <Plus size={14} /> Ajouter le premier patient
              </button>
            )}
          </div>
        ) : (
          <table className="pts-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>CIN</th>
                <th>Naissance</th>
                <th>Sexe</th>
                <th>Téléphone</th>
                <th>Médecin traitant</th>
                <th className="pts-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="pts-row"
                >
                  <td>
                    <div className="pts-patient-cell">
                      <div className="pts-avatar">
                        {p.prenom?.[0]}{p.nom?.[0]}
                      </div>
                      <div>
                        <div className="pts-name">{p.prenom} {p.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pts-cin">{p.cin}</span></td>
                  <td><span className="pts-dim">{p.date_naissance || '—'}</span></td>
                  <td><span className="pts-dim">{p.sexe || '—'}</span></td>
                  <td><span className="pts-dim">{p.telephone || '—'}</span></td>
                  <td><span className="pts-dim">{p.medecin || '—'}</span></td>
                  <td>
                    <div className="pts-actions">
                      <button
                        className="pts-btn-edit"
                        title="Modifier"
                        onClick={() => setModal(p)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="pts-btn-delete"
                        title="Supprimer"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <PatientModal
            key="patient-modal"
            patient={modal === 'create' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            patient={deleteTarget}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}