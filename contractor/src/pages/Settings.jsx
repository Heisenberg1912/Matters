import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bell, Moon, Globe, Shield, HelpCircle,
  FileText, LogOut, ChevronRight, Smartphone
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/Card'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true)
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/login', { replace: true })
    }
  }

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          description: 'Receive notifications for new jobs and updates',
          type: 'toggle',
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Use dark theme',
          type: 'toggle',
          value: darkMode,
          onChange: () => setDarkMode(!darkMode),
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'English',
          type: 'link',
          onClick: () => {},
        },
      ],
    },
    {
      title: 'Account & Security',
      items: [
        {
          icon: Shield,
          label: 'Change Password',
          type: 'link',
          onClick: () => {},
        },
        {
          icon: Smartphone,
          label: 'Active Sessions',
          description: 'Manage your logged in devices',
          type: 'link',
          onClick: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          type: 'link',
          onClick: () => {},
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          type: 'link',
          onClick: () => {},
        },
        {
          icon: FileText,
          label: 'Privacy Policy',
          type: 'link',
          onClick: () => {},
        },
      ],
    },
  ]

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {settingsGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
              {group.title}
            </h2>
            <Card>
              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className={`p-4 flex items-center gap-4 ${
                      item.type === 'link' ? 'cursor-pointer hover:bg-slate-50' : ''
                    }`}
                    onClick={item.type === 'link' ? item.onClick : undefined}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      {item.description && (
                        <p className="text-slate-500 text-sm">{item.description}</p>
                      )}
                    </div>
                    {item.type === 'toggle' ? (
                      <button
                        onClick={item.onChange}
                        className={`w-12 h-7 rounded-full transition-colors ${
                          item.value ? 'bg-primary-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                            item.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}

        {/* Logout */}
        <Card>
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-4 hover:bg-slate-50"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-medium text-red-600">Logout</span>
          </button>
        </Card>

        {/* App Info */}
        <div className="text-center mt-8 pb-4">
          <p className="text-slate-400 text-sm">Matters Contractor v0.0.1</p>
          <p className="text-slate-400 text-xs mt-1">Made with love for contractors</p>
        </div>
      </div>
    </div>
  )
}
