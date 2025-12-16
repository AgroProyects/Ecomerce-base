/**
 * Double Submit Cookie Pattern para protección CSRF
 * Útil para APIs públicas que no usan NextAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Genera un token CSRF aleatorio
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Crea una cookie con el token CSRF
 *
 * @param token - Token CSRF a almacenar
 * @returns Cookie string para ser usado en Set-Cookie header
 */
export function createCsrfCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production'

  return [
    `${CSRF_TOKEN_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${60 * 60 * 24}`, // 24 horas
    isProduction ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

/**
 * Obtiene el token CSRF de las cookies
 */
export function getCsrfTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_NAME)?.value || null
}

/**
 * Obtiene el token CSRF del header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME)
}

/**
 * Valida que el token CSRF del header coincida con el de la cookie
 * (Double Submit Cookie Pattern)
 *
 * @param request - Request de Next.js
 * @returns true si los tokens coinciden, false si no
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   if (!validateCsrfToken(request)) {
 *     return NextResponse.json(
 *       { error: 'CSRF token inválido' },
 *       { status: 403 }
 *     )
 *   }
 *
 *   // Token válido, continuar...
 * }
 * ```
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookies(request)
  const headerToken = getCsrfTokenFromHeader(request)

  // Ambos tokens deben existir
  if (!cookieToken || !headerToken) {
    console.warn('CSRF validation failed: Missing token', {
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    })
    return false
  }

  // Los tokens deben coincidir
  const isValid = cookieToken === headerToken

  if (!isValid) {
    console.warn('CSRF validation failed: Token mismatch')
  }

  return isValid
}

/**
 * Middleware que requiere y valida token CSRF
 * Retorna error 403 si el token no es válido
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfError = requireCsrfToken(request)
 *   if (csrfError) return csrfError
 *
 *   // Token válido, continuar...
 * }
 * ```
 */
export function requireCsrfToken(request: NextRequest): NextResponse | null {
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      {
        error: 'CSRF token inválido o faltante',
        details: 'Debes incluir el header X-CSRF-Token con el valor de la cookie csrf-token',
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Endpoint helper para generar y enviar un token CSRF al cliente
 *
 * @example
 * ```typescript
 * // app/api/csrf-token/route.ts
 * import { getCsrfTokenResponse } from '@/lib/middleware/csrf-token'
 *
 * export async function GET() {
 *   return getCsrfTokenResponse()
 * }
 * ```
 */
export function getCsrfTokenResponse(): NextResponse {
  const token = generateCsrfToken()
  const cookie = createCsrfCookie(token)

  const response = NextResponse.json({
    token,
    message: 'Include this token in the X-CSRF-Token header for POST/PUT/DELETE requests',
  })

  response.headers.set('Set-Cookie', cookie)

  return response
}
