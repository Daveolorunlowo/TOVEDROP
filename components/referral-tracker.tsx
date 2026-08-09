"use client"

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function TrackerLogic() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      // Save it to a cookie that expires in 30 days
      const date = new Date()
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000))
      document.cookie = `tovedrop_ref=${ref}; expires=${date.toUTCString()}; path=/`
    }
  }, [searchParams])

  return null
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  )
}
