'use client'

import Image from 'next/image'
import {
  Package,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  Hash,
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Order } from '@/types/database'
import type { OrderItemWithProduct } from '@/actions/orders/queries'
import type { OrderStatus, PaymentMethod } from '@/schemas/order.schema'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils'

interface CustomerOrderDetailsProps {
  order: Order
  items: OrderItemWithProduct[]
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia Bancaria',
  cash_on_delivery: 'Efectivo contra entrega',
}

const STATUS_INFO: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-300',
  },
  pending_payment: {
    label: 'Pendiente de Pago',
    icon: AlertCircle,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-300',
  },
  paid: {
    label: 'Pagado',
    icon: CheckCircle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-300',
  },
  processing: {
    label: 'En Preparación',
    icon: Package,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-300',
  },
  shipped: {
    label: 'Enviado',
    icon: Truck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-300',
  },
  delivered: {
    label: 'Entregado',
    icon: PackageCheck,
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-300',
  },
  refunded: {
    label: 'Reembolsado',
    icon: AlertCircle,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-300',
  },
}

export function CustomerOrderDetails({ order, items }: CustomerOrderDetailsProps) {
  const shippingAddress = order.shipping_address as any
  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.pending
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pedido #{order.order_number}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Realizado el {formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border-2', statusInfo.bgColor)}>
          <StatusIcon className={cn('h-5 w-5', statusInfo.color)} />
          <span className={cn('font-semibold', statusInfo.color)}>{statusInfo.label}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.product?.images?.[0] && (
                      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg border overflow-hidden">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.product?.name || 'Producto'}</h3>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Cantidad: {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Resumen de precios */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span>{formatPrice(order.shipping_cost)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas del cliente */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Notas del pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Información lateral */}
        <div className="space-y-6">
          {/* Información de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Información de contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                {order.customer_phone && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dirección de envío */}
          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5" />
                  Dirección de envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {shippingAddress.street} {shippingAddress.number}
                  </p>
                  {shippingAddress.apartment && <p>Apto {shippingAddress.apartment}</p>}
                  {shippingAddress.floor && <p>Piso {shippingAddress.floor}</p>}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}
                  </p>
                  {shippingAddress.postal_code && <p>CP: {shippingAddress.postal_code}</p>}
                  <p className="font-medium mt-2">{shippingAddress.country || 'Uruguay'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Método de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Método de pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod] || order.payment_method}
                </p>
                {order.mp_payment_id && (
                  <p className="text-xs text-muted-foreground">
                    ID de pago: {order.mp_payment_id}
                  </p>
                )}
                {order.payment_status && (
                  <Badge variant="outline" className="text-xs">
                    {order.payment_status}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline de fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Creado</p>
                  <p className="text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                {order.paid_at && (
                  <div>
                    <p className="font-medium">Pagado</p>
                    <p className="text-muted-foreground">{formatDate(order.paid_at)}</p>
                  </div>
                )}
                {order.shipped_at && (
                  <div>
                    <p className="font-medium">Enviado</p>
                    <p className="text-muted-foreground">{formatDate(order.shipped_at)}</p>
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <p className="font-medium">Entregado</p>
                    <p className="text-muted-foreground">{formatDate(order.delivered_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
