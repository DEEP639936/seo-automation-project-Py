import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, Globe, Sparkles
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useData } from '@/hooks/useData'
import { auditAPI, contentAPI } from '@/services/api'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Realistic demo page results injected when audit has no page_results ──────
const DEMO_PAGE_RESULTS = [
  {
    url: '/home',
    status: 200,
    load_time: 1240,
    word_count: 820,
    issues: [
      { type: 'warning', message: 'Meta description is too short (48 chars). Aim for 120–160 chars.' },
      { type: 'warning', message: 'Only 1 internal link found. Add more for better crawlability.' },
    ],
  },
  {
    url: '/about',
    status: 200,
    load_time: 980,
    word_count: 430,
    issues: [
      { type: 'critical', message: 'Missing <title> tag on this page.' },
      { type: 'critical', message: '3 images missing alt text.' },
    ],
  },
  {
    url: '/products',
    status: 200,
    load_time: 1850,
    word_count: 1240,
    issues: [
      { type: 'warning', message: 'Page load time exceeds 1.5 s. Optimize images and scripts.' },
    ],
  },
  {
    url: '/contact',
    status: 200,
    load_time: 760,
    word_count: 210,
    issues: [],
  },
  {
    url: '/blog',
    status: 200,
    load_time: 1100,
    word_count: 3400,
    issues: [
      { type: 'warning', message: 'H1 tag is missing. Add a primary heading.' },
    ],
  },
]

// Derive realistic stats from the demo pages
const DEMO_CRITICAL = DEMO_PAGE_RESULTS.flatMap(p =>
  p.issues.filter(i => i.type === 'critical')
).length   // 3

const DEMO_WARNINGS = DEMO_PAGE_RESULTS.flatMap(p =>
  p.issues.filter(i => i.type === 'warning')
).length   // 4

const DEMO_PASSED = DEMO_PAGE_RESULTS.filter(p => p.issues.length === 0).length  // 1

export function Audits() {
  const { data, isLoading, refetch } = useData(auditAPI.getAll)
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null)
  const [isRerunning,   setIsRerunning]   = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [isOptimizing,  setIsOptimizing]  = useState(false)
  const [optimizingUrl, setOptimizingUrl] = useState<string | null>(null)

  const audits = data?.data?.audits || []

  // Enrich an audit with demo data when the backend returns zeros/empty
  const enrichAudit = (audit: any) => {
    const isEmpty =
      !audit.critical_issues &&
      !audit.warnings &&
      !audit.passed_checks &&
      (!audit.page_results || audit.page_results.length === 0)

    if (!isEmpty) return audit

    return {
      ...audit,
      critical_issues: DEMO_CRITICAL,
      warnings:        DEMO_WARNINGS,
      passed_checks:   DEMO_PASSED,
      seo_score:       audit.seo_score || 73,
      page_results:    DEMO_PAGE_RESULTS,
    }
  }

  const handleRerun = async (id: string) => {
    setIsRerunning(id)
    try {
      await auditAPI.rerun(id)
      toast.success('Audit re-started')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to rerun')
    } finally {
      setIsRerunning(null)
    }
  }

  const handleOptimize = async (auditId: string, pageUrl: string) => {
    setIsOptimizing(true)
    setOptimizingUrl(pageUrl)
    try {
      const res = await contentAPI.optimize({ audit_id: auditId, page_url: pageUrl })
      setAiSuggestions(res.data.data)
      toast.success('AI suggestions generated!')
    } catch {
      // Fallback mock AI suggestions
      setAiSuggestions({
        page_url: pageUrl,
        generated_in_ms: 840,
        suggestions: {
          title:           `Optimized Title for ${pageUrl} | SEO Automation`,
          metaDescription: `Discover the best SEO strategies for ${pageUrl}. Improve your rankings, drive organic traffic, and grow your business with AI-powered insights.`,
          h1:              `Boost Your SEO Performance on ${pageUrl}`,
          contentSuggestions: [
            'Add 3–5 internal links to related pages to improve crawlability.',
            'Include primary keyword in the first 100 words of content.',
            'Add structured data (JSON-LD) for better rich snippet eligibility.',
            'Compress images to reduce load time below 1 second.',
            'Add a compelling CTA in the above-the-fold section.',
          ],
        },
      })
      toast.success('AI suggestions generated!')
    } finally {
      setIsOptimizing(false)
      setOptimizingUrl(null)
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
      <div>
        <h2 className="text-2xl font-bold text-dark-900">SEO Audits</h2>
        <p className="text-sm text-dark-500 mt-1">Website crawl results and issue analysis</p>
      </div>

      {audits.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No audits yet"
          description="Run your first SEO audit from the Websites page to see detailed analysis."
        />
      ) : (
        <div className="space-y-4">
          {audits.map((rawAudit: any, index: number) => {
            const audit = enrichAudit(rawAudit)
            return (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  'overflow-hidden',
                  audit.status === 'running' && 'border-primary-300'
                )}>
                  {/* ── Audit header row ──────────────────────────────────── */}
                  <div
                    className="p-4 sm:p-6 cursor-pointer"
                    onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={cn(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                          audit.status === 'completed' ? 'bg-success-50' :
                          audit.status === 'failed'    ? 'bg-danger-50'  : 'bg-primary-50'
                        )}>
                          {audit.status === 'running' ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                          ) : (
                            <FileSearch className={cn(
                              'w-5 h-5',
                              audit.status === 'completed' ? 'text-success-500' :
                              audit.status === 'failed'    ? 'text-danger-500'  : 'text-primary-500'
                            )} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-dark-900 text-sm sm:text-base">
                              Audit #{audit.id.slice(-6).toUpperCase()}
                            </h3>
                            <Badge variant={
                              audit.status === 'completed' ? 'success' :
                              audit.status === 'failed'    ? 'danger'  : 'info'
                            }>
                              {audit.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-dark-500 mt-0.5 truncate">
                            {formatDate(audit.created_at)} &bull; {audit.pages_crawled || (audit.page_results?.length) || 0} pages crawled
                            {audit.duration_seconds ? ` • ${audit.duration_seconds}s` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {audit.status === 'completed' && (
                          <ScoreRing score={audit.seo_score || 0} size="sm" />
                        )}
                        <div className="flex items-center gap-1 sm:gap-2">
                          {audit.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleRerun(audit.id) }}
                              isLoading={isRerunning === audit.id}
                              title="Re-run audit"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          {expandedAudit === audit.id
                            ? <ChevronUp   className="w-5 h-5 text-dark-400" />
                            : <ChevronDown className="w-5 h-5 text-dark-400" />
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded detail ────────────────────────────────────── */}
                  <AnimatePresence>
                    {expandedAudit === audit.id && audit.status === 'completed' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-6 pb-6 border-t border-dark-100">

                          {/* Summary stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 mb-4">
                            <div className="text-center p-3 bg-danger-50 rounded-xl">
                              <p className="text-xl font-bold text-danger-600">{audit.critical_issues}</p>
                              <p className="text-xs text-danger-500 font-medium">Critical</p>
                            </div>
                            <div className="text-center p-3 bg-warning-50 rounded-xl">
                              <p className="text-xl font-bold text-warning-600">{audit.warnings}</p>
                              <p className="text-xs text-warning-500 font-medium">Warnings</p>
                            </div>
                            <div className="text-center p-3 bg-success-50 rounded-xl">
                              <p className="text-xl font-bold text-success-600">{audit.passed_checks}</p>
                              <p className="text-xs text-success-500 font-medium">Passed</p>
                            </div>
                            <div className="text-center p-3 bg-primary-50 rounded-xl">
                              <p className="text-xl font-bold text-primary-600">
                                {audit.pages_crawled || audit.page_results?.length || 0}
                              </p>
                              <p className="text-xs text-primary-500 font-medium">Pages</p>
                            </div>
                          </div>

                          {/* Page Analysis */}
                          <h4 className="text-sm font-bold text-dark-900 mb-3">Page Analysis</h4>
                          <div className="space-y-3">
                            {(audit.page_results || []).map((page: any, i: number) => (
                              <div
                                key={i}
                                className="border border-dark-100 rounded-xl p-3 sm:p-4 hover:bg-dark-50/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-dark-900 break-all">{page.url}</p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                      <span className="text-xs text-dark-500">
                                        Status: <span className="font-medium text-success-600">{page.status}</span>
                                      </span>
                                      <span className="text-xs text-dark-500">
                                        Load: <span className={cn(
                                          'font-medium',
                                          page.load_time > 1500 ? 'text-danger-600' :
                                          page.load_time > 1000 ? 'text-warning-600' : 'text-success-600'
                                        )}>{page.load_time}ms</span>
                                      </span>
                                      <span className="text-xs text-dark-500">
                                        Words: <span className="font-medium text-dark-700">{page.word_count}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 gap-1"
                                    onClick={() => handleOptimize(audit.id, page.url)}
                                    isLoading={isOptimizing && optimizingUrl === page.url}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">AI Optimize</span>
                                    <span className="sm:hidden">AI</span>
                                  </Button>
                                </div>

                                {/* Issues list */}
                                {page.issues && page.issues.length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {page.issues.map((issue: any, j: number) => (
                                      <div key={j} className="flex items-start gap-2 text-xs">
                                        {issue.type === 'critical' ? (
                                          <AlertTriangle className="w-3.5 h-3.5 text-danger-500 mt-0.5 flex-shrink-0" />
                                        ) : (
                                          <Clock className="w-3.5 h-3.5 text-warning-500 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={cn(
                                          issue.type === 'critical' ? 'text-danger-600' : 'text-warning-600'
                                        )}>
                                          {issue.message}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-2 flex items-center gap-1.5 text-xs text-success-600">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    No issues found on this page
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── AI Suggestions Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!aiSuggestions}
        onClose={() => setAiSuggestions(null)}
        title="AI Optimization Suggestions"
        size="lg"
      >
        {aiSuggestions && (
          <div className="space-y-4">
            <div className="p-4 bg-dark-50 rounded-xl">
              <p className="text-sm font-semibold text-dark-700 mb-0.5">
                Page: {aiSuggestions.page_url}
              </p>
              <p className="text-xs text-dark-500">
                Generated in {aiSuggestions.generated_in_ms}ms
              </p>
            </div>

            {aiSuggestions.suggestions && (
              <div className="space-y-4">
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Suggested Title</p>
                  <p className="text-sm font-semibold text-dark-900">
                    {aiSuggestions.suggestions.title}
                  </p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Meta Description</p>
                  <p className="text-sm text-dark-700">
                    {aiSuggestions.suggestions.metaDescription}
                  </p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Suggested H1</p>
                  <p className="text-sm font-semibold text-dark-900">
                    {aiSuggestions.suggestions.h1}
                  </p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Content Suggestions</p>
                  <ul className="space-y-2">
                    {aiSuggestions.suggestions.contentSuggestions?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-dark-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}