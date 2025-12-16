import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook, type WebhookNotification } from '@/lib/mercadopago/webhooks'
import { ratelimit, getIdentifierSync } from '@/lib/middleware/rate-limit'
import { verifyMercadoPagoWebhook } from '@/lib/mercadopago/verify-webhook'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting (síncrono para webhooks)
    const identifier = getIdentifierSync(request)
    const { success, limit, reset, remaining } = await ratelimit.webhook.limit(identifier)

    if (!success) {
      console.warn('Webhook rate limited', { identifier, remaining })
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. Parsear el body
    const body = await request.json() as WebhookNotification

    console.log('Webhook received:', JSON.stringify(body, null, 2))

    // 3. VERIFICAR FIRMA DEL WEBHOOK (CRÍTICO PARA SEGURIDAD)
    const dataId = body.data?.id

    if (!dataId) {
      console.error('Missing data.id in webhook payload')
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Verificar la firma usando los headers de Mercado Pago
    const isValidSignature = verifyMercadoPagoWebhook(request, dataId)

    if (!isValidSignature) {
      console.error('⚠️ WEBHOOK SIGNATURE VERIFICATION FAILED ⚠️', {
        dataId,
        type: body.type,
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id')
      })

      // IMPORTANTE: Retornar 401 pero no revelar detalles del error
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ Webhook signature verified successfully')

    // 4. Validar tipo de notificación
    if (body.type !== 'payment') {
      console.log('Received non-payment webhook', { type: body.type })
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data.id

    if (!paymentId) {
      console.error('No payment ID in webhook')
      return NextResponse.json(
        { error: 'No payment ID' },
        { status: 400 }
      )
    }

    // 5. Procesar el pago
    console.log(`Processing payment webhook: ${paymentId}`)
    const result = await processPaymentWebhook(paymentId)

    if (!result.success) {
      console.error('Error processing webhook:', result.error)

      // Capturar error en Sentry
      Sentry.captureMessage(`Webhook processing failed: ${result.error}`, {
        level: 'error',
        tags: {
          module: 'webhooks',
          endpoint: '/api/webhooks/mercadopago',
          payment_id: paymentId,
        },
        extra: {
          error: result.error,
          webhookType: body.type,
        },
      })

      // Aún así retornamos 200 para que MP no reintente indefinidamente
      return NextResponse.json({
        received: true,
        error: result.error,
      })
    }

    console.log(`✅ Payment ${paymentId} processed for order ${result.orderId}, status: ${result.status}`)

    // 6. Siempre retornar 200 (MP reintenta si no es 200)
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      status: result.status,
    })

  } catch (error) {
    console.error('⚠️ Webhook processing error:', error)

    // Capturar error crítico en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'webhooks',
        endpoint: '/api/webhooks/mercadopago',
      },
      level: 'error',
      extra: {
        webhookBody: body,
      },
    })

    // Retornar 200 para evitar reintentos infinitos de MP
    // (el error ya fue loggeado para investigación)
    return NextResponse.json({
      received: true,
      error: 'Internal error'
    })
  }
}

// Mercado Pago también puede hacer GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
