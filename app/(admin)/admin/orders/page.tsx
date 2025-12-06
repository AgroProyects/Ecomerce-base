import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import { getOrders } from '@/actions/orders'
import { ORDER_STATUS } from '@/lib/constants/config'
import { ROUTES } from '@/lib/constants/routes'
import type { OrderStatus } from '@/types/api'

interface OrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const validStatuses: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  const status = params.status && validStatuses.includes(params.status as OrderStatus)
    ? params.status as OrderStatus
    : undefined

  const ordersResult = await getOrders({
    page,
    pageSize: 20,
    status,
  })

  const getStatusBadge = (status: string) => {
    const config = ORDER_STATUS[status as keyof typeof ORDER_STATUS]
    if (!config) return <Badge>{status}</Badge>

    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
      yellow: 'warning',
      green: 'success',
      red: 'destructive',
      blue: 'default',
      purple: 'secondary',
      gray: 'secondary',
    }

    return (
      <Badge variant={variantMap[config.color] || 'default'}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Pedidos
        </h1>
        <p className="text-zinc-500">
          {ordersResult.pagination.totalItems} pedidos en total
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-4 py-1 text-sm ${
            !params.status
              ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          Todos
        </Link>
        {Object.entries(ORDER_STATUS).map(([key, value]) => (
          <Link
            key={key}
            href={`/admin/orders?status=${key}`}
            className={`rounded-full px-4 py-1 text-sm ${
              params.status === key
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {value.label}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersResult.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No hay pedidos
                </TableCell>
              </TableRow>
            ) : (
              ordersResult.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    #{order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-zinc-500">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {formatDateTime(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.ADMIN.ORDER_DETAIL(order.id)}>
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
