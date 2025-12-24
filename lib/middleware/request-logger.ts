import { NextRequest, NextResponse } from 'next/server'
import { httpLogger } from '@/lib/logger/config'
import { logHttpRequest } from '@/lib/logger/utils'

/**
 * Middleware para logging de requests HTTP
 * Debe ser llamado al inicio y final de cada API route
 */
export function logRequest(request: NextRequest) {
  const startTime = Date.now()
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent') || undefined
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

  httpLogger.info(
    {
      method,
      url,
      userAgent,
      ip,
    },
    `${method} ${url}`
  )

  return startTime
}

/**
 * Log de respuesta HTTP
 */
export function logResponse(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  userId?: string
) {
  const duration = Date.now() - startTime
  const method = request.method
  const url = request.url
  const statusCode = response.status
  const userAgent = request.headers.get('user-agent') || undefined
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

  logHttpRequest(httpLogger, {
    method,
    url,
    statusCode,
    duration,
    userAgent,
    ip,
    userId,
  })
}

/**
 * Log de error HTTP
 */
export function logRequestError(
  request: NextRequest,
  error: Error,
  startTime: number,
  userId?: string
) {
  const duration = Date.now() - startTime
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent') || undefined
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

  logHttpRequest(httpLogger, {
    method,
    url,
    statusCode: 500,
    duration,
    userAgent,
    ip,
    userId,
    error,
  })
}

/**
 * Wrapper para API routes con logging automático
 */
export function withLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest
    const startTime = logRequest(request)

    try {
      const response = await handler(...args)
      logResponse(request, response, startTime)
      return response
    } catch (error) {
      logRequestError(request, error as Error, startTime)
      throw error
    }
  }) as T
}
