import crypto from 'crypto'
import { verifyMercadoPagoWebhook, extractWebhookHeaders } from '@/lib/mercadopago/verify-webhook'

describe('Mercado Pago Webhook Verification', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.MP_WEBHOOK_SECRET = 'test-secret-key-123'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('verifyMercadoPagoWebhook', () => {
    const dataId = 'payment-123'

    function createValidRequest(timestampOverride?: number): Request {
      const ts = timestampOverride ?? Math.floor(Date.now() / 1000)
      const xRequestId = 'req-id-456'
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

      // Calculate valid HMAC signature
      const hmac = crypto.createHmac('sha256', 'test-secret-key-123')
      hmac.update(manifest)
      const hash = hmac.digest('hex')

      const xSignature = `ts=${ts},v1=${hash}`

      return new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'x-signature': xSignature,
          'x-request-id': xRequestId,
        },
      })
    }

    describe('Happy Path - Valid Webhooks', () => {
      it('should verify a valid webhook signature', () => {
        const request = createValidRequest()

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })

      it('should verify webhook with hash in uppercase', () => {
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

        const hmac = crypto.createHmac('sha256', 'test-secret-key-123')
        hmac.update(manifest)
        const hash = hmac.digest('hex').toUpperCase() // Uppercase

        const xSignature = `ts=${ts},v1=${hash}`

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': xSignature,
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })

      it('should verify webhook with timestamp exactly 5 minutes old', () => {
        const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300 // Exactly 5 minutes

        const request = createValidRequest(fiveMinutesAgo)

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })

      it('should verify webhook with future timestamp within 5 minutes', () => {
        const threeMinutesFromNow = Math.floor(Date.now() / 1000) + 180

        const request = createValidRequest(threeMinutesFromNow)

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })
    })

    describe('Missing Headers', () => {
      it('should reject webhook without x-signature header', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-request-id': 'req-id-456',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook without x-request-id header', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': 'ts=123,v1=hash',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook without both headers', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {},
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })

    describe('Invalid Signature Format', () => {
      it('should reject webhook with invalid x-signature format (missing ts)', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': 'v1=somehash',
            'x-request-id': 'req-id-456',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook with invalid x-signature format (missing v1)', () => {
        const ts = Math.floor(Date.now() / 1000)
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': `ts=${ts}`,
            'x-request-id': 'req-id-456',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook with malformed x-signature', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': 'invalid-format',
            'x-request-id': 'req-id-456',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook with empty x-signature parts', () => {
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': 'ts=,v1=',
            'x-request-id': 'req-id-456',
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })

    describe('Timestamp Validation', () => {
      it('should reject webhook with timestamp older than 5 minutes', () => {
        const sixMinutesAgo = Math.floor(Date.now() / 1000) - 360 // 6 minutes ago

        const request = createValidRequest(sixMinutesAgo)

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook with timestamp more than 5 minutes in the future', () => {
        const sixMinutesFromNow = Math.floor(Date.now() / 1000) + 360

        const request = createValidRequest(sixMinutesFromNow)

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook with invalid timestamp (non-numeric)', () => {
        const xRequestId = 'req-id-456'
        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': 'ts=not-a-number,v1=somehash',
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })

    describe('HMAC Signature Validation', () => {
      it('should reject webhook with incorrect signature', () => {
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': `ts=${ts},v1=wronghashvalue123456`,
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook when dataId does not match', () => {
        const request = createValidRequest()
        const wrongDataId = 'different-payment-id'

        const result = verifyMercadoPagoWebhook(request, wrongDataId)

        expect(result).toBe(false)
      })

      it('should reject webhook when secret is different', () => {
        // Create request with one secret
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

        const hmac = crypto.createHmac('sha256', 'different-secret')
        hmac.update(manifest)
        const hash = hmac.digest('hex')

        const xSignature = `ts=${ts},v1=${hash}`

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': xSignature,
            'x-request-id': xRequestId,
          },
        })

        // Verify with different secret (configured in beforeEach)
        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })

    describe('Environment Configuration', () => {
      it('should reject webhook when MP_WEBHOOK_SECRET is not configured', () => {
        delete process.env.MP_WEBHOOK_SECRET

        const request = createValidRequest()

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })

      it('should reject webhook when MP_WEBHOOK_SECRET is empty string', () => {
        process.env.MP_WEBHOOK_SECRET = ''

        const request = createValidRequest()

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })

    describe('Edge Cases', () => {
      it('should handle x-signature with extra whitespace', () => {
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

        const hmac = crypto.createHmac('sha256', 'test-secret-key-123')
        hmac.update(manifest)
        const hash = hmac.digest('hex')

        // Add extra whitespace
        const xSignature = ` ts = ${ts} , v1 = ${hash} `

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': xSignature,
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })

      it('should handle x-signature with extra parameters', () => {
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

        const hmac = crypto.createHmac('sha256', 'test-secret-key-123')
        hmac.update(manifest)
        const hash = hmac.digest('hex')

        // Add extra parameter
        const xSignature = `ts=${ts},v1=${hash},extra=param`

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': xSignature,
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(true)
      })

      it('should handle dataId with special characters', () => {
        const specialDataId = 'payment-123-xyz!@#'
        const ts = Math.floor(Date.now() / 1000)
        const xRequestId = 'req-id-456'
        const manifest = `id:${specialDataId};request-id:${xRequestId};ts:${ts};`

        const hmac = crypto.createHmac('sha256', 'test-secret-key-123')
        hmac.update(manifest)
        const hash = hmac.digest('hex')

        const xSignature = `ts=${ts},v1=${hash}`

        const request = new Request('https://example.com/webhook', {
          method: 'POST',
          headers: {
            'x-signature': xSignature,
            'x-request-id': xRequestId,
          },
        })

        const result = verifyMercadoPagoWebhook(request, specialDataId)

        expect(result).toBe(true)
      })
    })

    describe('Error Handling', () => {
      it('should return false on any unexpected error', () => {
        // Create a request that will cause an error during processing
        const request = {
          headers: {
            get: jest.fn(() => {
              throw new Error('Unexpected error')
            }),
          },
        } as unknown as Request

        const result = verifyMercadoPagoWebhook(request, dataId)

        expect(result).toBe(false)
      })
    })
  })

  describe('extractWebhookHeaders', () => {
    it('should extract both headers when present', () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'x-signature': 'ts=123,v1=hash',
          'x-request-id': 'req-id-456',
        },
      })

      const result = extractWebhookHeaders(request)

      expect(result).toEqual({
        xSignature: 'ts=123,v1=hash',
        xRequestId: 'req-id-456',
      })
    })

    it('should return null for missing x-signature', () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'x-request-id': 'req-id-456',
        },
      })

      const result = extractWebhookHeaders(request)

      expect(result).toEqual({
        xSignature: null,
        xRequestId: 'req-id-456',
      })
    })

    it('should return null for missing x-request-id', () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'x-signature': 'ts=123,v1=hash',
        },
      })

      const result = extractWebhookHeaders(request)

      expect(result).toEqual({
        xSignature: 'ts=123,v1=hash',
        xRequestId: null,
      })
    })

    it('should return null for both when headers are missing', () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {},
      })

      const result = extractWebhookHeaders(request)

      expect(result).toEqual({
        xSignature: null,
        xRequestId: null,
      })
    })

    it('should handle headers with case-insensitive names', () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'X-Signature': 'ts=123,v1=hash',
          'X-Request-ID': 'req-id-456',
        },
      })

      const result = extractWebhookHeaders(request)

      // Headers API normalizes header names to lowercase
      expect(result.xSignature).toBe('ts=123,v1=hash')
      expect(result.xRequestId).toBe('req-id-456')
    })
  })
})
