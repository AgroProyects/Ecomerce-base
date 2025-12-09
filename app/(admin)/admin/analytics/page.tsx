import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalyticsClient } from '@/components/admin/AnalyticsClient'
import {
  getDashboardStats,
  getDailySales,
  getTopProducts,
  getRevenueMetrics,
  getOrdersByStatus,
  getCategorySales,
} from '@/actions/analytics'

export const dynamic = 'force-dynamic'

async function AnalyticsContent() {
  const [stats, dailySales30, dailySales7, topProducts, revenueMetrics, ordersByStatus, categorySales] =
    await Promise.all([
      getDashboardStats(),
      getDailySales(30),
      getDailySales(7),
      getTopProducts(10),
      getRevenueMetrics(),
      getOrdersByStatus(),
      getCategorySales(),
    ])

  return (
    <AnalyticsClient
      initialStats={stats}
      initialDailySales30={dailySales30}
      initialDailySales7={dailySales7}
      initialTopProducts={topProducts}
      initialRevenueMetrics={revenueMetrics}
      initialOrdersByStatus={ordersByStatus}
      initialCategorySales={categorySales}
    />
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      {/* Filtros skeleton */}
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  )
}
