import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSearch, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Globe } from 'lucide-react'
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

export function Audits() {
  const { data, isLoading, refetch } = useData(auditAPI.getAll)
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null)
  const [isRerunning, setIsRerunning] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<any>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const audits = data?.data?.audits || []

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
    try {
      const res = await contentAPI.optimize({ audit_id: auditId, page_url: pageUrl })
      setAiSuggestions(res.data.data)
      toast.success('AI suggestions generated!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate suggestions')
    } finally {
      setIsOptimizing(false)
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
          {audits.map((audit: any, index: number) => (
            <motion.div
              key={audit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                'overflow-hidden',
                audit.status === 'running' && 'border-primary-300 shadow-glow'
              )}>
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        audit.status === 'completed' ? 'bg-success-50' :
                        audit.status === 'failed' ? 'bg-danger-50' : 'bg-primary-50'
                      )}>
                        {audit.status === 'running' ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                        ) : (
                          <FileSearch className={cn(
                            'w-5 h-5',
                            audit.status === 'completed' ? 'text-success-500' :
                            audit.status === 'failed' ? 'text-danger-500' : 'text-primary-500'
                          )} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-dark-900">Audit #{audit.id.slice(-6)}</h3>
                          <Badge variant={
                            audit.status === 'completed' ? 'success' :
                            audit.status === 'failed' ? 'danger' : 'info'
                          }>
                            {audit.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-dark-500">
                          {formatDate(audit.created_at)} • {audit.pages_crawled || 0} pages crawled
                          {audit.duration_seconds && ` • ${audit.duration_seconds}s`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {audit.status === 'completed' && (
                        <ScoreRing score={audit.seo_score || 0} size="sm" />
                      )}
                      <div className="flex items-center gap-2">
                        {audit.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRerun(audit.id)
                            }}
                            isLoading={isRerunning === audit.id}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {expandedAudit === audit.id ? (
                          <ChevronUp className="w-5 h-5 text-dark-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-dark-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedAudit === audit.id && audit.status === 'completed' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-dark-100">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-4 mb-4">
                          <div className="text-center p-3 bg-danger-50 rounded-xl">
                            <p className="text-xl font-bold text-danger-600">{audit.critical_issues || 0}</p>
                            <p className="text-xs text-danger-500">Critical</p>
                          </div>
                          <div className="text-center p-3 bg-warning-50 rounded-xl">
                            <p className="text-xl font-bold text-warning-600">{audit.warnings || 0}</p>
                            <p className="text-xs text-warning-500">Warnings</p>
                          </div>
                          <div className="text-center p-3 bg-success-50 rounded-xl">
                            <p className="text-xl font-bold text-success-600">{audit.passed_checks || 0}</p>
                            <p className="text-xs text-success-500">Passed</p>
                          </div>
                          <div className="text-center p-3 bg-primary-50 rounded-xl">
                            <p className="text-xl font-bold text-primary-600">{audit.pages_crawled || 0}</p>
                            <p className="text-xs text-primary-500">Pages</p>
                          </div>
                        </div>

                        {/* Page Results */}
                        <h4 className="text-sm font-bold text-dark-900 mb-3">Page Analysis</h4>
                        <div className="space-y-3">
                          {(audit.page_results || []).map((page: any, i: number) => (
                            <div key={i} className="border border-dark-100 rounded-xl p-4 hover:bg-dark-50/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm font-semibold text-dark-900">{page.url}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-dark-500">Status: {page.status}</span>
                                    <span className="text-xs text-dark-500">Load: {page.load_time}ms</span>
                                    <span className="text-xs text-dark-500">Words: {page.word_count}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPage(page)
                                    handleOptimize(audit.id, page.url)
                                  }}
                                  isLoading={isOptimizing}
                                >
                                  AI Optimize
                                </Button>
                              </div>

                              {/* Issues */}
                              {(page.issues || []).length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {page.issues.map((issue: any, j: number) => (
                                    <div key={j} className="flex items-center gap-2 text-xs">
                                      {issue.type === 'critical' ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-danger-500" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-warning-500" />
                                      )}
                                      <span className={cn(
                                        issue.type === 'critical' ? 'text-danger-600' : 'text-warning-600'
                                      )}>
                                        {issue.message}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* AI Suggestions inline */}
                              {page.ai_suggestions && (
                                <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                                  <p className="text-xs font-bold text-primary-700 mb-1">AI Suggestions</p>
                                  <p className="text-xs text-primary-600">Title: {page.ai_suggestions.title}</p>
                                  <p className="text-xs text-primary-600">H1: {page.ai_suggestions.h1}</p>
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
          ))}
        </div>
      )}

      {/* AI Suggestions Modal */}
      <Modal
        isOpen={!!aiSuggestions}
        onClose={() => setAiSuggestions(null)}
        title="AI Optimization Suggestions"
        size="lg"
      >
        {aiSuggestions && (
          <div className="space-y-4">
            <div className="p-4 bg-dark-50 rounded-xl">
              <p className="text-sm font-semibold text-dark-700 mb-1">Page: {aiSuggestions.page_url}</p>
              <p className="text-xs text-dark-500">Generated in {aiSuggestions.generated_in_ms}ms</p>
            </div>

            {aiSuggestions.suggestions && (
              <div className="space-y-4">
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Suggested Title</p>
                  <p className="text-sm font-semibold text-dark-900">{aiSuggestions.suggestions.title}</p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Suggested Meta Description</p>
                  <p className="text-sm text-dark-700">{aiSuggestions.suggestions.metaDescription}</p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Suggested H1</p>
                  <p className="text-sm font-semibold text-dark-900">{aiSuggestions.suggestions.h1}</p>
                </div>
                <div className="p-4 border border-dark-100 rounded-xl">
                  <p className="text-xs font-bold text-dark-500 uppercase mb-2">Content Suggestions</p>
                  <ul className="space-y-1">
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
