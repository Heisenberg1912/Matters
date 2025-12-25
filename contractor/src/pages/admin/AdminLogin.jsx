import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Eye, EyeOff, Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import Button from '../../components/Button'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, error, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await login(email, password, true)

    if (result.success) {
      navigate('/admin/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 pt-safe-top">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex flex-col items-center pb-8">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-primary-100">Sign in to manage the platform</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@matters.com"
                className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                required
                autoFocus
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 max-w-sm mx-auto p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <p className="text-xs text-primary-700 font-medium mb-2">Demo Admin Credentials:</p>
          <div className="space-y-1 text-xs text-slate-600">
            <p><span className="text-slate-500">Email:</span> admin@matters.com</p>
            <p><span className="text-slate-500">Password:</span> admin123</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center safe-bottom">
        <p className="text-slate-400 text-xs">
          Matters Admin Portal v1.0
        </p>
      </div>
    </div>
  )
}
