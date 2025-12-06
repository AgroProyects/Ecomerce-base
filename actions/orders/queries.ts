'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Order, OrderItem } from '@/types/database'
import type { OrdersQueryParams, PaginatedResponse } from '@/types/api'
import { PAGINATION } from '@/lib/constants/config'

export async function getOrders(
  params: OrdersQueryParams = {}
): Promise<PaginatedResponse<Order>> {
  const supabase = createAdminClient()

  const {
    page = 1,
    pageSize = PAGINATION.ADMIN_PAGE_SIZE,
    status,
    search,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
    )
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    throw new Error('Error al obtener órdenes')
  }

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    data: data as Order[],
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching order:', error)
    throw new Error('Error al obtener la orden')
  }

  return data as Order
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching order:', error)
    throw new Error('Error al obtener la orden')
  }

  return data as Order
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching order items:', error)
    throw new Error('Error al obtener items de la orden')
  }

  return data as OrderItem[]
}

export async function getOrderWithItems(id: string): Promise<{
  order: Order
  items: OrderItem[]
} | null> {
  const order = await getOrderById(id)

  if (!order) {
    return null
  }

  const items = await getOrderItems(id)

  return { order, items }
}

export async function getRecentOrders(limit: number = 5): Promise<Order[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent orders:', error)
    throw new Error('Error al obtener órdenes recientes')
  }

  return data as Order[]
}

export async function getOrderStats() {
  const supabase = createAdminClient()

  // Total de órdenes por estado
  const { data: statusCounts } = await supabase
    .from('orders')
    .select('status')

  // Total de ventas (órdenes pagadas)
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'paid')

  // Órdenes de hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Calcular estadísticas
  const statusMap: Record<string, number> = {}
  statusCounts?.forEach((order) => {
    statusMap[order.status] = (statusMap[order.status] || 0) + 1
  })

  const totalRevenue = paidOrders?.reduce((sum, order) => sum + order.total, 0) || 0

  return {
    totalOrders: statusCounts?.length || 0,
    todayOrders: todayCount || 0,
    totalRevenue,
    byStatus: statusMap,
  }
}
