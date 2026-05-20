import React from 'react'
import { cn, getScoreColor, getScoreBg } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export function ScoreRing({ score, size = 'md', label, className }: ScoreRingProps) {
  const sizes = {
    sm: { w: 60, stroke: 6, text: 'text-sm' },
    md: { w: 100, stroke: 8, text: 'text-xl' },
    lg: { w: 140, stroke: 10, text: 'text-3xl' },
  }

  const { w, stroke, text } = sizes[size]
  const radius = (w - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: w, height: w }}>
        <svg className="transform -rotate-90" width={w} height={w}>
          <circle
            cx={w / 2}
            cy={w / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-dark-100"
          />
          <circle
            cx={w / 2}
            cy={w / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn('transition-all duration-1000', getScoreColor(score))}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-dark-900', text)}>{score}</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium text-dark-500">{label}</span>}
    </div>
  )
}
