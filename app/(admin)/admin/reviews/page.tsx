import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { ReviewsModerationPanel } from './reviews-moderation-panel'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Moderación de Reseñas - Admin',
  description: 'Panel de administración para moderar reseñas de productos',
}

export default async function ReviewsPage() {
  const session = await auth()

  if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
    redirect('/admin/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderación de Reseñas</h1>
        <p className="text-muted-foreground mt-2">
          Revisa y modera las reseñas de productos enviadas por los clientes
        </p>
      </div>

      <Suspense fallback={<ReviewsLoadingSkeleton />}>
        <ReviewsModerationPanel />
      </Suspense>
    </div>
  )
}

function ReviewsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  )
}
