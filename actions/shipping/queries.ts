'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ShippingCost } from '@/types/database'

export interface ShippingCalculation {
  cost: number
  isFreeShipping: boolean
  estimatedDaysMin: number
  estimatedDaysMax: number
  department: string
}

/**
 * Obtiene todos los costos de envío por departamento
 */
export async function getShippingCosts(onlyActive: boolean = false): Promise<ShippingCost[]> {
  const supabase = await createClient()

  let query = supabase
    .from('shipping_costs')
    .select('*')
    .order('department', { ascending: true })

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching shipping costs:', error)
    // Retornar array vacío si la tabla no existe
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw new Error('Error al obtener costos de envío')
  }

  return data as ShippingCost[]
}

/**
 * Obtiene el costo de envío para un departamento específico
 */
export async function getShippingCostByDepartment(department: string): Promise<ShippingCost | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shipping_costs')
    .select('*')
    .eq('department', department)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching shipping cost:', error)
    return null
  }

  return data as ShippingCost
}

/**
 * Calcula el costo de envío final para un departamento y subtotal
 * @param department - Nombre del departamento
 * @param subtotal - Subtotal del pedido
 * @returns Cálculo del envío incluyendo si es gratis
 */
export async function calculateShipping(
  department: string,
  subtotal: number
): Promise<ShippingCalculation | null> {
  const shippingCost = await getShippingCostByDepartment(department)

  if (!shippingCost) {
    return null
  }

  // Verificar si aplica envío gratis
  const isFreeShipping =
    shippingCost.free_shipping_threshold !== null &&
    subtotal >= shippingCost.free_shipping_threshold

  return {
    cost: isFreeShipping ? 0 : shippingCost.cost,
    isFreeShipping,
    estimatedDaysMin: shippingCost.estimated_days_min,
    estimatedDaysMax: shippingCost.estimated_days_max,
    department: shippingCost.department,
  }
}

/**
 * Versión del servidor para calcular shipping (usado en processCheckout)
 * Usa el admin client para evitar problemas de autenticación
 */
export async function calculateShippingServer(
  department: string,
  subtotal: number
): Promise<ShippingCalculation | null> {
  const supabase = createAdminClient()

  const { data: shippingCost, error } = await supabase
    .from('shipping_costs')
    .select('*')
    .eq('department', department)
    .eq('is_active', true)
    .single()

  if (error || !shippingCost) {
    console.error('Error calculating shipping (server):', error)
    return null
  }

  const isFreeShipping =
    shippingCost.free_shipping_threshold !== null &&
    subtotal >= shippingCost.free_shipping_threshold

  return {
    cost: isFreeShipping ? 0 : shippingCost.cost,
    isFreeShipping,
    estimatedDaysMin: shippingCost.estimated_days_min,
    estimatedDaysMax: shippingCost.estimated_days_max,
    department: shippingCost.department,
  }
}

/**
 * Obtiene el umbral de envío gratis más bajo entre todos los departamentos activos
 */
export async function getLowestFreeShippingThreshold(): Promise<number | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shipping_costs')
    .select('free_shipping_threshold')
    .eq('is_active', true)
    .not('free_shipping_threshold', 'is', null)
    .order('free_shipping_threshold', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data.free_shipping_threshold
}
