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
    minAmount,
    maxAmount,
    paymentMethod,
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
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
    )
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    // Agregar un día para incluir todo el día de endDate
    const endDateObj = new Date(endDate)
    endDateObj.setDate(endDateObj.getDate() + 1)
    query = query.lt('created_at', endDateObj.toISOString())
  }

  if (minAmount !== undefined && minAmount > 0) {
    query = query.gte('total', minAmount)
  }

  if (maxAmount !== undefined && maxAmount > 0) {
    query = query.lte('total', maxAmount)
  }

  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod)
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

export interface OrderItemWithProduct extends OrderItem {
  product_image: string | null
  product_slug: string | null
}

export async function getOrderItems(orderId: string): Promise<OrderItemWithProduct[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      products:product_id (
        images,
        slug
      )
    `)
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching order items:', error)
    throw new Error('Error al obtener items de la orden')
  }

  // Transformar los datos para incluir la imagen del producto
  const itemsWithImages = data.map((item: any) => ({
    ...item,
    product_image: item.products?.images?.[0] || null,
    product_slug: item.products?.slug || null,
    products: undefined, // Remover el objeto products anidado
  }))

  return itemsWithImages as OrderItemWithProduct[]
}

export async function getOrderWithItems(id: string): Promise<{
  order: Order
  items: OrderItemWithProduct[]
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
