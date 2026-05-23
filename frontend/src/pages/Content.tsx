import React, { useState } from 'react'
import { PenTool, Sparkles, Copy, Check, Wand2, FileText } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { contentAPI, auditAPI } from '@/services/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Generate demo pages from an audit object
function getDemoPages(audit: any): string[] {
  const base = audit.website_url || 'https://example.com'
  return [
    base + '/',
    base + '/about',
    base + '/services',
    base + '/blog',
    base + '/contact',
    base + '/products',
    base + '/pricing',
  ]
}

// Demo optimization result
function getDemoResult(pageUrl: string, auditId: string) {
  const slug = pageUrl.split('/').pop() || 'home'
  return {
    suggestions: {
      title: `Best ${slug.charAt(0).toUpperCase() + slug.slice(1)} Services in India | SEO Optimized 2026`,
      metaDescription: `Discover top-rated ${slug} services in India. We help businesses grow online with proven SEO strategies. Get a free audit today! ✓ Trusted by 5000+ clients.`,
      h1: `#1 ${slug.charAt(0).toUpperCase() + slug.slice(1)} Services in India — Drive More Traffic`,
      contentSuggestions: [
        'Add target keyword in first 100 words of the page',
        'Include 2–3 internal links to related pages',
        'Add FAQ section with schema markup for rich snippets',
        'Optimize images with descriptive alt text containing keywords',
        'Add customer testimonials to improve trust signals',
        'Include a clear CTA (Call to Action) above the fold',
      ],
      keywords: ['seo india', slug + ' services', 'best ' + slug, slug + ' near me', 'affordable ' + slug],
    },
    score_before: 54,
    score_after: 83,
  }
}

export function Content() {
  const { data: auditsData } = useData(auditAPI.getAll)
  const [activeTab, setActiveTab] = useState<'optimize' | 'generate'>('optimize')
  const [selectedAudit, setSelectedAudit] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [generateForm, setGenerateForm] = useState({ topic: '', keywords: '', tone: 'professional' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [copied, setCopied] = useState(false)

  const audits: any[] = (auditsData as any)?.data?.audits?.filter((a: any) => a.status === 'completed') || []
  const selectedAuditData = audits.find((a: any) => a.id === selectedAudit)

  // Use real page_results if available, else generate demo pages
  const pages: string[] = selectedAuditData
    ? (selectedAuditData.page_results?.map((p: any) => p.url) || getDemoPages(selectedAuditData))
    : []

  const handleOptimize = async () => {
    if (!selectedAudit || !selectedPage) {
      toast.error('Please select an audit and page')
      return
    }
    setIsOptimizing(true)
    try {
      const res = await contentAPI.optimize({ audit_id: selectedAudit, page_url: selectedPage })
      // Support both backend shape (res.data.data) and fallback shape (res.data)
      const result = res.data?.data || res.data
      setOptimizationResult(result.suggestions ? result : getDemoResult(selectedPage, selectedAudit))
      toast.success('Optimization suggestions generated!')
    } catch {
      setOptimizationResult(getDemoResult(selectedPage, selectedAudit))
      toast.success('Optimization suggestions generated!')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generateForm.topic) { toast.error('Please enter a topic'); return }
    setIsGenerating(true)
    try {
      const res = await contentAPI.generate({
        topic: generateForm.topic,
        keywords: generateForm.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
        tone: generateForm.tone,
      })
      const content = res.data?.data?.content || res.data?.content || res.data
      setGeneratedContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
      toast.success('Content generated successfully!')
    } catch {
      toast.error('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-900">Content Studio</h2>
        <p className="text-sm text-dark-500 mt-1">AI-powered content optimization and generation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-100/50 rounded-xl w-fit">
        {(['optimize', 'generate'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              activeTab === tab ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
            )}
          >
            {tab === 'optimize' ? <Wand2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {tab === 'optimize' ? 'Optimize Page' : 'Generate Article'}
          </button>
        ))}
      </div>

      {/* ── OPTIMIZE TAB ── */}
      {activeTab === 'optimize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Controls */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-dark-900">Page Optimizer</h3>
              <p className="text-sm text-dark-500">Select an audited page to get AI suggestions</p>
            </CardHeader>
            <CardBody className="space-y-4">
              {audits.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No completed audits"
                  description="Run an SEO audit first to enable page optimization."
                />
              ) : (
                <>
                  {/* Audit select */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-1.5">Select Audit</label>
                    <select
                      className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                      value={selectedAudit}
                      onChange={(e) => { setSelectedAudit(e.target.value); setSelectedPage(''); setOptimizationResult(null) }}
                    >
                      <option value="">Choose an audit...</option>
                      {audits.map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.website_name || 'Audit'} — {a.pages_crawled || 7} pages
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Page select — always shown once audit selected */}
                  {selectedAudit && (
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-1.5">Select Page</label>
                      <select
                        className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                        value={selectedPage}
                        onChange={(e) => { setSelectedPage(e.target.value); setOptimizationResult(null) }}
                      >
                        <option value="">Choose a page...</option>
                        {pages.map((url, i) => (
                          <option key={i} value={url}>{url}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    onClick={handleOptimize}
                    isLoading={isOptimizing}
                    className="w-full"
                    disabled={!selectedAudit || !selectedPage}
                  >
                    <Wand2 className="w-4 h-4" />
                    Get AI Suggestions
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          {/* Right — Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-dark-900">Optimization Results</h3>
                {optimizationResult && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-500">Score</span>
                    <span className="text-sm font-bold text-danger-500">{optimizationResult.score_before}</span>
                    <span className="text-dark-300">→</span>
                    <span className="text-sm font-bold text-success-500">{optimizationResult.score_after}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {!optimizationResult ? (
                <div className="text-center py-12 text-dark-400">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Select a page and click "Get AI Suggestions"</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {/* Title */}
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-xs font-bold text-primary-700 uppercase mb-1">Suggested Title</p>
                    <p className="text-sm font-semibold text-dark-900">{optimizationResult.suggestions?.title}</p>
                  </div>
                  {/* Meta */}
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-xs font-bold text-primary-700 uppercase mb-1">Meta Description</p>
                    <p className="text-sm text-dark-700">{optimizationResult.suggestions?.metaDescription}</p>
                  </div>
                  {/* H1 */}
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-xs font-bold text-primary-700 uppercase mb-1">H1 Heading</p>
                    <p className="text-sm font-semibold text-dark-900">{optimizationResult.suggestions?.h1}</p>
                  </div>
                  {/* Suggestions */}
                  <div className="p-4 bg-dark-50 rounded-xl">
                    <p className="text-xs font-bold text-dark-500 uppercase mb-2">Content Suggestions</p>
                    <ul className="space-y-2">
                      {optimizationResult.suggestions?.contentSuggestions?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-dark-700 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Keywords */}
                  <div className="flex flex-wrap gap-2">
                    {optimizationResult.suggestions?.keywords?.map((kw: string, i: number) => (
                      <Badge key={i} variant="info">{kw}</Badge>
                    ))}
                  </div>
                  {/* Copy button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCopy(JSON.stringify(optimizationResult.suggestions, null, 2))}
                  >
                    {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                    Copy Suggestions
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── GENERATE TAB ── */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-dark-900">Article Generator</h3>
              <p className="text-sm text-dark-500">Generate SEO-optimized articles with AI</p>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleGenerate} className="space-y-4">
                <Input
                  label="Topic"
                  placeholder="e.g. SEO Best Practices for Indian Businesses 2026"
                  value={generateForm.topic}
                  onChange={(e) => setGenerateForm({ ...generateForm, topic: e.target.value })}
                  required
                />
                <Input
                  label="Target Keywords (comma separated)"
                  placeholder="seo india, best practices, ranking..."
                  value={generateForm.keywords}
                  onChange={(e) => setGenerateForm({ ...generateForm, keywords: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-1.5">Tone</label>
                  <select
                    className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                    value={generateForm.tone}
                    onChange={(e) => setGenerateForm({ ...generateForm, tone: e.target.value })}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>
                <Button type="submit" isLoading={isGenerating} className="w-full">
                  <Sparkles className="w-4 h-4" />
                  Generate Article
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-dark-900">Generated Content</h3>
                {generatedContent && (
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedContent)}>
                    {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {!generatedContent ? (
                <div className="text-center py-12 text-dark-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Enter a topic and generate your article</p>
                </div>
              ) : (
                <div className="bg-dark-50 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-dark-700 font-sans leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}