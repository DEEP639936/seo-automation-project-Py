import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Minus, Globe, Sparkles } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { keywordAPI, websiteAPI } from '@/services/api'
import { formatNumber, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Keywords() {
  const { data, isLoading, refetch } = useData(keywordAPI.getAll)
  const { data: websitesData } = useData(websiteAPI.getAll)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResearchOpen, setIsResearchOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [researchResults, setResearchResults] = useState<any[]>([])
  const [form, setForm] = useState({ keyword: '', website_id: '', country: 'us' })
  const [researchForm, setResearchForm] = useState({ seed_keyword: '', country: 'us', limit: 20 })

  const keywords = data?.data?.keywords || []
  const websites = websitesData?.data?.websites || []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await keywordAPI.create(form)
      toast.success('Keyword added successfully')
      setIsModalOpen(false)
      setForm({ keyword: '', website_id: '', country: 'us' })
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add keyword')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this keyword?')) return
    try {
      await keywordAPI.delete(id)
      toast.success('Keyword removed')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove')
    }
  }

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResearching(true)
    try {
      const res = await keywordAPI.research(researchForm)
      setResearchResults(res.data.data.keywords || [])
      toast.success(`Found ${res.data.data.count} keywords`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Research failed')
    } finally {
      setIsResearching(false)
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
          <h2 className="text-2xl font-bold text-dark-900">Keywords</h2>
          <p className="text-sm text-dark-500 mt-1">Track and research SEO keywords</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsResearchOpen(true)}>
            <Sparkles className="w-4 h-4" />
            Research
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Keyword
          </Button>
        </div>
      </div>

      {keywords.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No keywords tracked"
          description="Add keywords to track your SEO rankings and discover new opportunities."
          action={{ label: 'Add Keyword', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Keyword</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Position</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Volume</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Difficulty</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">CPC</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-dark-500 uppercase">Competition</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-dark-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100/50">
                {keywords.map((kw: any, index: number) => (
                  <motion.tr
                    key={kw.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-dark-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Search className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-900">{kw.keyword}</p>
                          <p className="text-xs text-dark-500">{kw.country?.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {kw.current_position ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-dark-900">#{kw.current_position}</span>
                          {kw.position_change > 0 && (
                            <span className="flex items-center text-xs text-success-600">
                              <TrendingUp className="w-3 h-3" />+{kw.position_change}
                            </span>
                          )}
                          {kw.position_change < 0 && (
                            <span className="flex items-center text-xs text-danger-600">
                              <TrendingDown className="w-3 h-3" />{kw.position_change}
                            </span>
                          )}
                          {kw.position_change === 0 && (
                            <span className="flex items-center text-xs text-dark-400">
                              <Minus className="w-3 h-3" />0
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-dark-400">Not ranked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-700">{formatNumber(kw.search_volume || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-dark-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              (kw.difficulty || 0) > 60 ? 'bg-danger-500' :
                              (kw.difficulty || 0) > 30 ? 'bg-warning-500' : 'bg-success-500'
                            )}
                            style={{ width: `${kw.difficulty || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-600">{kw.difficulty || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-700">${kw.cpc || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        kw.competition === 'low' ? 'success' :
                        kw.competition === 'medium' ? 'warning' : 'danger'
                      }>
                        {kw.competition || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
                        onClick={() => handleDelete(kw.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Keyword Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Keyword">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Keyword"
            placeholder="e.g. seo best practices"
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            required
          />
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
          <Input
            label="Country"
            placeholder="us"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Add Keyword
            </Button>
          </div>
        </form>
      </Modal>

      {/* Research Modal */}
      <Modal isOpen={isResearchOpen} onClose={() => setIsResearchOpen(false)} title="Keyword Research" size="lg">
        <form onSubmit={handleResearch} className="space-y-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter seed keyword..."
              value={researchForm.seed_keyword}
              onChange={(e) => setResearchForm({ ...researchForm, seed_keyword: e.target.value })}
              className="flex-1"
            />
            <Button type="submit" isLoading={isResearching}>
              <Search className="w-4 h-4" />
              Research
            </Button>
          </div>
        </form>

        {researchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {researchResults.map((kw: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-dark-900">{kw.keyword}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-dark-500">Vol: {formatNumber(kw.search_volume)}</span>
                    <span className="text-xs text-dark-500">CPC: ${kw.cpc}</span>
                    <Badge variant={kw.competition_level === 'low' ? 'success' : kw.competition_level === 'medium' ? 'warning' : 'danger'} size="sm">
                      {kw.competition_level}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm({ keyword: kw.keyword, website_id: '', country: researchForm.country })
                    setIsResearchOpen(false)
                    setIsModalOpen(true)
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Track
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
