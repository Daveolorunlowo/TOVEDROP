import { redirect } from 'next/navigation'

export default function AdminFinancesPage() {
  redirect('/admin?tab=revenue')
}
