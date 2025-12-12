import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/mercadopago/checkout-api'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Endpoint para procesar pagos con Checkout API de Mercado Pago
 * POST /api/mercadopago/process-payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      orderId,
      token,
      installments,
      paymentMethodId,
      issuerId,
    } = body

    console.log('=== Procesando pago con Checkout API ===')
    console.log('Order ID:', orderId)
    console.log('Payment Method:', paymentMethodId)
    console.log('Installments:', installments)

    // Validar datos requeridos
    if (!orderId || !token || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: orderId, token, paymentMethodId' },
        { status: 400 }
      )
    }

    // Obtener la orden de la base de datos
    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Error al obtener orden:', orderError)
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    console.log('Orden encontrada:', order.order_number)
    console.log('Total a pagar:', order.total)

    // Crear el pago en Mercado Pago
    const paymentResult = await createPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.shipping_address,
        paymentMethod: 'mercadopago',
      },
      token,
      installments: installments || 1,
      paymentMethodId,
      issuerId,
    })

    console.log('Pago creado:', paymentResult.id)
    console.log('Estado:', paymentResult.status)

    // Actualizar la orden con el ID del pago
    const orderUpdate: {
      mp_payment_id?: number
      status?: string
      payment_status?: string
    } = {
      mp_payment_id: paymentResult.id,
    }

    // Actualizar estado según el resultado
    if (paymentResult.status === 'approved') {
      orderUpdate.status = 'paid'
      orderUpdate.payment_status = 'approved'
      console.log('✓ Pago aprobado')
    } else if (paymentResult.status === 'pending' || paymentResult.status === 'in_process') {
      orderUpdate.status = 'pending_payment'
      orderUpdate.payment_status = paymentResult.status
      console.log('⏳ Pago pendiente')
    } else {
      orderUpdate.status = 'cancelled'
      orderUpdate.payment_status = paymentResult.status
      console.log('✗ Pago rechazado')
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error al actualizar orden:', updateError)
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResult.id,
        status: paymentResult.status,
        statusDetail: paymentResult.statusDetail,
        approvalUrl: paymentResult.approvalUrl,
      },
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: orderUpdate.status,
      },
    })
  } catch (error) {
    console.error('=== ERROR AL PROCESAR PAGO ===')
    console.error('Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al procesar el pago',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
