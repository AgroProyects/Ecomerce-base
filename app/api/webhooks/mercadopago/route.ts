import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook, type WebhookNotification } from '@/lib/mercadopago/webhooks'
import { ratelimit, getIdentifierSync } from '@/lib/middleware/rate-limit'
import { verifyMercadoPagoWebhook } from '@/lib/mercadopago/verify-webhook'
import * as Sentry from '@sentry/nextjs'
import { httpLogger, paymentLogger } from '@/lib/logger/config'
import { logHttpRequest } from '@/lib/logger/utils'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const url = request.url
  const method = request.method

  httpLogger.info({ method, url }, 'Mercado Pago webhook received')

  try {
    // 1. Aplicar rate limiting (síncrono para webhooks)
    const identifier = getIdentifierSync(request)
    const { success, limit, reset, remaining } = await ratelimit.webhook.limit(identifier)

    if (!success) {
      httpLogger.warn({ identifier, remaining }, 'Webhook rate limited')
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

    paymentLogger.debug({ webhookType: body.type, dataId: body.data?.id }, 'Webhook payload received')

    // 3. VERIFICAR FIRMA DEL WEBHOOK (CRÍTICO PARA SEGURIDAD)
    const dataId = body.data?.id

    if (!dataId) {
      paymentLogger.error('Missing data.id in webhook payload')
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Verificar la firma usando los headers de Mercado Pago
    const isValidSignature = verifyMercadoPagoWebhook(request, dataId)

    if (!isValidSignature) {
      paymentLogger.error({
        dataId,
        type: body.type,
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id')
      }, 'WEBHOOK SIGNATURE VERIFICATION FAILED')

      // IMPORTANTE: Retornar 401 pero no revelar detalles del error
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    paymentLogger.info({ dataId }, 'Webhook signature verified successfully')

    // 4. Validar tipo de notificación
    if (body.type !== 'payment') {
      paymentLogger.debug({ type: body.type }, 'Received non-payment webhook - ignoring')
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data.id

    if (!paymentId) {
      paymentLogger.error('No payment ID in webhook')
      return NextResponse.json(
        { error: 'No payment ID' },
        { status: 400 }
      )
    }

    // 5. Procesar el pago
    paymentLogger.info({ paymentId }, 'Processing payment webhook')
    const result = await processPaymentWebhook(paymentId)

    if (!result.success) {
      paymentLogger.error({ paymentId, error: result.error }, 'Error processing webhook')

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

    const duration = Date.now() - startTime
    paymentLogger.info(
      { paymentId, orderId: result.orderId, status: result.status, duration },
      'Payment webhook processed successfully'
    )

    logHttpRequest(httpLogger, {
      method,
      url,
      statusCode: 200,
      duration,
    })

    // 6. Siempre retornar 200 (MP reintenta si no es 200)
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      status: result.status,
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorObj = error instanceof Error ? error : new Error(String(error))

    paymentLogger.error({ error: errorObj, duration }, 'Webhook processing error')

    logHttpRequest(httpLogger, {
      method,
      url,
      statusCode: 500,
      duration,
      error: errorObj,
    })

    // Capturar error crítico en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'webhooks',
        endpoint: '/api/webhooks/mercadopago',
      },
      level: 'error',
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
