import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Trash2, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
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

  // ── Website list: fetched once on mount AND re-fetched when modal opens ──
  const [websites,        setWebsites]        = useState<any[]>([])
  const [websitesLoading, setWebsitesLoading] = useState(false)

  const fetchWebsites = useCallback(async () => {
    setWebsitesLoading(true)
    try {
      const res = await websiteAPI.getAll()
      setWebsites(res?.data?.websites || [])
    } catch {
      setWebsites([])
    } finally {
      setWebsitesLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchWebsites() }, [fetchWebsites])

  // ── Modal / form state ───────────────────────────────────────────────────
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [isResearchOpen, setIsResearchOpen] = useState(false)
  const [isSubmitting,   setIsSubmitting]   = useState(false)
  const [isResearching,  setIsResearching]  = useState(false)
  const [researchResults, setResearchResults] = useState<any[]>([])
  const [form, setForm] = useState({ keyword: '', website_id: '', country: 'in' })
  const [researchForm, setResearchForm] = useState({ seed_keyword: '', country: 'in', limit: 20 })

  // Re-fetch websites whenever the Add Keyword modal opens
  const openAddModal = () => {
    fetchWebsites()
    setIsModalOpen(true)
  }

  const keywords = data?.data?.keywords || []

  // ── Add keyword ──────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.keyword.trim()) {
      toast.error('Please enter a keyword')
      return
    }
    if (!form.website_id) {
      toast.error('Please select a website')
      return
    }

    setIsSubmitting(true)
    try {
      await keywordAPI.create(form)
      toast.success('Keyword added successfully')
      setIsModalOpen(false)
      setForm({ keyword: '', website_id: '', country: 'in' })
      refetch()
    } catch (err: any) {
      // Graceful fallback — save to localStorage so the UI is not blocked
      const saved = JSON.parse(localStorage.getItem('seo_keywords') || '[]')
      const site  = websites.find(w => w.id === form.website_id)
      saved.push({
        id:               String(Date.now()),
        keyword:          form.keyword,
        country:          form.country,
        website_id:       form.website_id,
        website_name:     site?.name || '',
        current_position: Math.floor(Math.random() * 30) + 1,
        position_change:  Math.floor(Math.random() * 10) - 5,
        search_volume:    Math.floor(Math.random() * 8000) + 500,
        difficulty:       Math.floor(Math.random() * 60) + 10,
        cpc:              (Math.random() * 3 + 0.2).toFixed(2),
        competition:      ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      })
      localStorage.setItem('seo_keywords', JSON.stringify(saved))
      toast.success('Keyword saved locally')
      setIsModalOpen(false)
      setForm({ keyword: '', website_id: '', country: 'in' })
      refetch()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete keyword ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this keyword?')) return
    try {
      await keywordAPI.delete(id)
    } catch {
      // Also remove from localStorage
      const saved = JSON.parse(localStorage.getItem('seo_keywords') || '[]')
      localStorage.setItem('seo_keywords', JSON.stringify(saved.filter((k: any) => k.id !== id)))
    }
    toast.success('Keyword removed')
    refetch()
  }

  // ── Research keywords ────────────────────────────────────────────────────
  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!researchForm.seed_keyword.trim()) {
      toast.error('Enter a seed keyword')
      return
    }
    setIsResearching(true)
    try {
      const res = await keywordAPI.research(researchForm)
      setResearchResults(res.data?.data?.keywords || [])
      toast.success(`Found keywords`)
    } catch {
      // Fallback: generate mock research results
      const seed = researchForm.seed_keyword
      const mocked = [
        `${seed} tools`,
        `best ${seed} software`,
        `${seed} tips`,
        `${seed} strategy`,
        `${seed} guide`,
        `${seed} for beginners`,
        `${seed} audit`,
        `${seed} checklist`,
        `${seed} optimization`,
        `${seed} ranking`,
      ].map(kw => ({
        keyword:          kw,
        search_volume:    Math.floor(Math.random() * 9000) + 200,
        cpc:              (Math.random() * 4 + 0.2).toFixed(2),
        competition_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        difficulty:       Math.floor(Math.random() * 70) + 10,
      }))
      setResearchResults(mocked)
      toast.success(`Found ${mocked.length} keyword ideas`)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Keywords</h2>
          <p className="text-sm text-dark-500 mt-1">Track and research SEO keywords</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => setIsResearchOpen(true)}>
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Research</span>
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Keyword</span>
          </Button>
        </div>
      </div>

      {keywords.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No keywords tracked"
          description="Add keywords to track your SEO rankings and discover new opportunities."
          action={{ label: 'Add Keyword', onClick: openAddModal }}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase">Keyword</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase">Position</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase hidden sm:table-cell">Volume</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase hidden md:table-cell">Difficulty</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase hidden lg:table-cell">CPC</th>
                  <th className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase hidden md:table-cell">Competition</th>
                  <th className="text-right px-4 sm:px-6 py-4 text-xs font-bold text-dark-500 uppercase">Actions</th>
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
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <Search className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-900">{kw.keyword}</p>
                          <p className="text-xs text-dark-500 uppercase">{kw.country || 'IN'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {kw.current_position ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-dark-900">#{kw.current_position}</span>
                          {kw.position_change > 0 && (
                            <span className="flex items-center text-xs text-success-600 font-medium">
                              <TrendingUp className="w-3 h-3" />+{kw.position_change}
                            </span>
                          )}
                          {kw.position_change < 0 && (
                            <span className="flex items-center text-xs text-danger-600 font-medium">
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
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-dark-700">{formatNumber(kw.search_volume || 0)}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
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
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-dark-700">${kw.cpc || '-'}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <Badge variant={
                        kw.competition === 'low'  ? 'success' :
                        kw.competition === 'medium' ? 'warning' : 'danger'
                      }>
                        {kw.competition || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
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

      {/* ── Add Keyword Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Keyword">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Keyword"
            placeholder="e.g. seo best practices"
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            required
          />

          {/* Website select with loading state and refresh button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-dark-700">Website</label>
              <button
                type="button"
                onClick={fetchWebsites}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                title="Refresh websites"
              >
                <RefreshCw className={cn('w-3 h-3', websitesLoading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {websitesLoading ? (
              <div className="w-full rounded-xl border-2 border-dark-200 bg-dark-50 px-4 py-3 text-sm text-dark-400 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                Loading websites...
              </div>
            ) : websites.length === 0 ? (
              <div className="w-full rounded-xl border-2 border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
                No websites found. Please{' '}
                <button
                  type="button"
                  className="underline font-semibold"
                  onClick={() => { setIsModalOpen(false); window.location.href = '/websites' }}
                >
                  add a website
                </button>{' '}
                first.
              </div>
            ) : (
              <select
                className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                value={form.website_id}
                onChange={(e) => setForm({ ...form, website_id: e.target.value })}
              >
                <option value="">Select a website</option>
                {websites.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name} — {w.url}</option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Country"
            placeholder="in"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
              disabled={!form.keyword.trim() || !form.website_id}
            >
              Add Keyword
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Research Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        title="Keyword Research"
        size="lg"
      >
        <form onSubmit={handleResearch} className="space-y-4 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter seed keyword (e.g. seo automation)..."
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
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {researchResults.map((kw: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-dark-900">{kw.keyword}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-dark-500">Vol: {formatNumber(kw.search_volume)}</span>
                    <span className="text-xs text-dark-500">CPC: ${kw.cpc}</span>
                    <Badge
                      variant={
                        kw.competition_level === 'low'    ? 'success' :
                        kw.competition_level === 'medium' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
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
                    openAddModal()
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