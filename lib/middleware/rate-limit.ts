import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { auth } from '@/lib/auth/config'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = {
  // Rutas de autenticación: 5 requests cada 10 segundos
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 s'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // APIs generales: 20 requests cada 10 segundos
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 s'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Checkout: 3 requests cada 60 segundos (evitar múltiples compras)
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 s'),
    analytics: true,
    prefix: 'ratelimit:checkout',
  }),

  // Validación de cupones: 10 requests cada 60 segundos
  coupon: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:coupon',
  }),

  // Envío de emails: 2 requests cada 60 segundos
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '60 s'),
    analytics: true,
    prefix: 'ratelimit:email',
  }),

  // Webhooks: 100 requests cada 10 segundos (alto para Mercado Pago)
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '10 s'),
    analytics: true,
    prefix: 'ratelimit:webhook',
  }),

  // Verificación de email: 3 requests cada 60 segundos
  verification: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 s'),
    analytics: true,
    prefix: 'ratelimit:verification',
  }),

  // Tracking de órdenes: 10 requests cada 60 segundos
  tracking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:tracking',
  }),

  // Subida de archivos: 10 requests cada 60 segundos
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:upload',
  }),

  // Eliminación de archivos: 20 requests cada 60 segundos
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    analytics: true,
    prefix: 'ratelimit:delete',
  }),
}

/**
 * Helper para obtener identificador único (IP o user ID)
 * Automáticamente intenta obtener el user ID de la sesión
 */
export async function getIdentifier(request: Request, userId?: string): Promise<string> {
  // Si se proporciona explícitamente, usarlo
  if (userId) return `user:${userId}`

  // Intentar obtener de la sesión autenticada
  try {
    const session = await auth()
    if (session?.user?.id) {
      return `user:${session.user.id}`
    }
  } catch {
    // Si falla (ruta pública), continuar con IP
  }

  // Fallback a IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

/**
 * Versión síncrona para casos donde no se puede usar async
 * (por ejemplo, en algunos middlewares)
 */
export function getIdentifierSync(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}
