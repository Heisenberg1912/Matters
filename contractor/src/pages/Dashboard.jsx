import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, FolderKanban, TrendingUp, Clock,
  ChevronRight, Bell, Settings, CheckCircle2,
  AlertCircle, Loader2, MessageSquare, Package,
  CloudSun, Upload
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { contractorApi } from '../services/api'
import { Card, CardContent } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await contractorApi.getDashboard()
      if (response.success) {
        setData(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityChange = async (status) => {
    try {
      await contractorApi.updateAvailability(status)
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, availabilityStatus: status }
      }))
    } catch (err) {
      console.error('Failed to update availability:', err)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={loadDashboard}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile, stats, recentProjects, recentUpdates } = data || {}

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-4 pb-16 safe-top">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-100 text-sm">Welcome back,</p>
            <h1 className="text-xl font-bold text-white">{profile?.name || user?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-primary-100 text-sm mb-2">Your Status</p>
          <div className="flex gap-2">
            {['available', 'busy', 'on_leave'].map((status) => (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  profile?.availabilityStatus === status
                    ? 'bg-white text-primary-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {status === 'available' ? 'Available' : status === 'busy' ? 'Busy' : 'On Leave'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-8">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card hover onClick={() => navigate('/jobs')}>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.openJobs || 0}</p>
              <p className="text-slate-500 text-sm">Open Jobs</p>
            </CardContent>
          </Card>

          <Card hover onClick={() => navigate('/jobs?tab=bids')}>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.pendingBids || 0}</p>
              <p className="text-slate-500 text-sm">Pending Bids</p>
            </CardContent>
          </Card>

          <Card hover onClick={() => navigate('/projects')}>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FolderKanban className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.activeJobs || 0}</p>
              <p className="text-slate-500 text-sm">Active Jobs</p>
            </CardContent>
          </Card>

          <Card hover onClick={() => navigate('/earnings')}>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats?.completedJobs || 0}</p>
              <p className="text-slate-500 text-sm">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Earnings</h2>
              <button
                onClick={() => navigate('/earnings')}
                className="text-primary-600 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-sm">This Month</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats?.monthlyEarnings)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">All Time</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats?.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">Chat</span>
            </button>
            <button
              onClick={() => navigate('/uploads')}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">Uploads</span>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">Inventory</span>
            </button>
            <button
              onClick={() => navigate('/weather')}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                <CloudSun className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">Weather</span>
            </button>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Active Projects</h2>
              <button
                onClick={() => navigate('/projects')}
                className="text-primary-600 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentProjects.slice(0, 3).map((project) => (
                <Card
                  key={project._id}
                  hover
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <CardContent className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{project.name}</h3>
                      <p className="text-slate-500 text-sm">
                        {project.location?.city || 'No location'}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={project.status} />
                      <p className="text-slate-500 text-xs mt-1">
                        {project.progress || 0}% done
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Updates */}
        {recentUpdates?.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Recent Activity</h2>
            <Card>
              <div className="divide-y divide-slate-100">
                {recentUpdates.slice(0, 5).map((update) => (
                  <div key={update._id} className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-medium truncate">
                        {update.title}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {update.project?.name} • {new Date(update.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!recentProjects?.length && !recentUpdates?.length && (
          <Card>
            <CardContent className="text-center py-8">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No active projects yet</h3>
              <p className="text-slate-500 text-sm mb-4">
                Start by browsing available jobs and submitting bids
              </p>
              <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
