import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
})

export const login = (payload) => api.post('/auth/login', payload)
export const register = (payload) => api.post('/auth/register', payload)
export const chat = (payload) => api.post('/chat', payload)
export const createComplaint = (payload) => api.post('/complaint', payload)
export const getStatus = (ticketId) => api.get(`/status/${ticketId}`)
export const getHistory = (userId) => api.get(`/history/${userId}`)
export const getAnalytics = () => api.get('/analytics')
export const getTopics = () => api.get('/topics')
export const getAlerts = () => api.get('/alerts')

export default api

export const submitIntake = (formData) => api.post('/complaint/intake', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
