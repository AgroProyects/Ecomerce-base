import { Suspense } from 'react'
import Link from 'next/link'
import {
  Package,
  Eye,
  Clock,
  DollarSign,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatPrice } from '@/lib/utils/format'
import { getOrders, getOrderStats } from '@/actions/orders'
import { ROUTES } from '@/lib/constants/routes'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { OrderFilters } from '@/components/admin/OrderFilters'
import type { OrderStatus, PaymentMethod } from '@/types/api'

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    search?: string
    startDate?: string
    endDate?: string
    minAmount?: string
    maxAmount?: string
    paymentMethod?: string
    sortBy?: string
    sortOrder?: string
  }>
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia',
  cash_on_delivery: 'Efectivo',
}

const PAYMENT_METHOD_ICONS: Record<string, string> = {
  mercadopago: '💳',
  bank_transfer: '🏦',
  cash_on_delivery: '💵',
}

async function OrdersContent({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const validStatuses: OrderStatus[] = [
    'pending',
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]
  const status =
    params.status && validStatuses.includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : undefined

  const [ordersResult, stats] = await Promise.all([
    getOrders({
      page,
      pageSize: 20,
      status,
      search: params.search,
      startDate: params.startDate,
      endDate: params.endDate,
      minAmount: params.minAmount ? Number(params.minAmount) : undefined,
      maxAmount: params.maxAmount ? Number(params.maxAmount) : undefined,
      paymentMethod: params.paymentMethod as PaymentMethod | undefined,
      sortBy: (params.sortBy as 'created_at' | 'total' | 'order_number') || 'created_at',
      sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
    }),
    getOrderStats(),
  ])

  const { pagination } = ordersResult

  // Construir URL para paginación manteniendo filtros
  const buildPageUrl = (newPage: number) => {
    const searchParamsObj = new URLSearchParams()
    searchParamsObj.set('page', newPage.toString())
    if (params.status) searchParamsObj.set('status', params.status)
    if (params.search) searchParamsObj.set('search', params.search)
    if (params.startDate) searchParamsObj.set('startDate', params.startDate)
    if (params.endDate) searchParamsObj.set('endDate', params.endDate)
    if (params.minAmount) searchParamsObj.set('minAmount', params.minAmount)
    if (params.maxAmount) searchParamsObj.set('maxAmount', params.maxAmount)
    if (params.paymentMethod) searchParamsObj.set('paymentMethod', params.paymentMethod)
    return `/admin/orders?${searchParamsObj.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Pedidos
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona todos los pedidos de tu tienda
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-zinc-500">Total pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-xs text-zinc-500">Ingresos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
                <p className="text-xs text-zinc-500">Pedidos hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(stats.byStatus['pending'] || 0) + (stats.byStatus['pending_payment'] || 0)}
                </p>
                <p className="text-xs text-zinc-500">Requieren atención</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <OrderFilters totalOrders={pagination.totalItems} />

      {/* Tabla de pedidos */}
      <Card>
        <CardContent className="p-0">
          {ordersResult.data.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                No se encontraron pedidos
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {params.search || params.status || params.startDate
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Los pedidos aparecerán aquí cuando los clientes realicen compras'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersResult.data.map((order) => (
                      <TableRow key={order.id} className="group">
                        <TableCell>
                          <Link
                            href={ROUTES.ADMIN.ORDER_DETAIL(order.id)}
                            className="font-mono font-bold text-primary hover:underline"
                          >
                            #{order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{order.customer_name}</p>
                            <p className="text-xs text-zinc-500 truncate">{order.customer_email}</p>
                            {order.customer_phone && (
                              <p className="text-xs text-zinc-400 truncate">{order.customer_phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{formatPrice(order.total)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {PAYMENT_METHOD_ICONS[order.payment_method || ''] || '💰'}
                            </span>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {order.payment_method
                                ? PAYMENT_METHOD_LABELS[order.payment_method]
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status as OrderStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-zinc-900 dark:text-zinc-100">
                              {new Date(order.created_at).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(order.created_at).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={ROUTES.ADMIN.ORDER_DETAIL(order.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {order.status === 'paid' && (
                                <DropdownMenuItem>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Marcar enviado
                                </DropdownMenuItem>
                              )}
                              {order.status === 'shipped' && (
                                <DropdownMenuItem>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Marcar entregado
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-500">
                    Mostrando {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} de{' '}
                    {pagination.totalItems} pedidos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      asChild={pagination.page > 1}
                    >
                      {pagination.page > 1 ? (
                        <Link href={buildPageUrl(pagination.page - 1)}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Link>
                      ) : (
                        <>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? 'default' : 'ghost'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            asChild={pageNum !== pagination.page}
                          >
                            {pageNum !== pagination.page ? (
                              <Link href={buildPageUrl(pageNum)}>{pageNum}</Link>
                            ) : (
                              <span>{pageNum}</span>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      asChild={pagination.hasMore}
                    >
                      {pagination.hasMore ? (
                        <Link href={buildPageUrl(pagination.page + 1)}>
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      ) : (
                        <>
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-96" />
    </div>
  )
}

export default function OrdersPage(props: OrdersPageProps) {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent {...props} />
    </Suspense>
  )
}
