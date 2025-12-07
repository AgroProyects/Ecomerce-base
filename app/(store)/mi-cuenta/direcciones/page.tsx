import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { MapPin, Plus, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddressDialog } from './address-dialog'
import { DeleteAddressButton } from './delete-address-button'

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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Direcciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus direcciones de envío
          </p>
        </div>
        <AddressDialog userId={session.user.id}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </AddressDialog>
      </div>

      {!addresses || addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tenés direcciones guardadas</h3>
            <p className="text-muted-foreground text-center mt-2">
              Agregá una dirección para agilizar tus compras.
            </p>
            <AddressDialog userId={session.user.id}>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Agregar dirección
              </Button>
            </AddressDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.label}</span>
                    {address.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-medium">{address.recipient_name}</p>
                  <p className="text-muted-foreground">
                    {address.street} {address.number}
                    {address.floor && `, Piso ${address.floor}`}
                    {address.apartment && ` ${address.apartment}`}
                  </p>
                  <p className="text-muted-foreground">
                    {address.city}, {address.state} ({address.postal_code})
                  </p>
                  {address.phone && (
                    <p className="text-muted-foreground">{address.phone}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <AddressDialog userId={session.user.id} address={address}>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </AddressDialog>
                  <DeleteAddressButton addressId={address.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
