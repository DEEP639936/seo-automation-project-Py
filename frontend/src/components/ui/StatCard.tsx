import React from 'react'
import { motion } from 'framer-motion'
import { cn, formatNumber } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  delay?: number
}

export function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', delay = 0 }: StatCardProps) {
  const colors = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    amber: 'bg-warning-50 text-warning-600',
    red: 'bg-danger-50 text-danger-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const numValue = typeof value === 'number' ? value : parseInt(value as string) || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl p-6 border border-dark-100/50 shadow-card hover:shadow-soft transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-dark-900">{formatNumber(numValue)}</h3>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                'text-xs font-semibold',
                trend > 0 ? 'text-success-600' : trend < 0 ? 'text-danger-600' : 'text-dark-400'
              )}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-dark-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}
