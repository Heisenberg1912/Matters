import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, MapPin, Calendar, Search, Loader2, AlertCircle
} from 'lucide-react'
import { contractorApi } from '../services/api'
import { Card, CardContent } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  useEffect(() => {
    loadProjects()
  }, [filter])

  const loadProjects = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (filter !== 'all') params.status = filter

      const response = await contractorApi.getProjects(params)
      if (response.success) {
        setProjects(response.data.projects)
        setPagination(response.data.pagination)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(search.toLowerCase()) ||
    project.location?.city?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 mb-4">My Projects</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'planning', label: 'Planning' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
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
              <Button onClick={() => loadProjects()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No projects found</h3>
              <p className="text-slate-500 text-sm">
                {filter !== 'all'
                  ? `You don't have any ${filter.replace('_', ' ')} projects`
                  : 'Projects assigned to you will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Card
                key={project._id}
                hover
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-7 h-7 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {project.name}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>

                      {project.location?.city && (
                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{project.location.city}, {project.location.state}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-medium text-slate-700">{project.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(project.timeline?.expectedEndDate)}</span>
                        </div>
                        {project.budget?.total && (
                          <span className="font-medium text-slate-700">
                            {formatCurrency(project.budget.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More */}
            {pagination.page < pagination.pages && (
              <div className="text-center pt-4">
                <Button
                  variant="secondary"
                  onClick={() => loadProjects(pagination.page + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
