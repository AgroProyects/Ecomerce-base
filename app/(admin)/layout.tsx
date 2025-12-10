import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { AdminLayoutClient } from './admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <AdminLayoutClient user={session.user}>{children}</AdminLayoutClient>
}
