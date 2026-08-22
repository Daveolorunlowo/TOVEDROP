'use client'

import { useState } from 'react'

export function DriverActionsClient({ driverId, status }: { driverId: string, status: string }) {
  const [processing, setProcessing] = useState(false)

  const handleAction = async (action: 'approve' | 'suspend') => {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/drivers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action })
      })
      if (!res.ok) throw new Error('Failed')
      window.location.reload()
    } catch (e) {
      alert('Error updating driver status')
      setProcessing(false)
    }
  }

  if (status.toUpperCase() === 'PENDING') {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          disabled={processing}
          onClick={() => handleAction('approve')}
          className="text-xs font-semibold px-3 py-1.5 rounded-md text-green-500 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
        >
          {processing ? '...' : 'Approve'}
        </button>
        <button
          disabled={processing}
          onClick={() => handleAction('suspend')}
          className="text-xs font-semibold px-3 py-1.5 rounded-md text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          {processing ? '...' : 'Reject'}
        </button>
      </div>
    )
  }

  if (status.toUpperCase() === 'APPROVED') {
    return (
      <button
        disabled={processing}
        onClick={() => handleAction('suspend')}
        className="text-xs font-semibold px-3 py-1.5 rounded-md text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
      >
        {processing ? '...' : 'Suspend'}
      </button>
    )
  }

  return (
    <button
      disabled={processing}
      onClick={() => handleAction('approve')}
      className="text-xs font-semibold px-3 py-1.5 rounded-md text-green-500 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
    >
      {processing ? '...' : 'Un-suspend'}
    </button>
  )
}
