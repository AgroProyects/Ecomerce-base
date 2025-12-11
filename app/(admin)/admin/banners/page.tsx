import { Suspense } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { getBannersAdmin } from '@/actions/settings'
import { Skeleton } from '@/components/ui/skeleton'
import { BannersPanel } from './banners-panel'

export const dynamic = 'force-dynamic'

async function BannersContent() {
  const banners = await getBannersAdmin()
  return <BannersPanel initialBanners={banners} />
}

function BannersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <Skeleton className="aspect-[16/9]" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BannersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BannersSkeleton />}>
        <BannersContent />
      </Suspense>
    </div>
  )
}
