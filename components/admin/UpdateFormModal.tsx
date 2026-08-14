'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

export function UpdateFormModal({ update, onClose, onRefresh }: { update: any, onClose: () => void, onRefresh: () => void }) {
  const [title, setTitle] = useState(update?.title || '')
  const [content, setContent] = useState(update?.body || '')
  const [category, setCategory] = useState(update?.category || 'ANNOUNCEMENT')
  const [audience, setAudience] = useState(update?.audience || 'ALL')
  const [isPinned, setIsPinned] = useState(update?.isPinned || false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSave = async (action: 'DRAFT' | 'PUBLISH') => {
    if (!title || !content) {
      setError('Title and Body are required.')
      return
    }
    setLoadingAction(action)
    setError('')

    const payload = { title, content, category, audience, isPinned, action }

    try {
      const url = update ? `/api/admin/updates/${update.id}` : '/api/admin/updates'
      const method = update ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onRefresh()
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save update.')
      }
    } catch (e) {
      console.error(e)
      setError('An unexpected error occurred.')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111111] border border-[#222] rounded-xl w-full max-w-lg shadow-2xl flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {update ? 'Edit Update' : 'New Update'}
          </h3>
          <button onClick={onClose} className="p-1 text-[#888] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., New Feature: Wallet Top-ups"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5">Body</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the announcement details here..."
              rows={5}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-brand transition-colors resize-none"
            />
            <p className="text-[10px] text-[#555] mt-1">Line breaks will be preserved.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-brand transition-colors"
              >
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="NEW_FEATURE">New Feature</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wide mb-1.5">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-brand transition-colors"
              >
                <option value="ALL">Everyone</option>
                <option value="RIDERS">Riders Only</option>
                <option value="DRIVERS">Drivers Only</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-[#333] bg-[#1a1a1a] text-orange-brand focus:ring-orange-brand focus:ring-offset-[#111]"
            />
            <span className="text-sm text-white font-medium">Pin this update to the top</span>
          </label>
        </div>

        <div className="p-4 border-t border-[#222] flex items-center justify-end gap-3 bg-[#171717] rounded-b-xl">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={!!loadingAction}
            className="px-4 py-2 text-sm font-semibold text-[#888] hover:text-white transition-colors"
          >
            {loadingAction === 'DRAFT' ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
            Save as Draft
          </button>
          
          <button
            onClick={() => handleSave('PUBLISH')}
            disabled={!!loadingAction}
            className="bg-orange-brand hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-lg"
          >
            {loadingAction === 'PUBLISH' ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
            {update?.publishedAt ? 'Publish Changes' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
