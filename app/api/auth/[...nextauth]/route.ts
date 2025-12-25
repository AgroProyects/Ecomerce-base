import { handlers } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'

const { GET: AuthGET, POST: AuthPOST } = handlers

// Wrapper para GET con rate limiting
export async function GET(request: NextRequest) {
  // Aplicar rate limiting solo para autenticación
  const identifier = await getIdentifier(request)
  const { success, limit, reset, remaining } = await ratelimit.auth.limit(identifier)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
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

  return AuthGET(request)
}

// Wrapper para POST con rate limiting
export async function POST(request: NextRequest) {
  // Aplicar rate limiting para autenticación
  const identifier = await getIdentifier(request)
  const { success, limit, reset, remaining } = await ratelimit.auth.limit(identifier)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
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

  return AuthPOST(request)
}
