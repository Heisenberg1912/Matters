import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Login() {
  const navigate = useNavigate()
  const { login, error, setError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const validate = () => {
    const errors = {}
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)
    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 pt-safe-top">
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex flex-col items-center pb-8">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-primary-100">Sign in to your contractor account</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              autoComplete="email"
              autoFocus
            />
            <Mail className="absolute right-3 top-9 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            Don't have an account?{' '}
            <a href="#" className="text-primary-600 font-semibold hover:underline">
              Contact Admin
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center safe-bottom space-y-3">
        <p className="text-slate-400 text-xs">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Admin Login Link */}
        <button
          onClick={() => navigate('/admin/login')}
          className="flex items-center justify-center gap-2 text-slate-500 hover:text-purple-600 text-sm transition mx-auto"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Portal</span>
        </button>
      </div>
    </div>
  )
}
