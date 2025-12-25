import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import {
  Users,
  Building2,
  Briefcase,
  Ticket,
  HardHat,
  TrendingUp,
  ArrowRight,
  DollarSign,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getDashboard()
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      setError('Failed to load dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-500">{error || 'No data available'}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const overviewCards = [
    {
      label: 'Total Users',
      value: data.overview?.users?.total || 0,
      subValue: `+${data.overview?.users?.newThisMonth || 0} this month`,
      icon: Users,
      color: 'bg-blue-500',
      action: () => navigate('/admin/users'),
    },
    {
      label: 'Projects',
      value: data.overview?.projects?.total || 0,
      subValue: `${data.overview?.projects?.active || 0} active`,
      icon: Building2,
      color: 'bg-green-500',
      action: () => navigate('/admin/projects'),
    },
    {
      label: 'Contractors',
      value: data.overview?.contractors?.total || 0,
      subValue: `${data.overview?.contractors?.verified || 0} verified`,
      icon: HardHat,
      color: 'bg-orange-500',
      action: () => navigate('/admin/contractors'),
    },
    {
      label: 'Open Tickets',
      value: data.overview?.tickets?.pending || 0,
      subValue: 'Pending review',
      icon: Ticket,
      color: 'bg-red-500',
      action: () => navigate('/admin/tickets'),
    },
  ]

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm">Platform overview and management</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        {overviewCards.map((card) => (
          <Card
            key={card.label}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={card.action}
          >
            <div className={`inline-flex p-2 rounded-lg ${card.color} text-white mb-3`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="text-xs text-green-600 mt-1">{card.subValue}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Revenue Overview</h3>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="text-primary-600 text-sm flex items-center gap-1"
          >
            Analytics <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-1 text-slate-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Billed</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(data.revenue?.totalBilled)}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-1 text-slate-500 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Paid</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(data.revenue?.totalPaid)}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl">
            <div className="flex items-center gap-1 text-slate-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Bills</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{data.revenue?.count || 0}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/admin/contractors')}
          className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center gap-2 hover:bg-orange-100 transition"
        >
          <HardHat className="h-5 w-5 text-orange-600" />
          <span className="text-sm text-orange-700">Verify Contractors</span>
        </button>
        <button
          onClick={() => navigate('/admin/tickets')}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center gap-2 hover:bg-red-100 transition"
        >
          <Ticket className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">Support Tickets</span>
        </button>
      </div>

      {/* Recent Users */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Users</h3>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-primary-600 text-sm flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {data.recentActivity?.users?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  user.role === 'contractor'
                    ? 'bg-orange-100 text-orange-700'
                    : user.role === 'admin'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role}
                </span>
                <p className="text-xs text-slate-400 mt-1">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Tickets */}
      {data.recentActivity?.tickets?.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Tickets</h3>
            <button
              onClick={() => navigate('/admin/tickets')}
              className="text-primary-600 text-sm flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {data.recentActivity.tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100"
                onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      ticket.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900 truncate mt-1">{ticket.subject}</p>
                  <p className="text-xs text-slate-500">{ticket.user?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  ticket.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : ticket.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {ticket.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Jobs Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Jobs Overview</h3>
          <button
            onClick={() => navigate('/admin/jobs')}
            className="text-primary-600 text-sm flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-700">Total Jobs</span>
            </div>
            <p className="text-xl font-bold text-blue-900 mt-1">{data.overview?.jobs?.total || 0}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">Open Jobs</span>
            </div>
            <p className="text-xl font-bold text-green-900 mt-1">{data.overview?.jobs?.open || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
