import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook, type WebhookNotification } from '@/lib/mercadopago/webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebhookNotification

    console.log('Webhook received:', JSON.stringify(body, null, 2))

    // Verificar tipo de notificación
    if (body.type !== 'payment') {
      // Solo procesamos notificaciones de pago
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id

    if (!paymentId) {
      console.error('No payment ID in webhook')
      return NextResponse.json(
        { error: 'No payment ID' },
        { status: 400 }
      )
    }

    // Procesar el pago
    const result = await processPaymentWebhook(paymentId)

    if (!result.success) {
      console.error('Error processing webhook:', result.error)
      // Aún así retornamos 200 para que MP no reintente
      return NextResponse.json({
        received: true,
        error: result.error,
      })
    }

    console.log(`Payment ${paymentId} processed for order ${result.orderId}, status: ${result.status}`)

    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      status: result.status,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mercado Pago también puede hacer GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
