import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/features/dashboard/DashboardContent'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <DashboardContent />
}
