import { api, jsonPost } from './api.js';
export const authService = {
  login: (mode, email, password) => api(`/api/sql/${mode}/login`, jsonPost({ email, password })),
  session: () => api('/api/auth/session'),
  logout: token => api('/api/auth/logout', jsonPost({}, { 'x-csrf-token': token }))
};
