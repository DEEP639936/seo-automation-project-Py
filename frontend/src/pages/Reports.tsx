import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Download, Trash2, FileSearch, TrendingUp, Link2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { reportAPI, websiteAPI } from '@/services/api'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const reportTypes = [
  { value: 'full_seo', label: 'Full SEO Report', icon: FileSearch },
  { value: 'audit',    label: 'Audit Report',    icon: FileSearch },
  { value: 'ranking',  label: 'Ranking Report',  icon: TrendingUp },
  { value: 'backlink', label: 'Backlink Report',  icon: Link2 },
]

export function Reports() {
  const { data, isLoading, refetch } = useData(reportAPI.getAll)
  const { data: websitesData } = useData(websiteAPI.getAll)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ website_id: '', type: 'full_seo', title: '', frequency: 'once' })

  // Support both backend shape and localStorage fallback shape
  const reports: any[] = (data as any)?.data?.reports || []
  const websites: any[] = (websitesData as any)?.data?.websites || []

  // Helper — extract stat value from multiple possible field names
  const getStat = (report: any, ...keys: string[]) => {
    for (const k of keys) {
      const val = report[k] ?? report.content?.[k] ?? report.summary?.[k]
      if (val !== undefined && val !== null) return val
    }
    return '-'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await reportAPI.create(form)
      toast.success('Report generated successfully')
      setIsModalOpen(false)
      setForm({ website_id: '', type: 'full_seo', title: '', frequency: 'once' })
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report?')) return
    try {
      await reportAPI.delete(id)
      toast.success('Report deleted')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete')
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
          <h2 className="text-2xl font-bold text-dark-900">Reports</h2>
          <p className="text-sm text-dark-500 mt-1">Generate and download SEO reports</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first SEO report to share with your team."
          action={{ label: 'Generate Report', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report: any, index: number) => {
            const seoScore       = getStat(report, 'score', 'seo_score', 'seo_score')
            const issuesFound    = getStat(report, 'issues_count', 'issues_found', 'total_issues')
            const keywordsCount  = getStat(report, 'keywords_tracked', 'keywords_count', 'keywords')

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <CardBody>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          report.status === 'completed' ? 'bg-success-50' :
                          report.status === 'failed'    ? 'bg-danger-50'  : 'bg-primary-50'
                        )}>
                          <FileText className={cn(
                            'w-5 h-5',
                            report.status === 'completed' ? 'text-success-500' :
                            report.status === 'failed'    ? 'text-danger-500'  : 'text-primary-500'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-dark-900 text-sm truncate">
                            {report.title || `SEO Report — ${report.website_name || 'Website'}`}
                          </h3>
                          <p className="text-xs text-dark-500">{formatDate(report.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant={
                        report.status === 'completed' ? 'success' :
                        report.status === 'failed'    ? 'danger'  : 'info'
                      }>
                        {report.status}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-dark-50 rounded-xl">
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-dark-900">{seoScore}</p>
                        <p className="text-xs text-dark-500">SEO Score</p>
                      </div>
                      <div className="w-px h-8 bg-dark-200" />
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-dark-900">{issuesFound}</p>
                        <p className="text-xs text-dark-500">Issues</p>
                      </div>
                      <div className="w-px h-8 bg-dark-200" />
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold text-dark-900">{keywordsCount}</p>
                        <p className="text-xs text-dark-500">Keywords</p>
                      </div>
                    </div>

                    {/* Summary */}
                    {report.summary && (
                      <p className="text-xs text-dark-500 mb-4 line-clamp-2">{report.summary}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-dark-100">
                      {report.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => reportAPI.download(report.id)}
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Generate Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Website</label>
            <select
              className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
              value={form.website_id}
              onChange={(e) => setForm({ ...form, website_id: e.target.value })}
              required
            >
              <option value="">Select a website</option>
              {websites.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    form.type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-dark-200 text-dark-600 hover:border-dark-300'
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Report Title"
            placeholder="Monthly SEO Report — May 2026"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Frequency</label>
            <select
              className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">Generate</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}