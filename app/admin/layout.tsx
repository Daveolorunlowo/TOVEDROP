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
    <AdminSidebar>
      {children}
    </AdminSidebar>
  )
}
