import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase, MapPin, Clock, DollarSign, Search,
  Filter, Loader2, AlertCircle, ChevronRight
} from 'lucide-react'
import { jobsApi } from '../services/api'
import { Card, CardContent } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'

export default function Jobs() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'browse'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [jobs, setJobs] = useState([])
  const [myBids, setMyBids] = useState([])
  const [assignedJobs, setAssignedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'browse') {
        const response = await jobsApi.getJobs({ status: 'open' })
        if (response.success) {
          setJobs(response.data.jobs)
        }
      } else if (activeTab === 'bids') {
        const response = await jobsApi.getMyBids()
        if (response.success) {
          setMyBids(response.data.bids)
        }
      } else if (activeTab === 'assigned') {
        const response = await jobsApi.getAssignedJobs()
        if (response.success) {
          setAssignedJobs(response.data)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatBudget = (budget) => {
    if (!budget) return 'Negotiable'
    if (budget.min && budget.max) {
      return `${formatCurrency(budget.min)} - ${formatCurrency(budget.max)}`
    }
    if (budget.min) return `${formatCurrency(budget.min)}+`
    if (budget.max) return `Up to ${formatCurrency(budget.max)}`
    return 'Negotiable'
  }

  const tabs = [
    { id: 'browse', label: 'Browse Jobs', count: jobs.length },
    { id: 'bids', label: 'My Bids', count: myBids.length },
    { id: 'assigned', label: 'Assigned', count: assignedJobs.length },
  ]

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(search.toLowerCase()) ||
    job.location?.city?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredBids = myBids.filter(item =>
    item.job?.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Jobs</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 spinner" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={loadData}>Try Again</Button>
            </CardContent>
          </Card>
        ) : activeTab === 'browse' ? (
          filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No open jobs</h3>
                <p className="text-slate-500 text-sm">
                  Check back later for new opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Card
                  key={job._id}
                  hover
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 flex-1 pr-2">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    {job.description && (
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requiredSpecializations?.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-500">
                        {job.location?.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.bidCount || 0} bids</span>
                        </div>
                      </div>
                      <div className="font-semibold text-primary-600">
                        {formatBudget(job.budget)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'bids' ? (
          filteredBids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No bids yet</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Browse jobs and submit your first bid
                </p>
                <Button onClick={() => handleTabChange('browse')}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBids.map(({ job, bid }) => (
                <Card
                  key={bid._id}
                  hover
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 flex-1 pr-2">
                        {job.title}
                      </h3>
                      <StatusBadge status={bid.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-slate-500 text-xs">Your Bid</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Job Budget</p>
                        <p className="font-medium text-slate-700">
                          {formatBudget(job.budget)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>
                        Submitted {new Date(bid.submittedAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          assignedJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No assigned jobs</h3>
                <p className="text-slate-500 text-sm">
                  Jobs assigned to you will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignedJobs.map((job) => (
                <Card
                  key={job._id}
                  hover
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 flex-1 pr-2">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                      {job.project?.name && (
                        <span>{job.project.name}</span>
                      )}
                      {job.postedBy?.name && (
                        <span>by {job.postedBy.name}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {job.timeline?.endDate && (
                        <span className="text-sm text-slate-500">
                          Due: {new Date(job.timeline.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
