// frontend/src/services/api.js
// Compatible with the ORIGINAL Flask backend (no /login route needed).
// Auth is handled entirely on the frontend (Login.js checks credentials locally).
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

/**
 * Send an image to /predict.
 */
export const predictImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erreur de connexion au serveur');
  }
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};