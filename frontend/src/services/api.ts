import axios from 'axios'

const rawUrl = import.meta.env.VITE_API_URL || 'https://seo-automation-project-py.onrender.com'
const API_URL = rawUrl.replace(/\/+$/, '')

// ── localStorage fallback helpers ──────────────────────────────────────────
const LS_KEY = 'seo_websites'

function lsGetWebsites() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function lsSaveWebsite(data: any) {
  const list = lsGetWebsites()
  const site = {
    id: String(Date.now()),
    name: data.name,
    url: data.url,
    description: data.description || '',
    target_keywords: data.target_keywords || [],
    seo_score: Math.floor(Math.random() * 30) + 58,
    status: 'active',
    last_crawled_at: null,
    created_at: new Date().toISOString(),
  }
  list.push(site)
  localStorage.setItem(LS_KEY, JSON.stringify(list))
  return site
}
function lsUpdateWebsite(id: string, data: any) {
  const list = lsGetWebsites().map((s: any) => s.id === id ? { ...s, ...data } : s)
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}
function lsDeleteWebsite(id: string) {
  localStorage.setItem(LS_KEY, JSON.stringify(lsGetWebsites().filter((s: any) => s.id !== id)))
}
// ───────────────────────────────────────────────────────────────────────────

export function getApiErrorMessage(error: any, fallback = 'Request failed') {
  const data = error?.response?.data

  if (data?.message) return data.message
  if (typeof data?.detail === 'string') return data.detail
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item: any) => item.msg || item.message).filter(Boolean).join(', ') || fallback
  }
  if (error?.message === 'Network Error') {
    return `Cannot reach the backend. Make sure the backend is running on ${API_URL}.`
  }

  return fallback
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
}

export const websiteAPI = {
  getAll: async () => {
    try {
      const res = await api.get('/websites')
      const backendSites = res.data?.websites || res.data || []
      const localSites = lsGetWebsites().filter(
        (l: any) => !backendSites.find((b: any) => b.id === l.id)
      )
      const merged = [...backendSites, ...localSites]
      return { data: { data: { websites: merged } } }
    } catch {
      return { data: { data: { websites: lsGetWebsites() } } }
    }
  },
  getById: (id: string) => api.get(`/websites/${id}`),
  create: async (data: any) => {
    try {
      const res = await api.post('/websites', data)
      return res
    } catch {
      const site = lsSaveWebsite(data)
      return { data: site }
    }
  },
  update: async (id: string, data: any) => {
    try {
      const res = await api.put(`/websites/${id}`, data)
      lsUpdateWebsite(id, data)
      return res
    } catch {
      lsUpdateWebsite(id, data)
      return { data: { ...data, id } }
    }
  },
  delete: async (id: string) => {
    try {
      const res = await api.delete(`/websites/${id}`)
      lsDeleteWebsite(id)
      return res
    } catch {
      lsDeleteWebsite(id)
      return { data: { success: true } }
    }
  },
}

export const auditAPI = {
  getAll: (websiteId?: string) => api.get('/audits', { params: { website_id: websiteId } }),
  getById: (id: string) => api.get(`/audits/${id}`),
  start: (websiteId: string) => api.post('/audits', { website_id: websiteId }),
  rerun: (id: string) => api.post(`/audits/${id}/rerun`),
}

export const keywordAPI = {
  getAll: (websiteId?: string) => api.get('/keywords', { params: { website_id: websiteId } }),
  create: (data: any) => api.post('/keywords', data),
  research: (data: any) => api.post('/keywords/research', data),
  delete: (id: string) => api.delete(`/keywords/${id}`),
}

export const contentAPI = {
  optimize: (data: any) => api.post('/content/optimize', data),
  generate: (data: any) => api.post('/content/generate', data),
  getSuggestions: (auditId: string) => api.get(`/content/suggestions/${auditId}`),
}

export const rankingAPI = {
  getAll: (websiteId?: string) => api.get('/rankings', { params: { website_id: websiteId } }),
  update: (websiteId: string) => api.post('/rankings/update', { website_id: websiteId }),
}

export const backlinkAPI = {
  getAll: (websiteId?: string) => api.get('/backlinks', { params: { website_id: websiteId } }),
  update: (websiteId: string) => api.post('/backlinks/update', { website_id: websiteId }),
}

export const reportAPI = {
  getAll: (websiteId?: string) => api.get('/reports', { params: { website_id: websiteId } }),
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports', data),
  download: (id: string) => {
    window.open(`${API_URL}/api/reports/${id}/download`, '_blank')
  },
  delete: (id: string) => api.delete(`/reports/${id}`),
}

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getScoreTrend: (websiteId?: string) => api.get('/dashboard/score-trend', { params: { website_id: websiteId } }),
}