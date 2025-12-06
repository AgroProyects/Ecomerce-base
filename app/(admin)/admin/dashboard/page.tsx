import { Suspense } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSpinner } from '@/components/ui/spinner'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import { getOrderStats, getRecentOrders } from '@/actions/orders'
import { getProducts } from '@/actions/products'

export default async function DashboardPage() {
  const [orderStats, recentOrders, productsResult] = await Promise.all([
    getOrderStats(),
    getRecentOrders(5),
    getProducts({ pageSize: 1 }), // Just to get total count
  ])

  const stats = [
    {
      title: 'Ingresos totales',
      value: formatPrice(orderStats.totalRevenue),
      icon: DollarSign,
      description: 'Ventas confirmadas',
    },
    {
      title: 'Pedidos totales',
      value: formatNumber(orderStats.totalOrders),
      icon: ShoppingCart,
      description: `${orderStats.todayOrders} hoy`,
    },
    {
      title: 'Productos',
      value: formatNumber(productsResult.pagination.totalItems),
      icon: Package,
      description: 'En catálogo',
    },
    {
      title: 'Tasa de conversión',
      value: '3.2%',
      icon: TrendingUp,
      description: 'Últimos 30 días',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Resumen general de tu tienda
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-zinc-500">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PageSpinner />}>
            {recentOrders.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                No hay pedidos aún
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-sm text-zinc-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <p className="text-xs capitalize text-zinc-500">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
