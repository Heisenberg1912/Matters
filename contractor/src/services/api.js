const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiService {
  constructor() {
    this.baseUrl = API_BASE
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }

    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)

      // Handle token refresh
      if (response.status === 401) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          config.headers = this.getHeaders()
          const retryResponse = await fetch(url, config)
          return this.handleResponse(retryResponse)
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          throw new Error('Session expired')
        }
      }

      return this.handleResponse(response)
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async handleResponse(response) {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Request failed')
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/session/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.accessToken) {
          localStorage.setItem('token', data.data.accessToken)
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken)
          }
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  delete(endpoint, data) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

export const api = new ApiService()

// Contractor-specific API calls
export const contractorApi = {
  // Dashboard
  getDashboard: () => api.get('/contractor/dashboard'),
  getStats: () => api.get('/contractor/stats'),

  // Projects
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/contractor/projects${query ? `?${query}` : ''}`)
  },

  // Earnings
  getEarnings: (year) => api.get(`/contractor/earnings${year ? `?year=${year}` : ''}`),

  // Schedule
  getSchedule: () => api.get('/contractor/schedule'),

  // Profile
  getProfile: () => api.get('/contractor/profile'),
  updateProfile: (data) => api.patch('/contractor/profile', data),

  // Availability
  updateAvailability: (status) => api.patch('/contractor/availability', { status }),

  // Documents
  uploadDocument: (data) => api.post('/contractor/documents', data),

  // Reviews
  getReviews: () => api.get('/contractor/reviews'),
}

// Jobs API
export const jobsApi = {
  // List jobs
  getJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/jobs${query ? `?${query}` : ''}`)
  },

  // Get single job
  getJob: (id) => api.get(`/jobs/${id}`),

  // My bids
  getMyBids: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/jobs/my-bids${query ? `?${query}` : ''}`)
  },

  // Assigned jobs
  getAssignedJobs: () => api.get('/jobs/assigned'),

  // Submit bid
  submitBid: (jobId, data) => api.post(`/jobs/${jobId}/bid`, data),

  // Update bid
  updateBid: (jobId, bidId, data) => api.patch(`/jobs/${jobId}/bid/${bidId}`, data),

  // Withdraw bid
  withdrawBid: (jobId, bidId) => api.post(`/jobs/${jobId}/bid/${bidId}/withdraw`),

  // Start job
  startJob: (jobId) => api.post(`/jobs/${jobId}/start`),

  // Complete job
  completeJob: (jobId) => api.post(`/jobs/${jobId}/complete`),
}

// Projects API
export const projectsApi = {
  getProject: (id) => api.get(`/projects/${id}`),
}

// Admin API
export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (days = 30) => api.get(`/admin/analytics?days=${days}`),

  // Users Management
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/users${query ? `?${query}` : ''}`)
  },
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createUser: (data) => api.post('/session/register', data),

  // Contractors Management
  getContractors: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/contractors${query ? `?${query}` : ''}`)
  },
  verifyContractor: (id, verified, notes) => api.patch(`/admin/contractors/${id}/verify`, { verified, notes }),

  // Projects Management
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/projects${query ? `?${query}` : ''}`)
  },

  // Jobs Management
  getJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/jobs${query ? `?${query}` : ''}`)
  },

  // Support Tickets
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/admin/tickets${query ? `?${query}` : ''}`)
  },
  getTicket: (id) => api.get(`/admin/tickets/${id}`),
  updateTicket: (id, data) => api.patch(`/admin/tickets/${id}`, data),

  // Subscriptions
  getSubscriptions: () => api.get('/admin/subscriptions'),
}
