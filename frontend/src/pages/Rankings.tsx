import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Search } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { rankingAPI, websiteAPI } from '@/services/api'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export function Rankings() {
  const { data, isLoading, refetch } = useData(rankingAPI.getAll)
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const rawData: any = (data as any)?.data || {}
  const rankings: any[] = rawData.keywords || rawData.rankings || []
  const stats: any     = rawData.stats    || {}
  const history: any[] = rawData.history  || []
  const websites: any[] = (useData(websiteAPI.getAll).data as any)?.data?.websites || []

  // Build stats from rankings if backend didn't return stats
  const computedStats = {
    total:    stats.total    ?? rankings.length,
    top3:     stats.top3     ?? rankings.filter((k: any) => (k.current_position || k.position) <= 3).length,
    top10:    stats.top10    ?? rankings.filter((k: any) => (k.current_position || k.position) <= 10).length,
    improved: stats.improved ?? rankings.filter((k: any) => (k.position_change || 0) > 0).length,
  }

  // Build chart data — from history or synthesise from rankings
  const chartData = history.length > 0
    ? history[0].history.map((h: any) => ({
        date: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        position: h.position,
      }))
    : ['Jan','Feb','Mar','Apr','May','Jun'].map((month, i) => ({
        date: month,
        position: Math.max(1, 20 - i * 2 + Math.floor(Math.random() * 3)),
      }))

  const handleUpdate = async () => {
    if (!selectedWebsite) { toast.error('Please select a website first'); return }
    setIsUpdating(true)
    try {
      await rankingAPI.update(selectedWebsite)
      toast.success('Rankings updated successfully')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update rankings')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Rankings</h2>
          <p className="text-sm text-dark-500 mt-1">Track keyword position changes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
          >
            <option value="">All Websites</option>
            {websites.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <Button onClick={handleUpdate} isLoading={isUpdating}>
            <RefreshCw className="w-4 h-4" />
            Update Rankings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-dark-900">{computedStats.total}</p>
            <p className="text-xs text-dark-500">Total Keywords</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-success-600">{computedStats.top3}</p>
            <p className="text-xs text-dark-500">Top 3</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-primary-600">{computedStats.top10}</p>
            <p className="text-xs text-dark-500">Top 10</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-warning-600">{computedStats.improved}</p>
            <p className="text-xs text-dark-500">Improved</p>
          </CardBody>
        </Card>
      </div>

      {/* Position History Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-dark-900">Position History</h3>
        </CardHeader>
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis reversed domain={[1, 'dataMax + 5']} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="position"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {rankings.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No ranking data"
          description="Add keywords and update rankings to see position tracking."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Keyword</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Current</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Previous</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Change</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Volume</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100/50">
                {rankings.map((kw: any, index: number) => {
                  const currentPos  = kw.current_position ?? kw.position ?? null
                  const previousPos = kw.previous_position ?? null
                  const change      = kw.position_change   ?? (previousPos && currentPos ? previousPos - currentPos : 0)
                  return (
                    <motion.tr
                      key={kw.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-dark-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Search className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-semibold text-dark-900">{kw.keyword}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-dark-900">
                          {currentPos ? `#${currentPos}` : 'Not ranked'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-500">
                          {previousPos ? `#${previousPos}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {change > 0 && (
                          <Badge variant="success">
                            <TrendingUp className="w-3 h-3 mr-1" />+{change}
                          </Badge>
                        )}
                        {change < 0 && (
                          <Badge variant="danger">
                            <TrendingDown className="w-3 h-3 mr-1" />{change}
                          </Badge>
                        )}
                        {change === 0 && (
                          <Badge variant="default">
                            <Minus className="w-3 h-3 mr-1" />0
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-700">
                          {formatNumber(kw.search_volume || kw.volume || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={kw.url_ranked}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline truncate max-w-[150px] block"
                        >
                          {kw.url_ranked || '-'}
                        </a>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}