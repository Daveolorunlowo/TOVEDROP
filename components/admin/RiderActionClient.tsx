'use client'

import { useState } from 'react'
import { UserActivityModal } from '@/components/admin/UserActivityModal'

export function RiderActionClient({ user }: { user: any }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button 
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
      >
        View Details
      </button>

      {open && (
        <UserActivityModal 
          user={user} 
          onClose={() => setOpen(false)} 
        />
      )}
    </>
  )
}
