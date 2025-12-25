import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  HardHat,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  X,
  Badge,
  Calendar
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function ContractorManagement() {
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedContractor, setSelectedContractor] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadContractors()
  }, [pagination.page, verifiedFilter])

  const loadContractors = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        verified: verifiedFilter,
      }
      const response = await adminApi.getContractors(params)
      if (response.success) {
        setContractors(response.data.contractors)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to load contractors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadContractors()
  }

  const handleVerify = async (contractorId, verified) => {
    try {
      setActionLoading(true)
      const response = await adminApi.verifyContractor(contractorId, verified)
      if (response.success) {
        loadContractors()
        if (selectedContractor?._id === contractorId) {
          setSelectedContractor(prev => ({
            ...prev,
            contractor: { ...prev.contractor, isVerified: verified }
          }))
        }
      }
    } catch (err) {
      console.error('Failed to verify contractor:', err)
    } finally {
      setActionLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-slate-900">Contractor Management</h1>
        <p className="text-slate-500 text-sm">Verify and manage contractors</p>
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
              placeholder="Search contractors..."
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

        <div className="flex gap-2">
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {contractors.filter(c => c.contractor?.isVerified).length}
          </p>
          <p className="text-xs text-slate-500">Verified</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {contractors.filter(c => !c.contractor?.isVerified).length}
          </p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
      </div>

      {/* Contractors List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : contractors.length === 0 ? (
        <div className="text-center py-12">
          <HardHat className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No contractors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contractors.map((contractor) => (
            <Card
              key={contractor._id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedContractor(contractor)
                setShowModal(true)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    {contractor.avatar ? (
                      <img src={contractor.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <HardHat className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{contractor.name}</p>
                      {contractor.contractor?.isVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{contractor.company?.name || 'Independent'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-slate-600">
                        {contractor.rating?.average?.toFixed(1) || '0.0'} ({contractor.rating?.count || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    contractor.contractor?.isVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {contractor.contractor?.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              {contractor.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {contractor.specializations.slice(0, 3).map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                      {spec}
                    </span>
                  ))}
                  {contractor.specializations.length > 3 && (
                    <span className="text-xs text-slate-400">+{contractor.specializations.length - 3} more</span>
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

      {/* Contractor Detail Modal */}
      {showModal && selectedContractor && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Contractor Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  {selectedContractor.avatar ? (
                    <img src={selectedContractor.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <HardHat className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg text-slate-900">{selectedContractor.name}</p>
                    {selectedContractor.contractor?.isVerified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-slate-500">{selectedContractor.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {selectedContractor.rating?.average?.toFixed(1) || '0.0'} ({selectedContractor.rating?.count || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className={`p-4 rounded-xl ${
                selectedContractor.contractor?.isVerified
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedContractor.contractor?.isVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-orange-600" />
                    )}
                    <span className={`font-medium ${
                      selectedContractor.contractor?.isVerified ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {selectedContractor.contractor?.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleVerify(selectedContractor._id, !selectedContractor.contractor?.isVerified)}
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedContractor.contractor?.isVerified
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? '...' : selectedContractor.contractor?.isVerified ? 'Revoke' : 'Verify'}
                  </button>
                </div>
                {selectedContractor.contractor?.verifiedAt && (
                  <p className="text-xs text-slate-500 mt-2">
                    Verified on {formatDate(selectedContractor.contractor.verifiedAt)}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">Contact Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 truncate">{selectedContractor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{selectedContractor.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              {selectedContractor.company?.name && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">Company</h3>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{selectedContractor.company.name}</span>
                    </div>
                    {selectedContractor.company.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{selectedContractor.company.address}</span>
                      </div>
                    )}
                    {selectedContractor.company.gstin && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">GSTIN: {selectedContractor.company.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {selectedContractor.specializations?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContractor.specializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-slate-900">{selectedContractor.contractor?.completedProjects || 0}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-slate-900">{selectedContractor.contractor?.activeProjects || 0}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-slate-900">{selectedContractor.contractor?.yearsOfExperience || 0}</p>
                  <p className="text-xs text-slate-500">Years Exp</p>
                </div>
              </div>

              {/* Documents */}
              {selectedContractor.contractor?.documents?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">Documents</h3>
                  <div className="space-y-2">
                    {selectedContractor.contractor.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{doc.type}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.verified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedContractor.contractor?.bio && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">Bio</h3>
                  <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                    {selectedContractor.contractor.bio}
                  </p>
                </div>
              )}

              {/* Join Date */}
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(selectedContractor.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
