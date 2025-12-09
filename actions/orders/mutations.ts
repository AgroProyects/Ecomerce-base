'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createOrderSchema,
  updateOrderStatusSchema,
  uploadPaymentProofSchema,
  updateOrderNotesSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type UploadPaymentProofInput,
  type UpdateOrderNotesInput,
} from '@/schemas/order.schema'
import type { ApiResponse } from '@/types/api'
import type { Order } from '@/types/database'

export async function createOrder(
  input: CreateOrderInput
): Promise<ApiResponse<Order>> {
  try {
    const validationResult = createOrderSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    const supabase = createAdminClient()

    // Generar número de orden
    const { data: orderNumberData } = await supabase
      .rpc('generate_order_number')

    const orderNumber = orderNumberData || `ORD-${Date.now()}`

    // Calcular totales
    const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0)
    const total = subtotal + data.shipping_cost - data.discount_amount

    // Determinar estado inicial según método de pago
    let initialStatus: 'pending' | 'pending_payment' = 'pending'
    if (data.payment_method === 'bank_transfer') {
      initialStatus = 'pending_payment'
    } else if (data.payment_method === 'cash_on_delivery') {
      initialStatus = 'pending'
    }

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: initialStatus,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        shipping_address: data.shipping_address,
        billing_address: data.billing_address,
        subtotal,
        shipping_cost: data.shipping_cost,
        discount_amount: data.discount_amount,
        total,
        notes: data.notes,
        payment_method: data.payment_method,
        payment_proof_url: data.payment_proof_url,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return {
        success: false,
        error: 'Error al crear la orden',
      }
    }

    // Crear items de la orden
    const orderItems = data.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Eliminar la orden si falla crear los items
      await supabase.from('orders').delete().eq('id', order.id)
      return {
        success: false,
        error: 'Error al crear los items de la orden',
      }
    }

    // Decrementar stock de productos/variantes
    for (const item of data.items) {
      if (item.variant_id) {
        await supabase.rpc('decrement_variant_stock', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
        })
      } else {
        await supabase.rpc('decrement_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      }
    }

    revalidatePath('/admin/orders')

    return {
      success: true,
      data: order as Order,
      message: 'Orden creada exitosamente',
    }
  } catch (error) {
    console.error('Error in createOrder:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<ApiResponse<Order>> {
  try {
    const validationResult = updateOrderStatusSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, status, notes } = validationResult.data

    const supabase = createAdminClient()

    // Verificar que la orden exista
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!existingOrder) {
      return {
        success: false,
        error: 'Orden no encontrada',
      }
    }

    // Actualizar el estado
    const updateData: Record<string, unknown> = { status }

    if (notes) {
      updateData.notes = notes
    }

    if (status === 'paid' && existingOrder.status !== 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order status:', error)
      return {
        success: false,
        error: 'Error al actualizar el estado de la orden',
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)

    return {
      success: true,
      data: order as Order,
      message: 'Estado de orden actualizado',
    }
  } catch (error) {
    console.error('Error in updateOrderStatus:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function cancelOrder(id: string): Promise<ApiResponse<Order>> {
  return updateOrderStatus({ id, status: 'cancelled' })
}

export async function markOrderAsPaid(id: string): Promise<ApiResponse<Order>> {
  return updateOrderStatus({ id, status: 'paid' })
}

export async function markOrderAsShipped(id: string): Promise<ApiResponse<Order>> {
  return updateOrderStatus({ id, status: 'shipped' })
}

export async function markOrderAsDelivered(id: string): Promise<ApiResponse<Order>> {
  return updateOrderStatus({ id, status: 'delivered' })
}

/**
 * Subir comprobante de pago para una orden
 */
export async function uploadPaymentProof(
  input: UploadPaymentProofInput
): Promise<ApiResponse<Order>> {
  try {
    const validationResult = uploadPaymentProofSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { order_id, payment_proof_url } = validationResult.data

    const supabase = createAdminClient()

    // Verificar que la orden exista
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, payment_method')
      .eq('id', order_id)
      .single()

    if (!existingOrder) {
      return {
        success: false,
        error: 'Orden no encontrada',
      }
    }

    // Actualizar comprobante de pago
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_proof_url,
        // Si estaba en pending_payment, mantener ese estado
        // El admin deberá verificar y cambiar a 'paid' manualmente
      })
      .eq('id', order_id)
      .select()
      .single()

    if (error) {
      console.error('Error uploading payment proof:', error)
      return {
        success: false,
        error: 'Error al subir el comprobante de pago',
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${order_id}`)

    return {
      success: true,
      data: order as Order,
      message: 'Comprobante de pago subido exitosamente',
    }
  } catch (error) {
    console.error('Error in uploadPaymentProof:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Actualizar notas administrativas de una orden
 */
export async function updateOrderNotes(
  input: UpdateOrderNotesInput
): Promise<ApiResponse<Order>> {
  try {
    const validationResult = updateOrderNotesSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, notes } = validationResult.data

    const supabase = createAdminClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ admin_notes: notes })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order notes:', error)
      return {
        success: false,
        error: 'Error al actualizar las notas',
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${id}`)

    return {
      success: true,
      data: order as Order,
      message: 'Notas actualizadas exitosamente',
    }
  } catch (error) {
    console.error('Error in updateOrderNotes:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
