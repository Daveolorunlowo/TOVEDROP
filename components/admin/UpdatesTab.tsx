'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Send, Clock, Pin, CheckCircle2, AlertCircle } from 'lucide-react'
import { UpdateFormModal } from './UpdateFormModal'

export function UpdatesTab() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<any>(null)

  const fetchUpdates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/updates')
      if (res.ok) {
        const data = await res.json()
        setUpdates(data.updates || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return
    try {
      const res = await fetch(`/api/admin/updates/${id}`, { method: 'DELETE' })
      if (res.ok) fetchUpdates()
    } catch (e) {
      console.error(e)
    }
  }

  const handleTogglePublish = async (update: any) => {
    try {
      const action = update.publishedAt ? 'DRAFT' : 'PUBLISH'
      const res = await fetch(`/api/admin/updates/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) fetchUpdates()
    } catch (e) {
      console.error(e)
    }
  }

  const handleTogglePin = async (update: any) => {
    try {
      const res = await fetch(`/api/admin/updates/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !update.isPinned })
      })
      if (res.ok) fetchUpdates()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm animate-pulse">Loading updates...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Updates & Announcements</h2>
          <p className="text-sm text-muted-foreground mt-1">Publish news and features to users.</p>
        </div>
        <button
          onClick={() => { setEditingUpdate(null); setModalOpen(true); }}
          className="bg-orange-brand hover:bg-orange-600 text-foreground px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Update
        </button>
      </div>

      <div className="bg-[#171717] rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-[#111] text-[#555] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Audience</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {updates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#555]">
                    No updates found. Click "New Update" to create one.
                  </td>
                </tr>
              ) : (
                updates.map((update) => (
                  <tr key={update.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {update.isPinned && <Pin className="w-3.5 h-3.5 text-orange-brand" />}
                        <span className="font-medium text-foreground truncate max-w-[200px]" title={update.title}>
                          {update.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-[#222] text-[#ccc]">
                        {update.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-[#222] text-[#ccc]">
                        {update.audience}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {update.publishedAt ? (
                        <div className="flex items-center gap-1.5 text-[#22c55e]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-xs">Published</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-orange-brand">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">Draft</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleTogglePin(update)}
                          className="text-muted-foreground hover:text-orange-brand transition-colors"
                          title={update.isPinned ? "Unpin" : "Pin"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(update)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={update.publishedAt ? "Unpublish" : "Publish Now"}
                        >
                          {update.publishedAt ? <AlertCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingUpdate(update); setModalOpen(true); }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(update.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <UpdateFormModal
          update={editingUpdate}
          onClose={() => { setModalOpen(false); setEditingUpdate(null); }}
          onRefresh={fetchUpdates}
        />
      )}
    </div>
  )
}
