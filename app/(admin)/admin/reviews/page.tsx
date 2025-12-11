import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { MessageSquare, Star } from 'lucide-react'
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
      <Suspense fallback={<ReviewsLoadingSkeleton />}>
        <ReviewsModerationPanel />
      </Suspense>
    </div>
  )
}

function ReviewsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full sm:w-[400px]" />
        <Skeleton className="h-10 w-full sm:w-[200px]" />
      </div>

      {/* Reviews List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
