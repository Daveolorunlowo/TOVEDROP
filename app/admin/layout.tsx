import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'

import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth')
  }

  if (session.user.role !== 'ADMIN') {
    redirect(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
  }

  return (
    <div className="flex h-screen bg-bg-deep text-primary overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
        {children}
      </div>
    </div>
  )
}
