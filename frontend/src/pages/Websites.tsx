import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Plus, ExternalLink, Trash2, Edit3, FileSearch } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { EmptyState } from '@/components/ui/EmptyState'
import { useData } from '@/hooks/useData'
import { websiteAPI, auditAPI } from '@/services/api'
import { truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

export function Websites() {
  const { data, isLoading, refetch } = useData(websiteAPI.getAll)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentWebsite, setCurrentWebsite] = useState<any>(null)
  const [form, setForm] = useState({ name: '', url: '', description: '', target_keywords: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuditing, setIsAuditing] = useState<string | null>(null)

  const websites: any[] = (data as any)?.data?.websites || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        target_keywords: form.target_keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      }
      if (isEditing && currentWebsite) {
        await websiteAPI.update(currentWebsite.id, payload)
        toast.success('Website updated')
      } else {
        await websiteAPI.create(payload)
        toast.success('Website added successfully')
      }
      setIsModalOpen(false)
      setIsEditing(false)
      setCurrentWebsite(null)
      setForm({ name: '', url: '', description: '', target_keywords: '' })
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save website')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website?')) return
    try {
      await websiteAPI.delete(id)
      toast.success('Website deleted')
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleAudit = async (websiteId: string) => {
    setIsAuditing(websiteId)
    try {
      await auditAPI.start(websiteId)
      toast.success('Audit started! Check the Audits page for progress.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start audit')
    } finally {
      setIsAuditing(null)
    }
  }

  const openEdit = (website: any) => {
    setCurrentWebsite(website)
    setForm({
      name: website.name,
      url: website.url,
      description: website.description || '',
      target_keywords: (website.target_keywords || []).join(', '),
    })
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const openCreate = () => {
    setIsEditing(false)
    setCurrentWebsite(null)
    setForm({ name: '', url: '', description: '', target_keywords: '' })
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Websites</h2>
          <p className="text-sm text-dark-500 mt-1">Manage your SEO projects</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Website
        </Button>
      </div>

      {websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites yet"
          description="Add your first website to start tracking SEO performance and running audits."
          action={{ label: 'Add Website', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {websites.map((website: any, index: number) => (
            <motion.div
              key={website.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <CardBody>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-900">{website.name}</h3>
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          {truncate(website.url, 35)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <Badge variant={website.status === 'active' ? 'success' : 'warning'}>
                      {website.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <ScoreRing score={website.seo_score || 0} size="sm" label="SEO Score" />
                    <div className="text-right">
                      <p className="text-xs text-dark-500">Last Crawled</p>
                      <p className="text-sm font-medium text-dark-700">
                        {website.last_crawled_at
                          ? new Date(website.last_crawled_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {(website.target_keywords || []).slice(0, 3).map((kw: string) => (
                      <span
                        key={kw}
                        className="px-2 py-1 bg-dark-100 rounded-lg text-xs text-dark-600 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                    {(website.target_keywords || []).length > 3 && (
                      <span className="text-xs text-dark-400">
                        +{website.target_keywords.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-dark-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAudit(website.id)}
                      isLoading={isAuditing === website.id}
                    >
                      <FileSearch className="w-4 h-4" />
                      Audit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(website)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-500 hover:text-danger-600 hover:bg-danger-50"
                      onClick={() => handleDelete(website.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Website' : 'Add Website'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Website Name"
            placeholder="My Company Website"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Website URL"
            placeholder="https://example.com"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Brief description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Target Keywords (comma separated)"
            placeholder="seo, marketing, digital..."
            value={form.target_keywords}
            onChange={(e) => setForm({ ...form, target_keywords: e.target.value })}
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
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {isEditing ? 'Update' : 'Add Website'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}