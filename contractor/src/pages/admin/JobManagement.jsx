import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  DollarSign,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Tag
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function JobManagement() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedJob, setSelectedJob] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [pagination.page, statusFilter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      }
      const response = await adminApi.getJobs(params)
      if (response.success) {
        setJobs(response.data.jobs)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to load jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadJobs()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-primary-100 text-primary-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'closed':
        return 'bg-slate-100 text-slate-600'
      default:
        return 'bg-slate-100 text-slate-600'
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
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Job Management</h1>
        <p className="text-slate-500 text-sm">View and manage all jobs</p>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['', 'open', 'in_progress', 'completed', 'cancelled', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === '' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job._id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedJob(job)
                setShowModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-1">{job.description || 'No description'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(job.status)}`}>
                  {job.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-3 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{job.postedBy?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {job.budget?.min && job.budget?.max
                      ? `${formatCurrency(job.budget.min)} - ${formatCurrency(job.budget.max)}`
                      : formatCurrency(job.budget?.min || job.budget?.max || 0)}
                  </span>
                </div>
                {job.location?.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location.city}</span>
                  </div>
                )}
              </div>

              {job.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {job.specializations.slice(0, 3).map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                      {spec}
                    </span>
                  ))}
                  {job.specializations.length > 3 && (
                    <span className="text-xs text-slate-400">+{job.specializations.length - 3}</span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} jobs)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Job Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Job Header */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{selectedJob.title}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusBadgeClass(selectedJob.status)}`}>
                  {selectedJob.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                  <p className="text-sm text-slate-600">{selectedJob.description}</p>
                </div>
              )}

              {/* Posted By */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Posted by</p>
                  <p className="font-medium text-slate-900">{selectedJob.postedBy?.name || 'Unknown'}</p>
                </div>
              </div>

              {/* Assigned Contractor */}
              {selectedJob.assignedContractor && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Assigned to</p>
                    <p className="font-medium text-green-800">
                      {selectedJob.assignedContractor?.name || 'Contractor'}
                    </p>
                  </div>
                </div>
              )}

              {/* Budget */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Budget</h4>
                <p className="text-2xl font-bold text-slate-900">
                  {selectedJob.budget?.min && selectedJob.budget?.max
                    ? `${formatCurrency(selectedJob.budget.min)} - ${formatCurrency(selectedJob.budget.max)}`
                    : formatCurrency(selectedJob.budget?.min || selectedJob.budget?.max || 0)}
                </p>
                {selectedJob.budget?.type && (
                  <span className="text-xs text-slate-500 mt-1 block">
                    Budget type: {selectedJob.budget.type}
                  </span>
                )}
              </div>

              {/* Location */}
              {selectedJob.location?.city && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {[selectedJob.location.address, selectedJob.location.city, selectedJob.location.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-3">
                {selectedJob.timeline?.startDate && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedJob.timeline.startDate)}</p>
                    </div>
                  </div>
                )}
                {selectedJob.timeline?.endDate && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">End Date</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedJob.timeline.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Specializations */}
              {selectedJob.specializations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.specializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Info */}
              {selectedJob.project && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Project</p>
                    <p className="text-sm text-slate-900">{selectedJob.project?.name || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <p className="text-xs text-slate-400 text-center">
                Posted on {formatDate(selectedJob.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
