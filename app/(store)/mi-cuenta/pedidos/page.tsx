import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Package, Eye } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'outline' },
  paid: { label: 'Pagado', variant: 'default' },
  processing: { label: 'Procesando', variant: 'secondary' },
  shipped: { label: 'Enviado', variant: 'secondary' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'destructive' },
}

export default async function PedidosPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        product:products (
          name,
          images
        )
      )
    `)
    .eq('customer_email', session.user.email)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mis Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Historial de tus compras y estado de envíos
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tenés pedidos aún</h3>
            <p className="text-muted-foreground text-center mt-2">
              Cuando realices tu primera compra, aparecerá aquí.
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Ver productos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusLabels[order.status] || { label: order.status, variant: 'outline' as const }
            const firstItem = order.order_items?.[0]
            const itemCount = order.order_items?.length || 0

            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        Pedido #{order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {firstItem?.product?.images?.[0] && (
                      <img
                        src={firstItem.product.images[0]}
                        alt={firstItem.product.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {firstItem?.product?.name || 'Producto'}
                      </p>
                      {itemCount > 1 && (
                        <p className="text-sm text-muted-foreground">
                          y {itemCount - 1} producto{itemCount > 2 ? 's' : ''} más
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <Button variant="ghost" size="sm" asChild className="mt-1">
                        <Link href={`/mi-cuenta/pedidos/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalle
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
