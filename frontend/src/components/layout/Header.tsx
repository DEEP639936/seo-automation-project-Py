import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, X, CheckCheck, Info, TrendingUp, AlertTriangle, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/':          'Dashboard',
  '/websites':  'Websites',
  '/audits':    'SEO Audits',
  '/keywords':  'Keyword Research',
  '/rankings':  'Rankings',
  '/backlinks': 'Backlinks',
  '/content':   'Content Studio',
  '/reports':   'Reports',
  '/settings':  'Settings',
}

// ── Search suggestions ────────────────────────────────────────────────────────
const SEARCH_ITEMS = [
  { label: 'Dashboard',        path: '/',          icon: '📊' },
  { label: 'Websites',         path: '/websites',  icon: '🌐' },
  { label: 'SEO Audits',       path: '/audits',    icon: '🔍' },
  { label: 'Keyword Research', path: '/keywords',  icon: '🔑' },
  { label: 'Rankings',         path: '/rankings',  icon: '📈' },
  { label: 'Backlinks',        path: '/backlinks', icon: '🔗' },
  { label: 'Content Studio',   path: '/content',   icon: '✍️'  },
  { label: 'Reports',          path: '/reports',   icon: '📄' },
]

// ── Static demo notifications ─────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    icon: TrendingUp,
    iconColor: 'text-success-600',
    iconBg:    'bg-success-50',
    title:     'SEO Score Improved',
    message:   'amazon.com score jumped from 75 → 81 after the last audit.',
    time:      '2 min ago',
    read:      false,
  },
  {
    id: 2,
    icon: AlertTriangle,
    iconColor: 'text-warning-600',
    iconBg:    'bg-warning-50',
    title:     'Critical Issues Found',
    message:   '5 missing meta descriptions detected on flipkart.com.',
    time:      '18 min ago',
    read:      false,
  },
  {
    id: 3,
    icon: Globe,
    iconColor: 'text-primary-600',
    iconBg:    'bg-primary-50',
    title:     'Audit Completed',
    message:   'Full audit for deep.com finished — 73/100 score.',
    time:      '1 hr ago',
    read:      false,
  },
  {
    id: 4,
    icon: Info,
    iconColor: 'text-dark-500',
    iconBg:    'bg-dark-100',
    title:     'Keyword Ranking Update',
    message:   '"seo automation" moved from #12 to #8 on Google.',
    time:      '3 hr ago',
    read:      true,
  },
  {
    id: 5,
    icon: Info,
    iconColor: 'text-dark-500',
    iconBg:    'bg-dark-100',
    title:     'Weekly Report Ready',
    message:   'Your weekly SEO summary report has been generated.',
    time:      'Yesterday',
    read:      true,
  },
]

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const navigate  = useNavigate()
  const title = pageTitles[location.pathname] || 'SEO Automation'

  // ── Notification state ──────────────────────────────────────────────────────
  const [notifications, setNotifications]     = useState(INITIAL_NOTIFICATIONS)
  const [notifOpen,     setNotifOpen]          = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const markOneRead = (id: number) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const deleteNotif = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchOpen,    setSearchOpen]    = useState(false)   // mobile search bar
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filteredItems = SEARCH_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearchSelect = (path: string) => {
    navigate(path)
    setSearchQuery('')
    setSearchFocused(false)
    setSearchOpen(false)
  }

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-dark-100/50">
      <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-8">

        {/* Left — hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl text-dark-600 hover:bg-dark-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Hide title when mobile search bar is open */}
          {!searchOpen && (
            <h2 className="text-lg sm:text-xl font-bold text-dark-900">{title}</h2>
          )}
        </div>

        {/* Right — search + notifications */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* ── Desktop search ─────────────────────────────────────────────── */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-50 rounded-xl border border-dark-100 focus-within:border-primary-400 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-dark-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="bg-transparent text-sm text-dark-700 placeholder:text-dark-400 outline-none w-48"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3.5 h-3.5 text-dark-400 hover:text-dark-600" />
                </button>
              )}
            </div>

            {/* Desktop dropdown */}
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-elevated border border-dark-100 overflow-hidden z-50"
                >
                  <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wide px-4 pt-3 pb-1">
                    {searchQuery ? 'Results' : 'Quick Navigate'}
                  </p>
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-dark-400 px-4 py-3">No results found</p>
                  ) : (
                    filteredItems.map(item => (
                      <button
                        key={item.path}
                        onClick={() => handleSearchSelect(item.path)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-dark-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </button>
                    ))
                  )}
                  <div className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Mobile search toggle button ─────────────────────────────────── */}
          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-dark-50 transition-colors"
              aria-label="Open search"
            >
              <Search className="w-5 h-5 text-dark-600" />
            </button>
          )}

          {/* ── Mobile expanded search bar ──────────────────────────────────── */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                ref={searchRef}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden flex items-center gap-2 flex-1 relative"
              >
                <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-dark-50 rounded-xl border border-dark-100 focus-within:border-primary-400 focus-within:bg-white transition-all">
                  <Search className="w-4 h-4 text-dark-400 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="bg-transparent text-sm text-dark-700 placeholder:text-dark-400 outline-none flex-1 min-w-0"
                  />
                </div>
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchFocused(false) }}
                  className="p-2 rounded-xl hover:bg-dark-50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-dark-600" />
                </button>

                {/* Mobile search dropdown */}
                <AnimatePresence>
                  {searchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-elevated border border-dark-100 overflow-hidden z-50"
                    >
                      <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wide px-4 pt-3 pb-1">
                        {searchQuery ? 'Results' : 'Quick Navigate'}
                      </p>
                      {filteredItems.length === 0 ? (
                        <p className="text-sm text-dark-400 px-4 py-3">No results found</p>
                      ) : (
                        filteredItems.map(item => (
                          <button
                            key={item.path}
                            onClick={() => handleSearchSelect(item.path)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-dark-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                          </button>
                        ))
                      )}
                      <div className="h-2" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Notification bell ───────────────────────────────────────────── */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(prev => !prev)}
              className={cn(
                'relative p-2 rounded-xl transition-colors',
                notifOpen ? 'bg-primary-50 text-primary-600' : 'hover:bg-dark-50 text-dark-600'
              )}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-danger-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white leading-none">{unreadCount}</span>
                </span>
              )}
            </button>

            {/* Notification panel */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-dark-100 overflow-hidden z-50"
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-dark-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-danger-500 text-white rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-dark-50">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-dark-400">
                        <Bell className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markOneRead(notif.id)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group relative',
                            notif.read ? 'bg-white hover:bg-dark-50' : 'bg-primary-50/40 hover:bg-primary-50'
                          )}
                        >
                          {/* Icon */}
                          <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', notif.iconBg)}>
                            <notif.icon className={cn('w-4 h-4', notif.iconColor)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-sm font-semibold truncate', notif.read ? 'text-dark-700' : 'text-dark-900')}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[11px] text-dark-400 mt-1">{notif.time}</p>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={e => deleteNotif(notif.id, e)}
                            className="opacity-0 group-hover:opacity-100 absolute right-3 top-3 p-1 rounded-lg hover:bg-dark-100 transition-all"
                          >
                            <X className="w-3.5 h-3.5 text-dark-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Panel footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-dark-100 bg-dark-50/50">
                      <button
                        onClick={() => setNotifications([])}
                        className="text-xs text-dark-400 hover:text-danger-500 transition-colors w-full text-center"
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  )
}