import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'

export const dynamic = 'force-dynamic'

export default async function AdminRidersPage(props: {
  searchParams: Promise<{ page?: string, q?: string, status?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-5 py-10 relative">
      <AdminUsersTab searchParams={searchParams} />
    </main>
  )
}
