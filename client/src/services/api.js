export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export async function api(path, { body, ...options } = {}) {
  const token = localStorage.getItem('quizzy_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
  return data;
}
export const authApi = {
  register: (body) => api('/auth/register', { method: 'POST', body }),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  me: () => api('/auth/me'),
};
export const quizApi = {
  list: () => api('/quizzes'),
  history: () => api('/quizzes/history'),
  participationHistory: () => api('/quizzes/participation-history'),
  get: (id) => api(`/quizzes/${id}`),
  create: (body) => api('/quizzes', { method: 'POST', body }),
  update: (id, body) => api(`/quizzes/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/quizzes/${id}`, { method: 'DELETE' }),
  createSession: (id) => api(`/quizzes/${id}/sessions`, { method: 'POST' }),
  session: (code) => api(`/sessions/${code}`),
};
