import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Calendar, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Wallet, Briefcase
} from 'lucide-react'
import { contractorApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'

export default function Earnings() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadEarnings()
  }, [year])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const response = await contractorApi.getEarnings(year)
      if (response.success) {
        setData(response.data)
      }
    } catch (err) {
      setError(err.message)
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

  const maxMonthlyEarning = data?.monthlyBreakdown
    ? Math.max(...data.monthlyBreakdown.map(m => m.amount), 1)
    : 1

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
            <Button onClick={loadEarnings}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-4 pb-16 safe-top">
        <h1 className="text-xl font-bold text-white mb-6">Earnings</h1>

        {/* Year Selector */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setYear(year - 1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold text-white min-w-[80px] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(year + 1)}
            disabled={year >= new Date().getFullYear()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-primary-100 text-sm mb-1">This Year</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data?.totalEarnings)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-primary-100 text-sm mb-1">All Time</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data?.allTimeEarnings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(data?.totalEarnings)}
              </p>
              <p className="text-slate-500 text-sm">{year} Earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {data?.jobsCompleted || 0}
              </p>
              <p className="text-slate-500 text-sm">Jobs Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Monthly Breakdown</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.monthlyBreakdown?.map((month, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-slate-500">{month.month}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(month.amount / maxMonthlyEarning) * 100}%`,
                        minWidth: month.amount > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-medium text-slate-700">
                    {formatCurrency(month.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Recent Payments</h3>
          </CardHeader>
          {data?.recentPayments?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentPayments.map((payment, index) => (
                <div key={index} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {payment.jobTitle}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {payment.project?.name || 'Direct Job'} • {new Date(payment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <CardContent className="text-center py-8">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No payments this year</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
