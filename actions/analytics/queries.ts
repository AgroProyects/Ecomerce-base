'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface DailySales {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  product_image: string | null
  total_quantity: number
  total_revenue: number
}

export interface OrdersByStatus {
  status: string
  count: number
  percentage: number
}

export interface RevenueMetrics {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  percentageChange: {
    daily: number
    weekly: number
    monthly: number
  }
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  todayOrders: number
  todayRevenue: number
  averageOrderValue: number
  pendingOrders: number
  processingOrders: number
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
}

// Obtener ventas por día de los últimos N días
export async function getDailySales(days: number = 30): Promise<DailySales[]> {
  const supabase = createAdminClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, status')
    .gte('created_at', startDate.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching daily sales:', error)
    return []
  }

  // Agrupar por día
  const salesByDay = new Map<string, { revenue: number; orders: number }>()

  // Inicializar todos los días con 0
  for (let i = 0; i <= days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    const dateStr = date.toISOString().split('T')[0]
    salesByDay.set(dateStr, { revenue: 0, orders: 0 })
  }

  // Llenar con datos reales
  data?.forEach((order) => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0]
    const existing = salesByDay.get(dateStr) || { revenue: 0, orders: 0 }
    salesByDay.set(dateStr, {
      revenue: existing.revenue + order.total,
      orders: existing.orders + 1,
    })
  })

  return Array.from(salesByDay.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}

// Obtener productos más vendidos
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const supabase = createAdminClient()

  // Obtener items de órdenes pagadas
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price,
      orders!inner (status)
    `)
    .in('orders.status', ['paid', 'processing', 'shipped', 'delivered'])

  if (error) {
    console.error('Error fetching top products:', error)
    return []
  }

  // Agrupar por producto
  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >()

  orderItems?.forEach((item: any) => {
    const existing = productMap.get(item.product_id) || {
      name: item.product_name,
      quantity: 0,
      revenue: 0,
    }
    productMap.set(item.product_id, {
      name: item.product_name,
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total_price,
    })
  })

  // Obtener imágenes de los productos
  const productIds = Array.from(productMap.keys())
  const { data: products } = await supabase
    .from('products')
    .select('id, images')
    .in('id', productIds)

  const productImages = new Map(
    products?.map((p) => [p.id, p.images?.[0] || null]) || []
  )

  // Ordenar y limitar
  return Array.from(productMap.entries())
    .map(([id, data]) => ({
      product_id: id,
      product_name: data.name,
      product_image: productImages.get(id) || null,
      total_quantity: data.quantity,
      total_revenue: data.revenue,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit)
}

// Obtener métricas de ingresos con comparaciones
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = createAdminClient()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const startOfWeek = new Date(today)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  // Obtener todas las órdenes del último mes para calcular métricas
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, total, status')
    .gte('created_at', startOfLastMonth.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  // Calcular métricas
  let todayRevenue = 0
  let yesterdayRevenue = 0
  let thisWeekRevenue = 0
  let lastWeekRevenue = 0
  let thisMonthRevenue = 0
  let lastMonthRevenue = 0

  orders?.forEach((order) => {
    const orderDate = new Date(order.created_at)
    const revenue = order.total

    // Hoy
    if (orderDate >= today) {
      todayRevenue += revenue
    }

    // Ayer
    if (orderDate >= yesterday && orderDate < today) {
      yesterdayRevenue += revenue
    }

    // Esta semana
    if (orderDate >= startOfWeek) {
      thisWeekRevenue += revenue
    }

    // Semana pasada
    if (orderDate >= startOfLastWeek && orderDate < startOfWeek) {
      lastWeekRevenue += revenue
    }

    // Este mes
    if (orderDate >= startOfMonth) {
      thisMonthRevenue += revenue
    }

    // Mes pasado
    if (orderDate >= startOfLastMonth && orderDate < startOfMonth) {
      lastMonthRevenue += revenue
    }
  })

  // Calcular porcentajes de cambio
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    today: todayRevenue,
    yesterday: yesterdayRevenue,
    thisWeek: thisWeekRevenue,
    lastWeek: lastWeekRevenue,
    thisMonth: thisMonthRevenue,
    lastMonth: lastMonthRevenue,
    percentageChange: {
      daily: calculateChange(todayRevenue, yesterdayRevenue),
      weekly: calculateChange(thisWeekRevenue, lastWeekRevenue),
      monthly: calculateChange(thisMonthRevenue, lastMonthRevenue),
    },
  }
}

// Obtener estadísticas completas del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Ejecutar todas las queries en paralelo
  const [
    ordersResult,
    todayOrdersResult,
    productsResult,
    lowStockResult,
    customersResult,
  ] = await Promise.all([
    // Todas las órdenes
    supabase
      .from('orders')
      .select('total, status')
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),

    // Órdenes de hoy
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', today.toISOString()),

    // Total de productos
    supabase.from('products').select('id', { count: 'exact', head: true }),

    // Productos con bajo stock
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('track_inventory', true)
      .lt('stock', 10)
      .gt('stock', 0),

    // Total de clientes únicos
    supabase.from('orders').select('customer_email'),
  ])

  const orders = ordersResult.data || []
  const todayOrders = todayOrdersResult.data || []

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const todayRevenue = todayOrders
    .filter((o) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0)

  const pendingOrders =
    (todayOrdersResult.data?.filter((o) => o.status === 'pending').length || 0) +
    (ordersResult.data?.filter((o) => o.status === 'pending').length || 0)

  const processingOrders = orders.filter((o) => o.status === 'processing').length

  const uniqueCustomers = new Set(
    customersResult.data?.map((o) => o.customer_email) || []
  ).size

  return {
    totalRevenue,
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    todayRevenue,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    pendingOrders,
    processingOrders,
    totalProducts: productsResult.count || 0,
    lowStockProducts: lowStockResult.count || 0,
    totalCustomers: uniqueCustomers,
  }
}

// Obtener órdenes por estado con porcentajes
export async function getOrdersByStatus(): Promise<OrdersByStatus[]> {
  const supabase = createAdminClient()

  const { data } = await supabase.from('orders').select('status')

  if (!data || data.length === 0) {
    return []
  }

  const statusCounts = new Map<string, number>()
  data.forEach((order) => {
    statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1)
  })

  const total = data.length

  return Array.from(statusCounts.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
}

// Obtener ventas por hora del día (para el día actual)
export async function getSalesByHour(): Promise<{ hour: number; orders: number; revenue: number }[]> {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('orders')
    .select('created_at, total')
    .gte('created_at', today.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  // Inicializar todas las horas
  const hourlyData = new Map<number, { orders: number; revenue: number }>()
  for (let i = 0; i < 24; i++) {
    hourlyData.set(i, { orders: 0, revenue: 0 })
  }

  data?.forEach((order) => {
    const hour = new Date(order.created_at).getHours()
    const existing = hourlyData.get(hour)!
    hourlyData.set(hour, {
      orders: existing.orders + 1,
      revenue: existing.revenue + order.total,
    })
  })

  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    hour,
    ...data,
  }))
}

// Obtener resumen de categorías
export async function getCategorySales(): Promise<{
  category_name: string
  total_revenue: number
  total_orders: number
}[]> {
  const supabase = createAdminClient()

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      total_price,
      products!inner (
        category_id,
        categories (name)
      ),
      orders!inner (status)
    `)
    .in('orders.status', ['paid', 'processing', 'shipped', 'delivered'])

  if (!orderItems) return []

  const categoryMap = new Map<string, { revenue: number; orders: Set<string> }>()

  orderItems.forEach((item: any) => {
    const categoryName = item.products?.categories?.name || 'Sin categoría'
    const existing = categoryMap.get(categoryName) || {
      revenue: 0,
      orders: new Set<string>(),
    }
    existing.revenue += item.total_price
    categoryMap.set(categoryName, existing)
  })

  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      category_name: name,
      total_revenue: data.revenue,
      total_orders: data.orders.size,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
}

// Tipo para rangos de fecha
export type DateRangeType = '7days' | '30days' | '90days' | 'year' | 'all'

// Función auxiliar para obtener la fecha de inicio según el rango
function getStartDateForRange(range: DateRangeType): Date | null {
  const now = new Date()

  switch (range) {
    case '7days':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return sevenDaysAgo
    case '30days':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return thirtyDaysAgo
    case '90days':
      const ninetyDaysAgo = new Date(now)
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      return ninetyDaysAgo
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    case 'all':
      return null
  }
}

// Función auxiliar para obtener el nombre del período
function getPeriodLabel(range: DateRangeType): string {
  switch (range) {
    case '7days':
      return 'Últimos 7 días'
    case '30days':
      return 'Últimos 30 días'
    case '90days':
      return 'Últimos 90 días'
    case 'year':
      return `Año ${new Date().getFullYear()}`
    case 'all':
      return 'Todo el tiempo'
  }
}

// Obtener datos de analíticas filtrados para exportación
export interface AnalyticsExportData {
  dailySales: {
    date: string
    revenue: number
    orders: number
  }[]
  topProducts: {
    product_name: string
    total_quantity: number
    total_revenue: number
  }[]
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    period: string
  }
}

export async function getAnalyticsForExport(range: DateRangeType): Promise<AnalyticsExportData> {
  const supabase = createAdminClient()
  const startDate = getStartDateForRange(range)

  // Query base para órdenes
  let ordersQuery = supabase
    .from('orders')
    .select('created_at, total, status')
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: true })

  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate.toISOString())
  }

  const { data: orders } = await ordersQuery

  // Query para items de órdenes (para top productos)
  let orderItemsQuery = supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price,
      orders!inner (status, created_at)
    `)
    .in('orders.status', ['paid', 'processing', 'shipped', 'delivered'])

  if (startDate) {
    orderItemsQuery = orderItemsQuery.gte('orders.created_at', startDate.toISOString())
  }

  const { data: orderItems } = await orderItemsQuery

  // Procesar ventas diarias
  const salesByDay = new Map<string, { revenue: number; orders: number }>()

  // Calcular número de días para inicializar el mapa
  const daysToShow = range === '7days' ? 7 : range === '30days' ? 30 : range === '90days' ? 90 : 365

  if (range !== 'all') {
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      salesByDay.set(dateStr, { revenue: 0, orders: 0 })
    }
  }

  orders?.forEach((order) => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0]
    const existing = salesByDay.get(dateStr) || { revenue: 0, orders: 0 }
    salesByDay.set(dateStr, {
      revenue: existing.revenue + order.total,
      orders: existing.orders + 1,
    })
  })

  // Procesar productos más vendidos
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

  orderItems?.forEach((item: any) => {
    const existing = productMap.get(item.product_id) || {
      name: item.product_name,
      quantity: 0,
      revenue: 0,
    }
    productMap.set(item.product_id, {
      name: item.product_name,
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total_price,
    })
  })

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)
    .map((p) => ({
      product_name: p.name,
      total_quantity: p.quantity,
      total_revenue: p.revenue,
    }))

  // Calcular resumen
  const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0
  const totalOrders = orders?.length || 0

  return {
    dailySales: Array.from(salesByDay.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    topProducts,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      period: getPeriodLabel(range),
    },
  }
}
