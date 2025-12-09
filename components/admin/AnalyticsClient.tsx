'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Calendar,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsCard } from '@/components/admin/StatsCard'
import { SalesChart } from '@/components/admin/charts/SalesChart'
import { OrdersStatusChart } from '@/components/admin/charts/OrdersStatusChart'
import { TopProductsChart } from '@/components/admin/charts/TopProductsChart'
import { AnalyticsFilters, type DateRange } from '@/components/admin/AnalyticsFilters'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import type {
  DashboardStats,
  DailySales,
  TopProduct,
  RevenueMetrics,
  OrdersByStatus,
  AnalyticsExportData,
} from '@/actions/analytics'

interface AnalyticsClientProps {
  initialStats: DashboardStats
  initialDailySales30: DailySales[]
  initialDailySales7: DailySales[]
  initialTopProducts: TopProduct[]
  initialRevenueMetrics: RevenueMetrics
  initialOrdersByStatus: OrdersByStatus[]
  initialCategorySales: {
    category_name: string
    total_revenue: number
    total_orders: number
  }[]
}

export function AnalyticsClient({
  initialStats,
  initialDailySales30,
  initialDailySales7,
  initialTopProducts,
  initialRevenueMetrics,
  initialOrdersByStatus,
  initialCategorySales,
}: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30days')
  const [exportData, setExportData] = useState<AnalyticsExportData | null>(null)
  const [isLoadingExport, setIsLoadingExport] = useState(false)

  // Cargar datos de exportación cuando cambie el rango
  const loadExportData = useCallback(async (range: DateRange) => {
    setIsLoadingExport(true)
    try {
      const response = await fetch(`/api/analytics/export?range=${range}`)
      if (response.ok) {
        const data = await response.json()
        setExportData(data)
      }
    } catch (error) {
      console.error('Error loading export data:', error)
    } finally {
      setIsLoadingExport(false)
    }
  }, [])

  useEffect(() => {
    loadExportData(dateRange)
  }, [dateRange, loadExportData])

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const formatPercentageChange = (value: number) => {
    const isPositive = value >= 0
    return {
      text: `${isPositive ? '+' : ''}${value.toFixed(1)}%`,
      isPositive,
    }
  }

  const weeklyChange = formatPercentageChange(initialRevenueMetrics.percentageChange.weekly)
  const monthlyChange = formatPercentageChange(initialRevenueMetrics.percentageChange.monthly)

  // Seleccionar datos según el tab activo
  const dailySalesData = dateRange === '7days' ? initialDailySales7 : initialDailySales30

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Analíticas
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Estadísticas detalladas de tu tienda
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Calendar className="h-4 w-4" />
          Última actualización: {new Date().toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Filtros y Exportación */}
      <AnalyticsFilters
        currentRange={dateRange}
        onRangeChange={handleRangeChange}
        exportData={exportData}
        isLoading={isLoadingExport}
      />

      {/* Revenue Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Hoy</p>
              <Badge
                variant={initialRevenueMetrics.percentageChange.daily >= 0 ? 'default' : 'destructive'}
                className="font-mono text-xs"
              >
                {initialRevenueMetrics.percentageChange.daily >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(initialRevenueMetrics.percentageChange.daily).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">
              {formatPrice(initialRevenueMetrics.today)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              vs ayer: {formatPrice(initialRevenueMetrics.yesterday)}
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Esta semana</p>
              <Badge
                variant={weeklyChange.isPositive ? 'default' : 'destructive'}
                className="font-mono text-xs"
              >
                {weeklyChange.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(initialRevenueMetrics.percentageChange.weekly).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">
              {formatPrice(initialRevenueMetrics.thisWeek)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Semana pasada: {formatPrice(initialRevenueMetrics.lastWeek)}
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">Este mes</p>
              <Badge
                variant={monthlyChange.isPositive ? 'default' : 'destructive'}
                className="font-mono text-xs"
              >
                {monthlyChange.isPositive ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(initialRevenueMetrics.percentageChange.monthly).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">
              {formatPrice(initialRevenueMetrics.thisMonth)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Mes pasado: {formatPrice(initialRevenueMetrics.lastMonth)}
            </p>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary-foreground/80">Total histórico</p>
              <DollarSign className="h-5 w-5 text-primary-foreground/80" />
            </div>
            <p className="text-3xl font-bold mt-2">{formatPrice(initialStats.totalRevenue)}</p>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {formatNumber(initialStats.totalOrders)} pedidos completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ticket promedio"
          value={formatPrice(initialStats.averageOrderValue)}
          icon="ShoppingCart"
          variant="info"
          description="Por pedido"
        />
        <StatsCard
          title="Total de pedidos"
          value={formatNumber(initialStats.totalOrders)}
          icon="Package"
          variant="success"
          description={`${initialStats.todayOrders} hoy`}
        />
        <StatsCard
          title="Clientes únicos"
          value={formatNumber(initialStats.totalCustomers)}
          icon="Users"
          variant="default"
          description="Total registrados"
        />
        <StatsCard
          title="Productos activos"
          value={formatNumber(initialStats.totalProducts)}
          icon="BarChart3"
          variant="default"
          description={initialStats.lowStockProducts > 0 ? `${initialStats.lowStockProducts} con stock bajo` : 'Stock saludable'}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="30days" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Ventas por período
          </h2>
          <TabsList>
            <TabsTrigger value="7days">7 días</TabsTrigger>
            <TabsTrigger value="30days">30 días</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="7days">
          <Card>
            <CardHeader>
              <CardTitle>Últimos 7 días</CardTitle>
              <CardDescription>Ingresos y pedidos por día</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={initialDailySales7} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="30days">
          <Card>
            <CardHeader>
              <CardTitle>Últimos 30 días</CardTitle>
              <CardDescription>Ingresos y pedidos por día</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={initialDailySales30} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Orders and Products Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Pedidos por estado
            </CardTitle>
            <CardDescription>Distribución de estados de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersStatusChart data={initialOrdersByStatus} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top 10 productos más vendidos
            </CardTitle>
            <CardDescription>Por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={initialTopProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Category Sales */}
      {initialCategorySales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ventas por categoría</CardTitle>
            <CardDescription>Ingresos totales por categoría de producto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialCategorySales.map((category, index) => {
                const maxRevenue = initialCategorySales[0]?.total_revenue || 1
                const percentage = (category.total_revenue / maxRevenue) * 100

                return (
                  <div key={category.category_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {category.category_name}
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        {formatPrice(category.total_revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Mejor día del mes</p>
                <p className="text-xl font-bold">
                  {(() => {
                    const bestDay = initialDailySales30.reduce((max, day) =>
                      day.revenue > max.revenue ? day : max
                    , initialDailySales30[0] || { date: '-', revenue: 0 })
                    return bestDay.date !== '-'
                      ? new Date(bestDay.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                      : '-'
                  })()}
                </p>
                <p className="text-emerald-100 text-xs">
                  {formatPrice(initialDailySales30.reduce((max, day) =>
                    day.revenue > max.revenue ? day : max
                  , initialDailySales30[0] || { revenue: 0 }).revenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Promedio diario (30d)</p>
                <p className="text-xl font-bold">
                  {formatPrice(
                    initialDailySales30.reduce((sum, day) => sum + day.revenue, 0) / 30
                  )}
                </p>
                <p className="text-blue-100 text-xs">
                  {(initialDailySales30.reduce((sum, day) => sum + day.orders, 0) / 30).toFixed(1)} pedidos/día
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-purple-100 text-sm">Valor de vida del cliente</p>
                <p className="text-xl font-bold">
                  {formatPrice(
                    initialStats.totalCustomers > 0
                      ? initialStats.totalRevenue / initialStats.totalCustomers
                      : 0
                  )}
                </p>
                <p className="text-purple-100 text-xs">Promedio por cliente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
