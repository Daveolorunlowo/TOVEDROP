import { Bell } from 'lucide-react'
import prisma from '@/lib/prisma'
import { UpdatesClient } from '@/components/updates/UpdatesClient'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1', 10)
  const itemsPerPage = 8

  // First fetch pinned items
  const pinnedUpdates = await prisma.update.findMany({
    where: { isPinned: true },
    orderBy: { publishedAt: 'desc' },
  })

  // Then fetch paginated unpinned items
  const [totalUnpinned, unpinnedUpdates] = await Promise.all([
    prisma.update.count({ where: { isPinned: false } }),
    prisma.update.findMany({
      where: { isPinned: false },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    })
  ])

  // Combine them for the first page only, otherwise just show unpinned
  const allUpdates = page === 1 
    ? [...pinnedUpdates, ...unpinnedUpdates] 
    : unpinnedUpdates
    
  // Total pages based ONLY on unpinned items (pinned bypass pagination)
  const totalPages = Math.ceil(totalUnpinned / itemsPerPage)

  return (
    <div className="w-full max-w-2xl mx-auto pt-8 pb-32 px-4">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-orange-brand" />
          Updates & Announcements
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stay in the loop with what's new on TOVEDROP.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-24 bg-muted/10 animate-pulse rounded-xl border border-border" />
          <div className="h-24 bg-muted/10 animate-pulse rounded-xl border border-border" />
          <div className="h-24 bg-muted/10 animate-pulse rounded-xl border border-border" />
        </div>
      } key={page}>
        <UpdatesClient 
          updates={allUpdates} 
          page={page} 
          totalPages={totalPages} 
          totalItems={totalUnpinned} 
          itemsPerPage={itemsPerPage} 
        />
      </Suspense>
    </div>
  )
}
