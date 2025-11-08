import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  console.log('Login response:', response.data);
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Token saved to localStorage');
    console.log('Token value:', localStorage.getItem('access_token'));
  } else {
    console.error('No access_token in response:', response.data);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const register = async (email, password, role) => {
  const response = await api.post('/auth/register', { email, password, role });
  return response.data;
};

