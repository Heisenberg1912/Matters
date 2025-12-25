import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  MapPin,
  Star,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAnalytics(period)
      if (response.success) {
        setData(response.data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
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

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 text-center py-12">
        <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Failed to load analytics</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm">Platform performance insights</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          <RefreshCw className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === days
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {days} days
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {data.usersByRole ? Object.values(data.usersByRole).reduce((a, b) => a + b, 0) : 0}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Building2 className="h-4 w-4" />
            <span className="text-xs">Total Projects</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {data.projectsByStatus ? Object.values(data.projectsByStatus).reduce((a, b) => a + b, 0) : 0}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs">Total Jobs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {data.jobsByStatus ? Object.values(data.jobsByStatus).reduce((a, b) => a + b, 0) : 0}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data.revenueByMonth?.reduce((sum, m) => sum + (m.totalPaid || 0), 0) || 0)}
          </p>
        </Card>
      </div>

      {/* User Distribution */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-4">User Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.usersByRole || {}).map(([role, count]) => {
            const total = Object.values(data.usersByRole).reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
            return (
              <div key={role}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize text-slate-700">{role}</span>
                  <span className="text-slate-500">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      role === 'admin' || role === 'superadmin'
                        ? 'bg-primary-500'
                        : role === 'contractor'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Projects by Status */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-4">Projects by Status</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.projectsByStatus || {}).map(([status, count]) => (
            <div
              key={status}
              className={`p-3 rounded-xl ${
                status === 'completed'
                  ? 'bg-green-50'
                  : status === 'in_progress'
                  ? 'bg-blue-50'
                  : status === 'planning'
                  ? 'bg-primary-50'
                  : status === 'on_hold'
                  ? 'bg-yellow-50'
                  : 'bg-slate-50'
              }`}
            >
              <p className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Jobs by Status */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold text-slate-900 mb-4">Jobs by Status</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.jobsByStatus || {}).map(([status, count]) => (
            <div
              key={status}
              className={`p-3 rounded-xl ${
                status === 'completed'
                  ? 'bg-green-50'
                  : status === 'open'
                  ? 'bg-blue-50'
                  : status === 'in_progress'
                  ? 'bg-primary-50'
                  : 'bg-slate-50'
              }`}
            >
              <p className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* User Growth */}
      {data.userGrowth?.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-4">User Growth</h3>
          <div className="space-y-2">
            {data.userGrowth.slice(-7).map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20">{day._id}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${Math.min((day.count / 10) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 w-8">{day.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Revenue by Month */}
      {data.revenueByMonth?.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {data.revenueByMonth.map((month, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">{month._id}</span>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(month.totalPaid)}</p>
                  <p className="text-xs text-slate-500">{month.count} bills</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Cities */}
      {data.topCities?.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-4">Top Cities</h3>
          <div className="space-y-2">
            {data.topCities.slice(0, 5).map((city, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{city._id}</span>
                </div>
                <span className="text-sm font-medium text-primary-600">{city.count} projects</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects by Type */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Projects by Type</h3>
        <div className="space-y-3">
          {Object.entries(data.projectsByType || {}).map(([type, count]) => {
            const total = Object.values(data.projectsByType).reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
            return (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize text-slate-700">{type}</span>
                  <span className="text-slate-500">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
