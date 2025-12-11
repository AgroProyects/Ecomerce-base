'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiResponse } from '@/types/api'
import type { ShippingCost } from '@/types/database'

export interface UpdateShippingCostInput {
  id: string
  cost?: number
  free_shipping_threshold?: number | null
  estimated_days_min?: number
  estimated_days_max?: number
  is_active?: boolean
}

export interface BulkUpdateShippingCostInput {
  id: string
  cost: number
  free_shipping_threshold: number | null
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
}

/**
 * Actualiza el costo de envío de un departamento
 */
export async function updateShippingCost(
  input: UpdateShippingCostInput
): Promise<ApiResponse<ShippingCost>> {
  try {
    const { id, ...data } = input

    if (!id) {
      return {
        success: false,
        error: 'ID requerido',
      }
    }

    // Validaciones
    if (data.cost !== undefined && data.cost < 0) {
      return {
        success: false,
        error: 'El costo no puede ser negativo',
      }
    }

    if (data.free_shipping_threshold !== undefined &&
        data.free_shipping_threshold !== null &&
        data.free_shipping_threshold < 0) {
      return {
        success: false,
        error: 'El umbral de envío gratis no puede ser negativo',
      }
    }

    if (data.estimated_days_min !== undefined && data.estimated_days_min < 0) {
      return {
        success: false,
        error: 'Los días estimados no pueden ser negativos',
      }
    }

    if (data.estimated_days_max !== undefined && data.estimated_days_max < 0) {
      return {
        success: false,
        error: 'Los días estimados no pueden ser negativos',
      }
    }

    if (data.estimated_days_min !== undefined &&
        data.estimated_days_max !== undefined &&
        data.estimated_days_min > data.estimated_days_max) {
      return {
        success: false,
        error: 'Los días mínimos no pueden ser mayores a los máximos',
      }
    }

    const supabase = createAdminClient()

    const { data: shippingCost, error } = await supabase
      .from('shipping_costs')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping cost:', error)
      return {
        success: false,
        error: 'Error al actualizar el costo de envío',
      }
    }

    revalidatePath('/admin/shipping')
    revalidatePath('/checkout')

    return {
      success: true,
      data: shippingCost as ShippingCost,
      message: 'Costo de envío actualizado',
    }
  } catch (error) {
    console.error('Error in updateShippingCost:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Actualiza múltiples costos de envío a la vez
 */
export async function bulkUpdateShippingCosts(
  costs: BulkUpdateShippingCostInput[]
): Promise<ApiResponse<ShippingCost[]>> {
  try {
    if (!costs || costs.length === 0) {
      return {
        success: false,
        error: 'No se proporcionaron costos para actualizar',
      }
    }

    // Validar cada costo
    for (const cost of costs) {
      if (cost.cost < 0) {
        return {
          success: false,
          error: `Costo negativo no permitido`,
        }
      }
      if (cost.free_shipping_threshold !== null && cost.free_shipping_threshold < 0) {
        return {
          success: false,
          error: `Umbral de envío gratis negativo no permitido`,
        }
      }
      if (cost.estimated_days_min > cost.estimated_days_max) {
        return {
          success: false,
          error: `Días mínimos mayores a máximos no permitido`,
        }
      }
    }

    const supabase = createAdminClient()
    const updatedCosts: ShippingCost[] = []

    // Actualizar cada costo individualmente
    for (const cost of costs) {
      const { id, ...data } = cost
      const { data: updated, error } = await supabase
        .from('shipping_costs')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating shipping cost:', error)
        return {
          success: false,
          error: `Error al actualizar costo de envío`,
        }
      }

      updatedCosts.push(updated as ShippingCost)
    }

    revalidatePath('/admin/shipping')
    revalidatePath('/checkout')

    return {
      success: true,
      data: updatedCosts,
      message: `${updatedCosts.length} costos de envío actualizados`,
    }
  } catch (error) {
    console.error('Error in bulkUpdateShippingCosts:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Establece el umbral de envío gratis global para todos los departamentos
 */
export async function setGlobalFreeShippingThreshold(
  threshold: number | null
): Promise<ApiResponse<void>> {
  try {
    if (threshold !== null && threshold < 0) {
      return {
        success: false,
        error: 'El umbral no puede ser negativo',
      }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('shipping_costs')
      .update({ free_shipping_threshold: threshold })
      .neq('id', '')  // Actualiza todos los registros

    if (error) {
      console.error('Error setting global free shipping threshold:', error)
      return {
        success: false,
        error: 'Error al establecer el umbral de envío gratis',
      }
    }

    revalidatePath('/admin/shipping')
    revalidatePath('/checkout')

    return {
      success: true,
      message: threshold !== null
        ? `Envío gratis configurado para compras mayores a $${threshold}`
        : 'Envío gratis desactivado',
    }
  } catch (error) {
    console.error('Error in setGlobalFreeShippingThreshold:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
