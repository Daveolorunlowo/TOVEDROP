import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LiveTrackerWrapper } from './LiveTrackerWrapper'

export default async function TrackPage({ params }: { params: { shareToken: string } }) {
  const trip = await prisma.trip.findUnique({
    where: { shareToken: params.shareToken },
    include: { driver: true, rider: true }
  })

  if (!trip) {
    notFound()
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <header className="h-[60px] p-4 bg-card border-b border-border flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--orange-brand)] flex items-center justify-center text-white font-black text-xs">
            TD
          </div>
          <h1 className="font-bold text-sm tracking-wide">Tovedrop Live</h1>
        </div>
        <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-widest">
          {trip.status}
        </div>
      </header>

      <main className="flex-1 w-full relative">
        <LiveTrackerWrapper trip={trip} />
      </main>
    </div>
  )
}
