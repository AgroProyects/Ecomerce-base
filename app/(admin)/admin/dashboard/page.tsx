import { Suspense } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Calendar,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/admin/StatsCard'
import { SalesChart } from '@/components/admin/charts/SalesChart'
import { TopProductsChart } from '@/components/admin/charts/TopProductsChart'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import { getRecentOrders } from '@/actions/orders'
import {
  getDashboardStats,
  getDailySales,
  getTopProducts,
  getRevenueMetrics,
} from '@/actions/analytics'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import type { OrderStatus } from '@/schemas/order.schema'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const [stats, dailySales, topProducts, revenueMetrics, recentOrders] = await Promise.all([
    getDashboardStats(),
    getDailySales(14), // últimos 14 días
    getTopProducts(5),
    getRevenueMetrics(),
    getRecentOrders(5),
  ])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {greeting()} 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Aquí está el resumen de tu tienda para hoy
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos del día"
          value={formatPrice(stats.todayRevenue)}
          icon="DollarSign"
          variant="success"
          trend={{
            value: revenueMetrics.percentageChange.daily,
            label: 'vs. ayer',
          }}
        />
        <StatsCard
          title="Pedidos hoy"
          value={formatNumber(stats.todayOrders)}
          icon="ShoppingCart"
          variant="info"
          description={`${stats.pendingOrders} pendientes`}
        />
        <StatsCard
          title="Productos"
          value={formatNumber(stats.totalProducts)}
          icon="Package"
          variant="default"
          description={
            stats.lowStockProducts > 0
              ? `${stats.lowStockProducts} con stock bajo`
              : 'Stock saludable'
          }
        />
        <StatsCard
          title="Clientes"
          value={formatNumber(stats.totalCustomers)}
          icon="Users"
          variant="default"
          description="Clientes únicos"
        />
      </div>

      {/* Segunda fila de stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  Ingresos totales
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-emerald-100 text-xs mt-1">
                  {formatNumber(stats.totalOrders)} pedidos completados
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Ticket promedio
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(stats.averageOrderValue)}
                </p>
                <p className="text-blue-100 text-xs mt-1">Por pedido</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.pendingOrders > 0 && (
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white col-span-1 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">
                    Requieren atención
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.pendingOrders}
                  </p>
                  <Link
                    href="/admin/orders?status=pending"
                    className="text-amber-100 text-xs mt-1 hover:underline inline-flex items-center gap-1"
                  >
                    Ver pendientes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.lowStockProducts > 0 && (
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Stock bajo</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.lowStockProducts}
                  </p>
                  <Link
                    href="/admin/products?stock=low_stock"
                    className="text-red-100 text-xs mt-1 hover:underline inline-flex items-center gap-1"
                  >
                    Ver productos <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ventas de los últimos 14 días</CardTitle>
              <CardDescription>
                Ingresos y número de pedidos por día
              </CardDescription>
            </div>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm">
                Ver más
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <SalesChart data={dailySales} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Productos más vendidos</CardTitle>
              <CardDescription>Top 5 por ingresos</CardDescription>
            </div>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={topProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos recientes</CardTitle>
            <CardDescription>Los últimos 5 pedidos recibidos</CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">
                No hay pedidos aún
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Los pedidos aparecerán aquí cuando lleguen
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          #{order.order_number}
                        </p>
                        <OrderStatusBadge
                          status={order.status as OrderStatus}
                        />
                      </div>
                      <p className="text-sm text-zinc-500">
                        {order.customer_name} · {order.customer_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products/new">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Nuevo Producto
                </p>
                <p className="text-xs text-zinc-500">Agregar al catálogo</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Ver Pedidos
                </p>
                <p className="text-xs text-zinc-500">Gestionar órdenes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Analíticas
                </p>
                <p className="text-xs text-zinc-500">Ver estadísticas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/categories/new">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Nueva Categoría
                </p>
                <p className="text-xs text-zinc-500">Organizar productos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
