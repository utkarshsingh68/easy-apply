import axios from 'axios'

// In dev: VITE_API_URL=http://127.0.0.1:8000 (set via frontend/.env.development)
// In production (Docker/Railway): empty string → relative paths → same origin
const BASE_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ajob_owner_token') || ''
  if (token) {
    config.headers = config.headers || {}
    config.headers['X-Admin-Token'] = token
  }
  return config
})

// Unwrap data and parse error detail
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const detail = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(String(detail)))
  },
)

export const api = {
  getDashboardData: () => client.get('/dashboard-data'),
  getAnalytics: () => client.get('/analytics/overview'),
  getTemplates: () => client.get('/templates'),
  getResumeProfiles: () => client.get('/resume-profiles'),

  addJob: (payload) => client.post('/add-job', payload),
  generateEmail: (companyId, hrEmail) =>
    client.post(`/generate-email/${companyId}`, { hr_email: hrEmail || null }),
  sendEmail: (companyId, hrEmail) =>
    client.post(`/send-email/${companyId}`, { hr_email: hrEmail || null }),
  updateHrEmail: (companyId, hrEmail) =>
    client.patch(`/companies/${companyId}/hr-email`, { hr_email: hrEmail }),
  deleteCompany: (companyId) => client.delete(`/companies/${companyId}`),

  saveTemplate: (name, guidance) => {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('guidance', guidance)
    return client.post('/templates', fd)
  },

  bulkUploadSend: (formData) => client.post('/bulk-upload-send', formData),
  importPreview: (formData) => client.post('/import/preview', formData),

  runFollowups: () => client.post('/followups/run-due'),
  syncReply: (events) => client.post('/replies/sync', events),
}
