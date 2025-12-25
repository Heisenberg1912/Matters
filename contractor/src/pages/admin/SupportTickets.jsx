import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  Ticket,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  X,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [pagination.page, statusFilter, priorityFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        priority: priorityFilter,
      }
      const response = await adminApi.getTickets(params)
      if (response.success) {
        setTickets(response.data.tickets)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadTickets()
  }

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      setActionLoading(true)
      const response = await adminApi.updateTicket(ticketId, updates)
      if (response.success) {
        loadTickets()
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(prev => ({ ...prev, ...updates }))
        }
      }
    } catch (err) {
      console.error('Failed to update ticket:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-slate-500 text-sm">Manage customer support requests</p>
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
              placeholder="Search tickets..."
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

        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {tickets.filter(t => t.status === 'pending').length}
          </p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {tickets.filter(t => t.status === 'in_progress').length}
          </p>
          <p className="text-xs text-slate-500">In Progress</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'resolved').length}
          </p>
          <p className="text-xs text-slate-500">Resolved</p>
        </Card>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket._id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedTicket(ticket)
                setShowModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(ticket.status)}
                    <span className="text-xs text-slate-400">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-900">{ticket.subject}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-1">{ticket.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(ticket.status)}`}>
                  {ticket.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{ticket.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages}
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

      {/* Ticket Detail Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Ticket Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Ticket Header */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-400">{selectedTicket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900">{selectedTicket.subject}</h3>
              </div>

              {/* Status Update */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Update Status</h4>
                <div className="flex gap-2">
                  {['pending', 'in_progress', 'resolved'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateTicket(selectedTicket._id, { status })}
                      disabled={actionLoading || selectedTicket.status === status}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTicket.status === status
                          ? status === 'resolved'
                            ? 'bg-green-600 text-white'
                            : status === 'in_progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-yellow-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      } disabled:opacity-50`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Update */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Priority</h4>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => handleUpdateTicket(selectedTicket._id, { priority })}
                      disabled={actionLoading || selectedTicket.priority === priority}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        selectedTicket.priority === priority
                          ? priority === 'high'
                            ? 'bg-red-600 text-white'
                            : priority === 'medium'
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      } disabled:opacity-50`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedTicket.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{selectedTicket.user?.email || 'No email'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Project Info */}
              {selectedTicket.project && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Related Project</p>
                    <p className="text-sm text-slate-900">{selectedTicket.project?.name || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTicket.attachments?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((attachment, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{attachment.filename || `Attachment ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                </div>
                {selectedTicket.resolvedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Resolved: {formatDate(selectedTicket.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
