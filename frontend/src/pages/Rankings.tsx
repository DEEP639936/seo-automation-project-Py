import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Globe, Search } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { rankingAPI, websiteAPI } from '@/services/api'
import { formatNumber, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export function Rankings() {
  const { data, isLoading, refetch } = useData(rankingAPI.getAll)
  const { data: websitesData } = useData(websiteAPI.getAll)
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const rankings = data?.data?.keywords || []
  const stats = data?.data?.stats || {}
  const history = data?.data?.history || []
  const websites: any[] = (data as any)?.data?.websites || []

  const handleUpdate = async () => {
    if (!selectedWebsite) {
      toast.error('Please select a website first')
      return
    }
    setIsUpdating(true)
    try {
      await rankingAPI.update(selectedWebsite)
      toast.success('Rankings updated successfully')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update rankings')
    } finally {
      setIsUpdating(false)
    }
  }

  // Prepare chart data from history
  const chartData = history.length > 0 ? history[0].history.map((h: any, i: number) => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    position: h.position,
  })) : []

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
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-dark-900">{stats.total || 0}</p>
              <p className="text-xs text-dark-500">Total Keywords</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-success-600">{stats.top3 || 0}</p>
              <p className="text-xs text-dark-500">Top 3</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-primary-600">{stats.top10 || 0}</p>
              <p className="text-xs text-dark-500">Top 10</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-warning-600">{stats.improved || 0}</p>
              <p className="text-xs text-dark-500">Improved</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Position History Chart */}
      {chartData.length > 0 && (
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
      )}

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
                {rankings.map((kw: any, index: number) => (
                  <motion.tr
                    key={kw.id}
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
                        {kw.current_position ? `#${kw.current_position}` : 'Not ranked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-500">
                        {kw.previous_position ? `#${kw.previous_position}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {kw.position_change > 0 && (
                        <Badge variant="success">
                          <TrendingUp className="w-3 h-3 mr-1" />+{kw.position_change}
                        </Badge>
                      )}
                      {kw.position_change < 0 && (
                        <Badge variant="danger">
                          <TrendingDown className="w-3 h-3 mr-1" />{kw.position_change}
                        </Badge>
                      )}
                      {kw.position_change === 0 && (
                        <Badge variant="default">
                          <Minus className="w-3 h-3 mr-1" />0
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-700">{formatNumber(kw.search_volume || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={kw.url_ranked} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline truncate max-w-[150px] block">
                        {kw.url_ranked || '-'}
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
