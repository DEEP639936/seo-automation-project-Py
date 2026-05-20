import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Search, Shield } from 'lucide-react'

const features = [
  { icon: TrendingUp, text: 'Track rankings in real-time' },
  { icon: Search, text: 'AI-powered keyword research' },
  { icon: Shield, text: 'Comprehensive SEO audits' },
]

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-800/20 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SEO Automation</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              AI-Powered SEO<br />Automation Platform
            </h1>
            <p className="text-lg text-dark-300 mb-8 max-w-md">
              Automate your SEO workflow with AI-driven audits, keyword research, and content optimization.
            </p>
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-sm text-dark-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-dark-500">
            Trusted by 10,000+ SEO professionals worldwide
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
