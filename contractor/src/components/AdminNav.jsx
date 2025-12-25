import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Building2,
  Briefcase,
  Ticket,
  BarChart3,
  Settings
} from 'lucide-react'

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/contractors', icon: HardHat, label: 'Contractors' },
  { path: '/admin/projects', icon: Building2, label: 'Projects' },
  { path: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/admin/tickets', icon: Ticket, label: 'Tickets' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40">
      <div className="flex justify-around items-center overflow-x-auto no-scrollbar">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
        {/* More button for additional pages */}
        <div className="relative group">
          <button
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[60px] ${
              ['/admin/tickets', '/admin/analytics', '/admin/settings'].includes(location.pathname)
                ? 'text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 bg-current rounded-full"></span>
              <span className="w-1 h-1 bg-current rounded-full"></span>
              <span className="w-1 h-1 bg-current rounded-full"></span>
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
          {/* Dropdown */}
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {navItems.slice(5).map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-slate-50 transition ${
                    isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
