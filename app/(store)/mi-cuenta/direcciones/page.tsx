import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { MapPin, Plus, Star, Home, Building2, MapPinned, Phone, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressDialog } from './address-dialog'
import { DeleteAddressButton } from './delete-address-button'

function AddressesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function DireccionesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            Direcciones
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {addresses && addresses.length > 0
              ? `${addresses.length} ${addresses.length === 1 ? 'dirección guardada' : 'direcciones guardadas'}`
              : 'Gestiona tus direcciones de envío'}
          </p>
        </div>
        <AddressDialog userId={session.user.id}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar dirección
          </Button>
        </AddressDialog>
      </div>

      {!addresses || addresses.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <MapPinned className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No tienes direcciones guardadas
            </h3>
            <p className="mt-1 text-center text-zinc-500 max-w-sm">
              Agrega una dirección para agilizar tus compras y recibir tus pedidos.
            </p>
            <AddressDialog userId={session.user.id}>
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Agregar primera dirección
              </Button>
            </AddressDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className="group overflow-hidden border-0 shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-0">
                {/* Top gradient bar */}
                <div className={`h-1 ${address.is_default
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`
                } />

                <div className="p-5">
                  {/* Header with icon and label */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        address.is_default
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {address.label?.toLowerCase().includes('casa') ? (
                          <Home className={`h-5 w-5 ${address.is_default ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        ) : address.label?.toLowerCase().includes('trabajo') || address.label?.toLowerCase().includes('oficina') ? (
                          <Building2 className={`h-5 w-5 ${address.is_default ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        ) : (
                          <MapPin className={`h-5 w-5 ${address.is_default ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {address.label || 'Dirección'}
                        </h3>
                        {address.is_default && (
                          <Badge className="mt-1 gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Star className="h-3 w-3 fill-current" />
                            Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address details */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <User className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{address.recipient_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                      <MapPinned className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <p>
                          {address.street} {address.number}
                          {address.floor && `, Piso ${address.floor}`}
                          {address.apartment && ` ${address.apartment}`}
                        </p>
                        <p>
                          {address.city}, {address.state} ({address.postal_code})
                        </p>
                      </div>
                    </div>
                    {address.phone && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                        <span>{address.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <AddressDialog userId={session.user.id} address={address}>
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                    </AddressDialog>
                    <DeleteAddressButton addressId={address.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
