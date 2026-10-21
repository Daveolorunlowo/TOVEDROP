import { redirect } from 'next/navigation'

export default function AdminDriversPage() {
  redirect('/admin?tab=approvals')
}
