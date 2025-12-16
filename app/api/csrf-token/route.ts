import { getCsrfTokenResponse } from '@/lib/middleware/csrf-token'

/**
 * Endpoint para obtener un token CSRF
 *
 * Uso en el frontend:
 * ```typescript
 * // 1. Obtener el token
 * const response = await fetch('/api/csrf-token')
 * const { token } = await response.json()
 *
 * // 2. Incluirlo en requests POST/PUT/DELETE
 * await fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': token,
 *   },
 *   body: JSON.stringify(data),
 * })
 * ```
 */
export async function GET() {
  return getCsrfTokenResponse()
}
