import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Clock, DollarSign,
  User, Building2, Briefcase, Send, Play, CheckCircle,
  Loader2, AlertCircle, FileText
} from 'lucide-react'
import { jobsApi } from '../services/api'
import { Card, CardContent, CardHeader } from '../components/Card'
import { StatusBadge } from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBidForm, setShowBidForm] = useState(false)
  const [bidData, setBidData] = useState({ amount: '', proposal: '', estimatedDuration: '' })
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadJob()
  }, [id])

  const loadJob = async () => {
    try {
      setLoading(true)
      const response = await jobsApi.getJob(id)
      if (response.success) {
        setJob(response.data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async (e) => {
    e.preventDefault()
    if (!bidData.amount || !bidData.proposal) return

    try {
      setSubmitting(true)
      await jobsApi.submitBid(id, {
        amount: parseFloat(bidData.amount),
        proposal: bidData.proposal,
        estimatedDuration: bidData.estimatedDuration,
      })
      await loadJob()
      setShowBidForm(false)
      setBidData({ amount: '', proposal: '', estimatedDuration: '' })
    } catch (err) {
      alert(err.message || 'Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartJob = async () => {
    try {
      setActionLoading(true)
      await jobsApi.startJob(id)
      await loadJob()
    } catch (err) {
      alert(err.message || 'Failed to start job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteJob = async () => {
    if (!confirm('Are you sure you want to mark this job as complete?')) return

    try {
      setActionLoading(true)
      await jobsApi.completeJob(id)
      await loadJob()
    } catch (err) {
      alert(err.message || 'Failed to complete job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdrawBid = async (bidId) => {
    if (!confirm('Are you sure you want to withdraw your bid?')) return

    try {
      setActionLoading(true)
      await jobsApi.withdrawBid(id, bidId)
      await loadJob()
    } catch (err) {
      alert(err.message || 'Failed to withdraw bid')
    } finally {
      setActionLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 spinner" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">{error || 'Job not found'}</p>
            <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const myBid = job.bids?.[0] // API filters to show only user's bid
  const canBid = job.status === 'open' && !myBid
  const isAssigned = job.assignedContractor && job.status !== 'completed'

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-4 pb-16 safe-top">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-bold text-white mb-2">{job.title}</h1>
            {job.location?.city && (
              <div className="flex items-center gap-1 text-primary-100">
                <MapPin className="w-4 h-4" />
                <span>{job.location.city}, {job.location.state}</span>
              </div>
            )}
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8">
        {/* Budget Card */}
        <Card className="mb-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Budget</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatBudget(job.budget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm">Bids</p>
                <p className="text-xl font-bold text-slate-900">{job.bidCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Bid Status */}
        {myBid && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Your Bid</h3>
                <StatusBadge status={myBid.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(myBid.amount)}
                  </span>
                </div>
                {myBid.estimatedDuration && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="text-slate-900">{myBid.estimatedDuration}</span>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-sm mb-1">Proposal</p>
                  <p className="text-slate-900 text-sm">{myBid.proposal}</p>
                </div>
                {myBid.responseNote && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Response from client</p>
                    <p className="text-slate-900 text-sm">{myBid.responseNote}</p>
                  </div>
                )}
                {myBid.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleWithdrawBid(myBid._id)}
                    loading={actionLoading}
                  >
                    Withdraw Bid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canBid && !showBidForm && (
          <Button
            fullWidth
            size="lg"
            onClick={() => setShowBidForm(true)}
            className="mb-4"
          >
            <Send className="w-5 h-5" />
            Submit Bid
          </Button>
        )}

        {isAssigned && job.status === 'assigned' && (
          <Button
            fullWidth
            size="lg"
            onClick={handleStartJob}
            loading={actionLoading}
            className="mb-4"
          >
            <Play className="w-5 h-5" />
            Start Work
          </Button>
        )}

        {isAssigned && job.status === 'in_progress' && (
          <Button
            fullWidth
            size="lg"
            variant="success"
            onClick={handleCompleteJob}
            loading={actionLoading}
            className="mb-4"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Complete
          </Button>
        )}

        {/* Bid Form */}
        {showBidForm && (
          <Card className="mb-4">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Submit Your Bid</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <Input
                  type="number"
                  label="Bid Amount (INR)"
                  placeholder="Enter your bid amount"
                  value={bidData.amount}
                  onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                  required
                />
                <Input
                  label="Estimated Duration"
                  placeholder="e.g., 2 weeks, 1 month"
                  value={bidData.estimatedDuration}
                  onChange={(e) => setBidData({ ...bidData, estimatedDuration: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Proposal
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                    placeholder="Describe your approach and why you're the best fit for this job..."
                    value={bidData.proposal}
                    onChange={(e) => setBidData({ ...bidData, proposal: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowBidForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    Submit Bid
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Job Details */}
        <Card className="mb-4">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Job Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.description && (
              <div>
                <p className="text-slate-500 text-sm mb-1">Description</p>
                <p className="text-slate-900">{job.description}</p>
              </div>
            )}

            {job.requiredSpecializations?.length > 0 && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSpecializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-sm mb-1">Work Type</p>
                <p className="text-slate-900 capitalize">
                  {job.workType?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              {job.timeline?.flexibility && (
                <div>
                  <p className="text-slate-500 text-sm mb-1">Timeline</p>
                  <p className="text-slate-900 capitalize">{job.timeline.flexibility}</p>
                </div>
              )}
            </div>

            {job.requirements?.length > 0 && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Requirements</p>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-slate-600">
                        {index + 1}
                      </span>
                      <span className="text-slate-900 text-sm">{req.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        {job.postedBy && (
          <Card className="mb-4">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Posted By</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{job.postedBy.name}</p>
                  <p className="text-slate-500 text-sm">Project Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Info */}
        {job.project && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Related Project</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{job.project.name}</p>
                  {job.project.location?.city && (
                    <p className="text-slate-500 text-sm">
                      {job.project.location.city}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
