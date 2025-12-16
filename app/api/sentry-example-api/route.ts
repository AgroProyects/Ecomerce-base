import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleAPIError'
  }
}

/**
 * Endpoint de testing para Sentry
 *
 * Uso:
 * - GET /api/sentry-example-api?type=error - Lanza un error de prueba
 * - GET /api/sentry-example-api?type=message - Envía un mensaje de prueba
 * - GET /api/sentry-example-api?type=warning - Envía una advertencia
 * - GET /api/sentry-example-api - Por defecto lanza un error
 */
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'error'

  console.log('🐛 Sentry Test Endpoint called - Type:', type)

  switch (type) {
    case 'message':
      // Test: Enviar un mensaje informativo
      Sentry.captureMessage('Test message from Sentry API', {
        level: 'info',
        tags: {
          test: 'true',
          endpoint: '/api/sentry-example-api',
        },
        extra: {
          timestamp: new Date().toISOString(),
          testType: 'message',
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Test message sent to Sentry',
        type: 'message',
      })

    case 'warning':
      // Test: Enviar una advertencia
      Sentry.captureMessage('Test warning from Sentry API', {
        level: 'warning',
        tags: {
          test: 'true',
          endpoint: '/api/sentry-example-api',
        },
        extra: {
          timestamp: new Date().toISOString(),
          testType: 'warning',
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Test warning sent to Sentry',
        type: 'warning',
      })

    case 'error':
    default:
      // Test: Lanzar un error (capturado automáticamente)
      Sentry.logger.info('Sentry example API called - throwing test error')
      throw new SentryExampleAPIError(
        'This is a test error raised on the backend. Check your Sentry dashboard!'
      )
  }
}
