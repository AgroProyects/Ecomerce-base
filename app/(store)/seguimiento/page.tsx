'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface OrderItem {
  product_name: string
  variant_name: string | null
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  order_number: string
  status: string
  customer_name: string
  customer_email: string
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total: number
  created_at: string
  paid_at: string | null
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente de pago', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  paid: { label: 'Pago confirmado', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  processing: { label: 'En preparación', color: 'text-purple-600 bg-purple-50', icon: Package },
  shipped: { label: 'Enviado', color: 'text-indigo-600 bg-indigo-50', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600 bg-red-50', icon: AlertCircle },
  refunded: { label: 'Reembolsado', color: 'text-zinc-600 bg-zinc-50', icon: AlertCircle },
}

const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'delivered']

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = statusOrder.indexOf(status)

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">
          {status === 'cancelled' ? 'Pedido cancelado' : 'Pedido reembolsado'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex justify-between">
        {statusOrder.map((step, index) => {
          const config = statusConfig[step]
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'
                )}
              >
                <config.icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCurrent ? 'text-green-600' : 'text-zinc-500'
                )}
              >
                {config.label}
              </span>
              {index < statusOrder.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 h-0.5 w-[calc(25%-20px)]',
                    isCompleted && index < currentIndex
                      ? 'bg-green-500'
                      : 'bg-zinc-300 dark:bg-zinc-700'
                  )}
                  style={{ left: `calc(${(index + 0.5) * 25}% + 20px)` }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SeguimientoPage() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orden') || '')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim() || !email.trim()) {
      setError('Por favor completá ambos campos')
      return
    }

    setIsLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await fetch(
        `/api/orders/track?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No encontramos tu pedido')
        return
      }

      setOrder(data.order)
    } catch (err) {
      setError('Error al buscar el pedido. Intentá nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Seguimiento de Pedido</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Ingresá tu número de pedido y email para ver el estado de tu compra
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Input
              label="Número de pedido"
              placeholder="Ej: ORD-2024-001234"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Email de compra"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar pedido
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Resultado */}
      {order && (
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Pedido #{order.order_number}</h2>
                <p className="text-zinc-500">
                  Realizado el {new Date(order.created_at).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                  statusConfig[order.status]?.color || 'bg-zinc-100 text-zinc-600'
                )}
              >
                {(() => {
                  const Icon = statusConfig[order.status]?.icon || Clock
                  return <Icon className="h-4 w-4" />
                })()}
                {statusConfig[order.status]?.label || order.status}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <OrderTimeline status={order.status} />
            </div>

            {/* Productos */}
            <div className="mb-8">
              <h3 className="mb-4 font-semibold">Productos</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-zinc-500">{item.variant_name}</p>
                      )}
                      <p className="text-sm text-zinc-500">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.unit_price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Envío</span>
                    <span>{formatPrice(order.shipping_cost)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Descuento</span>
                    <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold dark:border-zinc-800">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ayuda */}
          <div className="mt-6 text-center">
            <p className="text-zinc-500">
              ¿Tenés alguna consulta sobre tu pedido?{' '}
              <a href="/contacto" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                Contactanos
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
