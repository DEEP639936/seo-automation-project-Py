import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, RefreshCw, Globe, ExternalLink, ArrowUpRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/ui/StatCard'
import { useData } from '@/hooks/useData'
import { backlinkAPI, websiteAPI } from '@/services/api'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export function Backlinks() {
  const { data, isLoading, refetch } = useData(backlinkAPI.getAll)
  const { data: websitesData } = useData(websiteAPI.getAll)
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const backlinks = data?.data?.backlinks || []
  const stats = data?.data?.stats || {}
  const websites: any[] = (data as any)?.data?.websites || []

  const handleUpdate = async () => {
    if (!selectedWebsite) {
      toast.error('Please select a website')
      return
    }
    setIsUpdating(true)
    try {
      await backlinkAPI.update(selectedWebsite)
      toast.success('Backlinks updated')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  const chartData = [
    { name: 'Dofollow', value: stats.dofollow || 0, color: '#22c55e' },
    { name: 'Nofollow', value: stats.nofollow || 0, color: '#3b82f6' },
    { name: 'Active', value: stats.active || 0, color: '#16a34a' },
    { name: 'Lost', value: stats.lost || 0, color: '#ef4444' },
  ]

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
          <h2 className="text-2xl font-bold text-dark-900">Backlinks</h2>
          <p className="text-sm text-dark-500 mt-1">Monitor your backlink profile</p>
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
            Update
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total || 0} icon={Link2} color="blue" />
          <StatCard title="Dofollow" value={stats.dofollow || 0} icon={ArrowUpRight} color="green" />
          <StatCard title="Active" value={stats.active || 0} icon={Link2} color="purple" />
          <StatCard title="Avg DA" value={stats.avg_da || 0} icon={Globe} color="amber" />
        </div>
      )}

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-lg font-bold text-dark-900">Link Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-bold text-dark-900">Backlink Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            {backlinks.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No backlinks found"
                description="Update backlinks to see your link profile."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-100">
                      <th className="text-left px-6 py-3 text-xs font-bold text-dark-500 uppercase">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-dark-500 uppercase">Target</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-dark-500 uppercase">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-dark-500 uppercase">DA</th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-dark-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100/50">
                    {backlinks.slice(0, 20).map((bl: any, index: number) => (
                      <motion.tr
                        key={bl.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-dark-50/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <a href={bl.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                            {bl.source_url?.slice(0, 40)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-dark-600">{bl.target_url?.slice(0, 40)}...</span>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={bl.link_type === 'dofollow' ? 'success' : 'default'} size="sm">
                            {bl.link_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm font-semibold text-dark-900">{bl.domain_authority || '-'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={bl.status === 'active' ? 'success' : 'danger'} size="sm">
                            {bl.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
