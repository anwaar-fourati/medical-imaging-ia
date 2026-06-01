// frontend/src/services/api.js
// API service complet — RadioScan AI (Flask + PostgreSQL)

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true, // sessions cookies
});

// Intercepteur pour les erreurs globales
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Session expirée — forcer le rechargement
      window.dispatchEvent(new Event('session_expired'));
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const loginUser = async (username, password) => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// ─── Patients ──────────────────────────────────────────────────────────────
export const getPatients = async (search = '') => {
  const { data } = await api.get('/patients', { params: search ? { search } : {} });
  return data;
};

export const createPatient = async (patient) => {
  const { data } = await api.post('/patients', patient);
  return data;
};

export const updatePatient = async (id, patient) => {
  const { data } = await api.put(`/patients/${id}`, patient);
  return data;
};

export const deletePatient = async (id) => {
  const { data } = await api.delete(`/patients/${id}`);
  return data;
};

// ─── Analyses ──────────────────────────────────────────────────────────────
export const getAnalyses = async (patientId = null) => {
  const params = patientId ? { patient_id: patientId } : {};
  const { data } = await api.get('/analyses', { params });
  return data;
};

export const getAnalyse = async (id) => {
  const { data } = await api.get(`/analyses/${id}`);
  return data;
};

export const updateComment = async (id, comment) => {
  const { data } = await api.patch(`/analyses/${id}/comment`, { comment });
  return data;
};

// ─── Prédiction ────────────────────────────────────────────────────────────
export const predictImage = async (file, patientId, comment = '') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patient_id', patientId);
  formData.append('comment', comment);

  try {
    const { data } = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erreur de connexion au serveur');
  }
};

// ─── Health ────────────────────────────────────────────────────────────────
export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};