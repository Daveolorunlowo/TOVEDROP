import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
 const session = await getServerSession(authOptions)
 if (!session?.user) redirect('/auth')

 if (session.user.role !== 'RIDER') {
 redirect(getRoleRedirectPath(session.user.role as string, session.user.driverStatus as string | null))
 }

 return (
 <DashboardLayoutClient>
 {children}
 </DashboardLayoutClient>
 )
}
