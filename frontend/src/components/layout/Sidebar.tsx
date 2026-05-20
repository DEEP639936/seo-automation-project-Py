import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Globe, Search, FileSearch, PenTool,
  TrendingUp, Link2, FileText, Settings, LogOut, ChevronRight,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/websites', icon: Globe, label: 'Websites' },
  { path: '/audits', icon: FileSearch, label: 'Audits' },
  { path: '/keywords', icon: Search, label: 'Keywords' },
  { path: '/rankings', icon: TrendingUp, label: 'Rankings' },
  { path: '/backlinks', icon: Link2, label: 'Backlinks' },
  { path: '/content', icon: PenTool, label: 'Content' },
  { path: '/reports', icon: FileText, label: 'Reports' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-950 border-r border-dark-800/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SEO Automation</h1>
            <p className="text-[10px] text-dark-400 font-medium">AI-Powered Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: navActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'text-white bg-primary-600/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                )
              }
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn('w-5 h-5', isActive ? 'text-primary-400' : '')} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary-400" />}
            </NavLink>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dark-800/50">
        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl bg-dark-800/30">
          <div className="w-9 h-9 rounded-full bg-primary-600/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary-400">
              {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.first_name || user?.email}</p>
            <p className="text-xs text-dark-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-dark-400 hover:text-danger-400 hover:bg-danger-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
