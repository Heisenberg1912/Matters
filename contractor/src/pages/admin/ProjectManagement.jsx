import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  Building2,
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
  Pause
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedProject, setSelectedProject] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [pagination.page, statusFilter])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      }
      const response = await adminApi.getProjects(params)
      if (response.success) {
        setProjects(response.data.projects)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadProjects()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'on_hold':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Building2 className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'planning':
        return 'bg-primary-100 text-primary-700'
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
        <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
        <p className="text-slate-500 text-sm">View and manage all projects</p>
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
              placeholder="Search projects..."
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
          {['', 'draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
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

      {/* Projects List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedProject(project)
                setShowModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(project.status)}
                    <h3 className="font-medium text-slate-900">{project.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{project.description || 'No description'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(project.status)}`}>
                  {project.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{project.owner?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(project.budget?.estimated)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {project.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-slate-700 font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
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
            Page {pagination.page} of {pagination.pages} ({pagination.total} projects)
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

      {/* Project Detail Modal */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Project Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Header */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(selectedProject.status)}
                  <h3 className="font-semibold text-lg text-slate-900">{selectedProject.name}</h3>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusBadgeClass(selectedProject.status)}`}>
                  {selectedProject.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedProject.owner?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{selectedProject.owner?.email || 'No email'}</p>
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Estimated Budget</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedProject.budget?.estimated)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Spent</p>
                  <p className="text-lg font-bold text-primary-600">{formatCurrency(selectedProject.budget?.spent)}</p>
                </div>
              </div>

              {/* Progress */}
              {selectedProject.progress !== undefined && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Progress</span>
                    <span className="text-lg font-bold text-slate-900">{selectedProject.progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Timeline</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedProject.timeline?.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">End Date</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedProject.timeline?.expectedEndDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedProject.location?.city && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {[selectedProject.location.city, selectedProject.location.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <p className="text-xs text-slate-400 text-center">
                Created on {formatDate(selectedProject.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
