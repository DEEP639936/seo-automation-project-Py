import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/websites': 'Websites',
  '/audits': 'SEO Audits',
  '/keywords': 'Keyword Research',
  '/rankings': 'Rankings',
  '/backlinks': 'Backlinks',
  '/content': 'Content Studio',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const { user } = useAuth()
  const title = pageTitles[location.pathname] || 'SEO Automation'

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-dark-100/50">
      <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          {/* Hamburger — only visible on mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl text-dark-600 hover:bg-dark-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-dark-900">{title}</h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search bar — hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-50 rounded-xl border border-dark-100">
            <Search className="w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent text-sm text-dark-700 placeholder:text-dark-400 outline-none w-48"
            />
          </div>

          {/* Search icon — mobile only */}
          <button className="md:hidden p-2 rounded-xl hover:bg-dark-50 transition-colors">
            <Search className="w-5 h-5 text-dark-600" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-dark-50 transition-colors">
            <Bell className="w-5 h-5 text-dark-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </div>
    </header>
  )
}