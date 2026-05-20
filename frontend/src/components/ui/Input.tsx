import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-dark-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900',
              'placeholder:text-dark-400',
              'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none',
              'transition-all duration-200',
              error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10',
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger-600 font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
