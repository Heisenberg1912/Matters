import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, User, Phone, Mail,
  DollarSign, Clock, FileText, Image, CheckCircle2,
  Loader2, AlertCircle, ExternalLink
} from 'lucide-react'
import { projectsApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.getProject(id)
      if (response.success) {
        setProject(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 spinner" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error || 'Project not found'}</p>
            <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stages', label: 'Stages' },
    { id: 'documents', label: 'Documents' },
  ]

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-4 pb-20 safe-top">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">{project.name}</h1>
            {project.location?.city && (
              <div className="flex items-center gap-1 text-primary-100">
                <MapPin className="w-4 h-4" />
                <span>{project.location.city}, {project.location.state}</span>
              </div>
            )}
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12">
        {/* Progress Card */}
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Project Progress</span>
              <span className="text-xl font-bold text-primary-600">{project.progress || 0}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Client Info */}
            {project.owner && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-slate-900">Client Information</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{project.owner.name}</p>
                      <p className="text-slate-500 text-sm">Project Owner</p>
                    </div>
                  </div>
                  {project.owner.phone && (
                    <a
                      href={`tel:${project.owner.phone}`}
                      className="flex items-center gap-3 text-slate-600 hover:text-primary-600"
                    >
                      <Phone className="w-5 h-5" />
                      <span>{project.owner.phone}</span>
                    </a>
                  )}
                  {project.owner.email && (
                    <a
                      href={`mailto:${project.owner.email}`}
                      className="flex items-center gap-3 text-slate-600 hover:text-primary-600"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{project.owner.email}</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Project Details */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-900">Project Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Description</p>
                    <p className="text-slate-900">{project.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">
                        {formatDate(project.timeline?.startDate)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-1">End Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">
                        {formatDate(project.timeline?.expectedEndDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {project.budget && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Total Budget</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 font-medium">
                          {formatCurrency(project.budget.total)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Spent</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 font-medium">
                          {formatCurrency(project.budget.spent)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {project.location?.address && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-slate-900">Location</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-900">{project.location.address}</p>
                      <p className="text-slate-500">
                        {project.location.city}, {project.location.state} {project.location.pincode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="space-y-3">
            {project.stages?.length > 0 ? (
              project.stages.map((stage, index) => (
                <Card key={stage._id || index}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        stage.status === 'completed'
                          ? 'bg-green-100'
                          : stage.status === 'in_progress'
                          ? 'bg-primary-100'
                          : 'bg-slate-100'
                      }`}>
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className={`text-sm font-bold ${
                            stage.status === 'in_progress' ? 'text-primary-600' : 'text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-slate-900">{stage.name}</h4>
                          <StatusBadge status={stage.status} />
                        </div>
                        {stage.description && (
                          <p className="text-slate-500 text-sm mb-2">{stage.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {stage.progress !== undefined && (
                            <span>{stage.progress}% complete</span>
                          )}
                          {stage.timeline?.endDate && (
                            <span>Due: {formatDate(stage.timeline.endDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No stages defined yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3">
            {project.documents?.length > 0 ? (
              project.documents.map((doc, index) => (
                <Card key={doc._id || index} hover>
                  <CardContent className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      {doc.type?.includes('image') ? (
                        <Image className="w-6 h-6 text-slate-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{doc.name}</h4>
                      <p className="text-slate-500 text-sm">
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No documents uploaded yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
