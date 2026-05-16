// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const predictImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response from server:', response.data); // Debug
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Erreur serveur');
    }
    throw new Error('Erreur de connexion au serveur');
  }
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};