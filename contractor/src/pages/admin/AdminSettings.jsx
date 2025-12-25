import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Globe,
  Lock,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'View and edit your admin profile',
          action: () => {},
        },
        {
          icon: Lock,
          label: 'Security',
          description: 'Password and authentication settings',
          action: () => {},
        },
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Notification Preferences',
          description: 'Configure email and push notifications',
          action: () => {},
        },
      ]
    },
    {
      title: 'System',
      items: [
        {
          icon: Database,
          label: 'Database',
          description: 'View database statistics',
          action: () => {},
        },
        {
          icon: Globe,
          label: 'API Settings',
          description: 'Manage API keys and webhooks',
          action: () => {},
        },
      ]
    },
  ]

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500 text-sm">Manage your admin preferences</p>
      </div>

      {/* Admin Profile Card */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <Shield className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-slate-900">{user?.name || 'Admin'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-sm font-medium text-slate-500 mb-2 px-1">{section.title}</h3>
          <Card className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            ))}
          </Card>
        </div>
      ))}

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-500 mb-2 px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center gap-2 hover:bg-blue-100 transition"
          >
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-700">Manage Users</span>
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center gap-2 hover:bg-green-100 transition"
          >
            <Globe className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700">View Analytics</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-red-500 mb-2 px-1">Session</h3>
        <Card className="border-red-200">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-600">Logout</p>
              <p className="text-sm text-slate-500">Sign out of admin panel</p>
            </div>
          </button>
        </Card>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-slate-400 mt-8">
        <p>Matters Admin Panel</p>
        <p>Version 1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Confirm Logout</h3>
                <p className="text-sm text-slate-500">Are you sure you want to logout?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
