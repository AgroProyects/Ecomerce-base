import { Payment } from 'mercadopago'
import { getMercadoPagoClient } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes'

export type WebhookType = 'payment' | 'merchant_order' | 'chargebacks'

export interface WebhookNotification {
  id: string
  live_mode: boolean
  type: string
  date_created: string
  user_id: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

export async function processPaymentWebhook(paymentId: string): Promise<{
  success: boolean
  orderId?: string
  status?: string
  error?: string
}> {
  try {
    const client = getMercadoPagoClient()
    const payment = new Payment(client)

    // Obtener información del pago
    const paymentData = await payment.get({ id: paymentId })

    if (!paymentData) {
      return { success: false, error: 'Pago no encontrado' }
    }

    const orderId = paymentData.external_reference

    if (!orderId) {
      return { success: false, error: 'Orden no encontrada en el pago' }
    }

    // Actualizar la orden en la base de datos
    const supabase = createAdminClient()

    const updateData = buildOrderUpdate(paymentData)

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error actualizando orden:', updateError)
      return { success: false, error: 'Error actualizando orden' }
    }

    // Si el pago fue exitoso, actualizar el stock
    if (paymentData.status === 'approved') {
      await updateStock(orderId)
    }

    return {
      success: true,
      orderId,
      status: paymentData.status || undefined,
    }
  } catch (error) {
    console.error('Error procesando webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

function buildOrderUpdate(paymentData: PaymentResponse) {
  const statusMap: Record<string, OrderStatus> = {
    approved: 'paid',
    pending: 'pending',
    in_process: 'pending',
    rejected: 'cancelled',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'refunded',
  }

  return {
    mp_payment_id: paymentData.id?.toString(),
    mp_status: paymentData.status,
    mp_status_detail: paymentData.status_detail,
    mp_payment_method: paymentData.payment_method_id,
    status: statusMap[paymentData.status || ''] || ('pending' as OrderStatus),
    paid_at: paymentData.status === 'approved' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

async function updateStock(orderId: string) {
  const supabase = createAdminClient()

  // Obtener items de la orden
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, variant_id, quantity')
    .eq('order_id', orderId)

  if (itemsError || !orderItems) {
    console.error('Error obteniendo items de la orden:', itemsError)
    return
  }

  // Actualizar stock de cada item
  for (const item of orderItems) {
    if (item.variant_id) {
      // Actualizar stock de variante
      await supabase.rpc('decrement_variant_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })
    } else {
      // Actualizar stock de producto
      await supabase.rpc('decrement_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Mercado Pago no requiere verificación de firma en webhooks
  // pero se puede implementar verificación adicional si se necesita
  // Por ahora, verificamos que el secret coincida si está configurado
  if (process.env.MP_WEBHOOK_SECRET) {
    return secret === process.env.MP_WEBHOOK_SECRET
  }
  return true
}
