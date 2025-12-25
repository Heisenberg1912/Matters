import { NavLink, useLocation } from 'react-router-dom'
import { Home, Briefcase, FolderKanban, User, Wallet } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/earnings', icon: Wallet, label: 'Earnings' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to !== '/dashboard' && location.pathname.startsWith(to))

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`}
              />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
