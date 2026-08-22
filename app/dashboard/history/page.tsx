import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MyTripsTab } from '@/components/dashboard/MyTripsTab'
import { BottomNav } from '@/components/dashboard/BottomNav'

export default async function HistoryPage(props: { searchParams: Promise<{ page?: string, filter?: string }> }) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/auth')

  return (
    <div className="bg-bg-deep min-h-screen pb-24 relative font-sans">
      <div className="max-w-md mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 -ml-2 text-white hover:text-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">Ride History</h1>
        </div>

        <MyTripsTab userId={user.id} searchParams={searchParams} />
      </div>

      <BottomNav />
    </div>
  )
}
