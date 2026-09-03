import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { AdminLegacyClient } from '@/components/admin/AdminLegacyClient'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  return <AdminLegacyClient initialTab="feedback" />
}
