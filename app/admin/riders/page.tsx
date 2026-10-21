import { redirect } from 'next/navigation'

export default function AdminRidersPage() {
  redirect('/admin?tab=users')
}
