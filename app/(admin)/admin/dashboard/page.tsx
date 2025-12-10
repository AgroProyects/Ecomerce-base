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
  Mail,
  Users,
  CheckCircle,
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
import { getEmailVerificationStats } from '@/actions/auth/stats'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import type { OrderStatus } from '@/schemas/order.schema'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const [stats, dailySales, topProducts, revenueMetrics, recentOrders, emailStats] = await Promise.all([
    getDashboardStats(),
    getDailySales(14), // últimos 14 días
    getTopProducts(5),
    getRevenueMetrics(),
    getRecentOrders(5),
    getEmailVerificationStats(),
  ])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
            {greeting()} 👋
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-1">
            Aquí está el resumen de tu tienda para hoy
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 shrink-0">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden md:inline">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="md:hidden">
            {new Date().toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                  Ingresos totales
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 truncate">
                  {formatPrice(stats.totalRevenue)}
                </p>
                <p className="text-emerald-100 text-xs mt-1">
                  {formatNumber(stats.totalOrders)} pedidos
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  Ticket promedio
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 truncate">
                  {formatPrice(stats.averageOrderValue)}
                </p>
                <p className="text-blue-100 text-xs mt-1">Por pedido</p>
              </div>
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.pendingOrders > 0 && (
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white col-span-1 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-amber-100 text-xs sm:text-sm font-medium">
                    Requieren atención
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.pendingOrders}
                  </p>
                  <Link
                    href="/admin/orders?status=pending"
                    className="text-amber-100 text-xs mt-1 hover:underline inline-flex items-center gap-1"
                  >
                    Ver pendientes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.lowStockProducts > 0 && (
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-red-100 text-xs sm:text-sm font-medium">Stock bajo</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.lowStockProducts}
                  </p>
                  <Link
                    href="/admin/products?stock=low_stock"
                    className="text-red-100 text-xs mt-1 hover:underline inline-flex items-center gap-1 truncate"
                  >
                    Ver productos <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl shrink-0">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Email Verification Stats */}
      {emailStats.unverifiedUsers > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Verificación de Emails</CardTitle>
                  <CardDescription className="text-xs">
                    Estado de confirmación de cuentas
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {emailStats.verificationRate}% verificados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Total</span>
                </div>
                <p className="text-2xl font-bold">{emailStats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-700 dark:text-green-400">Verificados</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {emailStats.verifiedUsers}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {emailStats.unverifiedUsers}
                </p>
              </div>
            </div>

            {emailStats.recentUnverifiedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                  Usuarios no verificados (últimos 7 días)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {emailStats.recentUnverifiedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {user.name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">
                        {new Date(user.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 w-full max-w-full overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Ventas de los últimos 14 días</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Ingresos y número de pedidos por día
              </CardDescription>
            </div>
            <Link href="/admin/analytics" className="shrink-0">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                <span className="hidden sm:inline">Ver más</span>
                <span className="sm:hidden">Más</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <SalesChart data={dailySales} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">Productos más vendidos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top 5 por ingresos</CardDescription>
            </div>
            <Link href="/admin/products" className="shrink-0">
              <Button variant="ghost" size="sm">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <TopProductsChart data={topProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Pedidos recientes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Los últimos 5 pedidos recibidos</CardDescription>
          </div>
          <Link href="/admin/orders" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
              Ver todos
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
                No hay pedidos aún
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
                Los pedidos aparecerán aquí cuando lleguen
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group w-full max-w-full"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                          #{order.order_number}
                        </p>
                        <OrderStatusBadge
                          status={order.status as OrderStatus}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-500 truncate">
                        {order.customer_name} <span className="hidden sm:inline">· {order.customer_email}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-xs text-zinc-500 hidden sm:block">
                      {new Date(order.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products/new" className="w-full">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors shrink-0">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Nuevo Producto
                </p>
                <p className="text-xs text-zinc-500 hidden sm:block">Agregar al catálogo</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="w-full">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Ver Pedidos
                </p>
                <p className="text-xs text-zinc-500 hidden sm:block">Gestionar órdenes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics" className="w-full">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Analíticas
                </p>
                <p className="text-xs text-zinc-500 hidden sm:block">Ver estadísticas</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/categories/new" className="w-full">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors shrink-0">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                  Nueva Categoría
                </p>
                <p className="text-xs text-zinc-500 hidden sm:block">Organizar productos</p>
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
