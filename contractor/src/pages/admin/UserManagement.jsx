import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  HardHat,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [pagination.page, roleFilter, statusFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter,
      }
      const response = await adminApi.getUsers(params)
      if (response.success) {
        setUsers(response.data.users)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    loadUsers()
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      setActionLoading(true)
      const response = await adminApi.updateUser(userId, updates)
      if (response.success) {
        loadUsers()
        setShowModal(false)
        setSelectedUser(null)
      }
    } catch (err) {
      console.error('Failed to update user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    try {
      setActionLoading(true)
      const response = await adminApi.deleteUser(userId)
      if (response.success) {
        loadUsers()
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return <ShieldCheck className="h-4 w-4" />
      case 'contractor':
        return <HardHat className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-primary-100 text-primary-700'
      case 'admin':
        return 'bg-indigo-100 text-indigo-700'
      case 'contractor':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage all platform users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <UserPlus className="h-5 w-5" />
        </button>
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
              placeholder="Search users..."
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="user">Customer</option>
            <option value="contractor">Contractor</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card
              key={user._id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedUser(user)
                setShowModal(true)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold">{user.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getRoleBadgeClass(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role}
                  </span>
                  <p className={`text-xs mt-1 ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Joined {formatDate(user.createdAt)}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  user.subscription?.plan === 'enterprise'
                    ? 'bg-primary-100 text-primary-700'
                    : user.subscription?.plan === 'pro'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.subscription?.plan || 'free'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
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

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">User Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold">{selectedUser.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg text-slate-900">{selectedUser.name}</p>
                  <p className="text-slate-500">{selectedUser.email}</p>
                  <p className="text-sm text-slate-400">{selectedUser.phone || 'No phone'}</p>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="user">Customer</option>
                  <option value="contractor">Contractor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUser(prev => ({ ...prev, isActive: true }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      selectedUser.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setSelectedUser(prev => ({ ...prev, isActive: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      !selectedUser.isActive
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Subscription Plan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subscription Plan</label>
                <select
                  value={selectedUser.subscription?.plan || 'free'}
                  onChange={(e) => setSelectedUser(prev => ({
                    ...prev,
                    subscription: { ...prev.subscription, plan: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleUpdateUser(selectedUser._id, {
                    role: selectedUser.role,
                    isActive: selectedUser.isActive,
                    subscription: selectedUser.subscription
                  })}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser._id)}
                  disabled={actionLoading}
                  className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.createUser(formData)
      if (response.success) {
        onSuccess()
      } else {
        setError(response.error || 'Failed to create user')
      }
    } catch (err) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Create User</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="user">Customer</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  )
}
