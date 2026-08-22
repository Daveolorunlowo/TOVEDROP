import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { AdminLegacyClient } from '@/components/admin/AdminLegacyClient'

export const dynamic = 'force-dynamic'

export default async function AdminSecurityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-5 py-10 relative">
      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden shadow-lg p-0 relative">
        <div className="absolute inset-0 z-0 bg-red-500/5 opacity-50 pointer-events-none mix-blend-overlay"></div>
        <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-sm font-semibold text-red-500">
          Legacy View: Note that the internal sidebar below is being phased out. Use the main sidebar instead.
        </div>
        <div className="h-[800px] overflow-auto">
          <AdminLegacyClient initialTab="security" />
        </div>
      </div>
    </main>
  )
}
