/**
 * Sistema de Reservas de Stock
 * Previene overselling durante el proceso de checkout
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface StockReservation {
  id: string
  product_id: string | null
  variant_id: string | null
  quantity: number
  user_id: string | null
  session_id: string | null
  status: 'active' | 'completed' | 'expired' | 'cancelled'
  order_id: string | null
  expires_at: string
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface ReservationParams {
  productId?: string
  variantId?: string
  quantity: number
  userId?: string
  sessionId?: string
  expiresInMinutes?: number
}

/**
 * Obtiene stock disponible para un producto/variante
 * (stock total - reservas activas)
 */
export async function getAvailableStock(params: {
  productId?: string
  variantId?: string
}): Promise<number> {
  const { productId, variantId } = params

  if (!productId && !variantId) {
    throw new Error('Debe proporcionar productId o variantId')
  }

  if (productId && variantId) {
    throw new Error('Solo puede proporcionar productId O variantId, no ambos')
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_available_stock', {
    p_product_id: productId || null,
    p_variant_id: variantId || null,
  })

  if (error) {
    console.error('Error getting available stock:', error)
    throw new Error('Error al obtener stock disponible')
  }

  return data as number
}

/**
 * Crea una reserva de stock
 * Retorna el ID de la reserva creada
 */
export async function reserveStock(params: ReservationParams): Promise<string> {
  const {
    productId,
    variantId,
    quantity,
    userId,
    sessionId,
    expiresInMinutes = 15,
  } = params

  if (!productId && !variantId) {
    throw new Error('Debe proporcionar productId o variantId')
  }

  if (!userId && !sessionId) {
    throw new Error('Debe proporcionar userId o sessionId')
  }

  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('reserve_stock', {
    p_product_id: productId || null,
    p_variant_id: variantId || null,
    p_quantity: quantity,
    p_user_id: userId || null,
    p_session_id: sessionId || null,
    p_expires_in_minutes: expiresInMinutes,
  })

  if (error) {
    console.error('Error reserving stock:', error)

    // Error de stock insuficiente
    if (error.message.includes('Stock insuficiente')) {
      throw new Error(error.message)
    }

    throw new Error('Error al reservar stock')
  }

  console.log(`✓ Stock reserved: ${quantity} units (Reservation ID: ${data})`)

  return data as string
}

/**
 * Libera una reserva (cancelación o cambio de cantidad)
 */
export async function releaseReservation(
  reservationId: string,
  reason: 'cancelled' | 'expired' = 'cancelled'
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('release_reservation', {
    p_reservation_id: reservationId,
    p_reason: reason,
  })

  if (error) {
    console.error('Error releasing reservation:', error)
    throw new Error('Error al liberar reserva')
  }

  console.log(`✓ Reservation released: ${reservationId} (reason: ${reason})`)

  return data as boolean
}

/**
 * Completa una reserva (asociándola a una orden)
 * Decrementa el stock real del producto/variante
 */
export async function completeReservation(
  reservationId: string,
  orderId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('complete_reservation', {
    p_reservation_id: reservationId,
    p_order_id: orderId,
  })

  if (error) {
    console.error('Error completing reservation:', error)
    throw new Error('Error al completar reserva')
  }

  console.log(`✓ Reservation completed: ${reservationId} -> Order ${orderId}`)

  return data as boolean
}

/**
 * Limpia reservas expiradas
 * Retorna el número de reservas liberadas
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('cleanup_expired_reservations')

  if (error) {
    console.error('Error cleaning up expired reservations:', error)
    throw new Error('Error al limpiar reservas expiradas')
  }

  const count = data as number

  if (count > 0) {
    console.log(`✓ Cleaned up ${count} expired reservations`)
  }

  return count
}

/**
 * Obtiene reservas activas para un usuario/sesión
 */
export async function getUserReservations(params: {
  userId?: string
  sessionId?: string
}): Promise<StockReservation[]> {
  const { userId, sessionId } = params

  if (!userId && !sessionId) {
    throw new Error('Debe proporcionar userId o sessionId')
  }

  const supabase = createAdminClient()

  let query = supabase
    .from('stock_reservations')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  } else if (sessionId) {
    query = query.eq('session_id', sessionId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting user reservations:', error)
    throw new Error('Error al obtener reservas')
  }

  return data as StockReservation[]
}

/**
 * Obtiene todas las reservas activas (admin)
 */
export async function getAllActiveReservations(): Promise<StockReservation[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('active_reservations')
    .select('*')
    .order('expires_at', { ascending: true })

  if (error) {
    console.error('Error getting active reservations:', error)
    throw new Error('Error al obtener reservas activas')
  }

  return data as StockReservation[]
}

/**
 * Reserva stock para múltiples items (carrito)
 * Retorna un array de reservation IDs
 */
export async function reserveCartStock(params: {
  items: Array<{
    productId?: string
    variantId?: string
    quantity: number
  }>
  userId?: string
  sessionId?: string
  expiresInMinutes?: number
}): Promise<string[]> {
  const { items, userId, sessionId, expiresInMinutes = 15 } = params

  const reservationIds: string[] = []
  const errors: Error[] = []

  try {
    // Reservar stock para cada item
    for (const item of items) {
      try {
        const reservationId = await reserveStock({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          userId,
          sessionId,
          expiresInMinutes,
        })
        reservationIds.push(reservationId)
      } catch (error) {
        errors.push(error as Error)
        // Si falla una reserva, liberar todas las anteriores
        await rollbackReservations(reservationIds)
        throw error
      }
    }

    return reservationIds
  } catch (error) {
    console.error('Error reserving cart stock:', error)
    throw error
  }
}

/**
 * Libera múltiples reservas (rollback)
 */
async function rollbackReservations(reservationIds: string[]): Promise<void> {
  console.log(`⚠ Rolling back ${reservationIds.length} reservations...`)

  for (const reservationId of reservationIds) {
    try {
      await releaseReservation(reservationId, 'cancelled')
    } catch (error) {
      console.error(`Error rolling back reservation ${reservationId}:`, error)
      // Continuar con las demás liberaciones
    }
  }
}

/**
 * Completa múltiples reservas (después de crear orden)
 */
export async function completeCartReservations(
  reservationIds: string[],
  orderId: string
): Promise<void> {
  for (const reservationId of reservationIds) {
    try {
      await completeReservation(reservationId, orderId)
    } catch (error) {
      console.error(`Error completing reservation ${reservationId}:`, error)
      throw error
    }
  }
}

/**
 * Verifica si hay stock suficiente antes de reservar
 * (validación previa, útil para mostrar mensajes al usuario)
 */
export async function checkStockAvailability(items: Array<{
  productId?: string
  variantId?: string
  quantity: number
}>): Promise<{
  available: boolean
  unavailableItems: Array<{
    productId?: string
    variantId?: string
    requested: number
    available: number
  }>
}> {
  const unavailableItems = []

  for (const item of items) {
    const availableStock = await getAvailableStock({
      productId: item.productId,
      variantId: item.variantId,
    })

    if (availableStock < item.quantity) {
      unavailableItems.push({
        productId: item.productId,
        variantId: item.variantId,
        requested: item.quantity,
        available: availableStock,
      })
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  }
}
