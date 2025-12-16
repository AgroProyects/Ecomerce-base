import crypto from 'crypto'

export interface WebhookHeaders {
  xSignature: string | null
  xRequestId: string | null
}

/**
 * Verifica la firma de un webhook de Mercado Pago
 *
 * @param request - Request object de Next.js
 * @param dataId - ID del pago/recurso notificado
 * @returns true si la firma es válida, false en caso contrario
 *
 * Documentación oficial de MP:
 * https://www.mercadopago.com.uy/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhook(
  request: Request,
  dataId: string
): boolean {
  try {
    // 1. Obtener headers requeridos
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    // Validar que existan headers requeridos
    if (!xSignature || !xRequestId) {
      console.error('Missing required webhook headers', {
        hasXSignature: !!xSignature,
        hasXRequestId: !!xRequestId
      })
      return false
    }

    // 2. Parsear x-signature header
    // Formato: ts=1234567890,v1=hash_value
    const parts = xSignature.split(',')
    let ts: string | undefined
    let hash: string | undefined

    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) {
        const trimmedKey = key.trim()
        const trimmedValue = value.trim()

        if (trimmedKey === 'ts') ts = trimmedValue
        if (trimmedKey === 'v1') hash = trimmedValue
      }
    })

    if (!ts || !hash) {
      console.error('Invalid x-signature format', { xSignature })
      return false
    }

    // 3. Validar timestamp (no más de 5 minutos de diferencia)
    const requestTime = parseInt(ts, 10)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeDiff = Math.abs(currentTime - requestTime)

    if (timeDiff > 300) { // 5 minutos
      console.error('Webhook timestamp too old', {
        requestTime,
        currentTime,
        diffSeconds: timeDiff
      })
      return false
    }

    // 4. Crear manifest string según documentación de MP
    // Formato: id:{data.id};request-id:{x-request-id};ts:{timestamp};
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // 5. Obtener secret
    const secret = process.env.MP_WEBHOOK_SECRET

    if (!secret) {
      console.error('MP_WEBHOOK_SECRET not configured')
      return false
    }

    // 6. Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const calculatedHash = hmac.digest('hex')

    // 7. Comparar hashes (case-insensitive)
    const isValid = calculatedHash.toLowerCase() === hash.toLowerCase()

    if (!isValid) {
      console.error('Webhook signature verification failed', {
        expected: calculatedHash,
        received: hash,
        manifest,
        dataId,
        xRequestId,
        ts
      })
    } else {
      console.log('Webhook signature verified successfully', { dataId })
    }

    return isValid

  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Extrae los headers necesarios del request
 */
export function extractWebhookHeaders(request: Request): WebhookHeaders {
  return {
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
  }
}
