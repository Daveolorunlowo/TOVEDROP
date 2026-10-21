import { redirect } from 'next/navigation'

export default function AdminSecurityPage() {
  redirect('/admin?tab=security')
}
