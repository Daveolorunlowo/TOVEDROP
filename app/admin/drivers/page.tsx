import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { AdminDriversTab } from '@/components/admin/AdminDriversTab'

export const dynamic = 'force-dynamic'

export default async function AdminDriversPage(props: {
  searchParams: Promise<{ page?: string, q?: string, status?: string }>
}) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth')
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-5 py-10 relative">
      <AdminDriversTab searchParams={searchParams} />
    </main>
  )
}
