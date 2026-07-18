export const runtime = 'nodejs'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClientOnlyWrapper } from '@/components/ClientOnlyWrapper'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <ClientOnlyWrapper>
      <DashboardLayout>{children}</DashboardLayout>
    </ClientOnlyWrapper>
  )
}
