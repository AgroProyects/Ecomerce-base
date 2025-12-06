import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrderStats } from '@/actions/orders'
import { formatPrice, formatNumber } from '@/lib/utils/format'

export default async function AnalyticsPage() {
  const stats = await getOrderStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Analíticas
        </h1>
        <p className="text-zinc-500">Estadísticas de tu tienda</p>
      </div>

      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Ingresos totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Pedidos totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(stats.totalOrders)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Pedidos hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(stats.todayOrders)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by status */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-sm capitalize text-zinc-500">{status}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for charts */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas por día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-zinc-500">
            Gráfico de ventas (integrar con Recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
