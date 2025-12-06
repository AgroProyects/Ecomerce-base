import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'

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

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar />
      <div className="flex flex-1 flex-col pl-64">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
