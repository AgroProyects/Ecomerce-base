import { Suspense } from 'react'
import { Settings, Store } from 'lucide-react'
import { getStoreSettings } from '@/actions/settings'
import { Skeleton } from '@/components/ui/skeleton'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const dynamic = 'force-dynamic'

async function SettingsContent() {
  const settings = await getStoreSettings()

  return <SettingsForm settings={settings} />
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Configuración
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Personaliza y configura tu tienda
          </p>
        </div>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}
