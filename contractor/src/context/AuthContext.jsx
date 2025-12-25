import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

// Allowed roles for this application
const ALLOWED_ROLES = ['contractor', 'admin', 'superadmin']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await api.get('/session/me')
      if (response.success && response.data) {
        // Verify user has allowed role (contractor or admin)
        if (!ALLOWED_ROLES.includes(response.data.role)) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          setError('Access denied. This app is for contractors and admins only.')
          setLoading(false)
          return
        }
        setUser(response.data)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, isAdminLogin = false) => {
    try {
      setError(null)
      const response = await api.post('/session/login', { email, password })

      if (response.success) {
        const userRole = response.data.user.role

        // For admin login, verify user is admin/superadmin
        if (isAdminLogin) {
          if (!['admin', 'superadmin'].includes(userRole)) {
            setError('Access denied. Admin credentials required.')
            return { success: false, error: 'Access denied. Admin credentials required.' }
          }
        } else {
          // For regular login, verify user is contractor
          if (userRole !== 'contractor') {
            setError('Access denied. This app is for contractors only.')
            return { success: false, error: 'Access denied. This app is for contractors only.' }
          }
        }

        localStorage.setItem('token', response.data.accessToken)
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken)
        }
        setUser(response.data.user)
        return { success: true, role: userRole }
      } else {
        setError(response.error || 'Login failed')
        return { success: false, error: response.error }
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Check if user is admin
  const isAdmin = () => {
    return user && ['admin', 'superadmin'].includes(user.role)
  }

  // Check if user is superadmin
  const isSuperAdmin = () => {
    return user && user.role === 'superadmin'
  }

  const logout = async () => {
    try {
      await api.post('/session/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setUser(null)
    }
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    checkAuth,
    setError,
    isAdmin,
    isSuperAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
