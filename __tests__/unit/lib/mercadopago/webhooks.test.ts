import { processPaymentWebhook, verifyWebhookSignature } from '@/lib/mercadopago/webhooks'
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { createAdminClient } from '@/lib/supabase/admin'

// Mock Mercado Pago Payment class
const mockPaymentGet = jest.fn()
jest.mock('mercadopago', () => ({
  Payment: jest.fn().mockImplementation(() => ({
    get: mockPaymentGet,
  })),
}))

// Mock Mercado Pago client
jest.mock('@/lib/mercadopago/client')
jest.mock('@/lib/supabase/admin')

describe('Mercado Pago Webhook Processing', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockPaymentGet.mockReset()
    process.env = { ...originalEnv }
    process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('processPaymentWebhook', () => {
    const mockPaymentId = '123456789'
    const mockOrderId = 'order-abc-123'

    const createMockSupabaseClient = () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { product_id: 'prod-1', variant_id: null, quantity: 2 },
            { product_id: 'prod-2', variant_id: 'var-1', quantity: 1 },
          ],
          error: null,
        }),
      })

      const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null })

      const mockFrom = jest.fn((table: string) => {
        if (table === 'orders') {
          return { update: mockUpdate }
        }
        if (table === 'order_items') {
          return { select: mockSelect }
        }
        return {}
      })

      return {
        from: mockFrom,
        rpc: mockRpc,
        mockUpdate,
        mockSelect,
        mockRpc,
      }
    }

    describe('Happy Path - Approved Payment', () => {
      it('should process approved payment successfully', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          status_detail: 'accredited',
          payment_method_id: 'visa',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(true)
        expect(result.orderId).toBe(mockOrderId)
        expect(result.status).toBe('approved')
      })

      it('should update order status to paid for approved payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          status_detail: 'accredited',
          payment_method_id: 'master',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.from).toHaveBeenCalledWith('orders')
        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'paid',
            mp_payment_id: '123456789',
            mp_status: 'approved',
            mp_status_detail: 'accredited',
            mp_payment_method: 'master',
          })
        )
      })

      it('should set paid_at timestamp for approved payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const beforeTime = new Date().toISOString()
        await processPaymentWebhook(mockPaymentId)
        const afterTime = new Date().toISOString()

        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            paid_at: expect.any(String),
          })
        )

        const updateCall = mockSupabase.mockUpdate.mock.calls[0][0]
        expect(updateCall.paid_at).toBeTruthy()
        expect(updateCall.paid_at >= beforeTime).toBe(true)
        expect(updateCall.paid_at <= afterTime).toBe(true)
      })

      it('should update stock for approved payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        // Verify stock update was called
        expect(mockSupabase.from).toHaveBeenCalledWith('order_items')
        expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_product_stock', {
          p_product_id: 'prod-1',
          p_quantity: 2,
        })
        expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_variant_stock', {
          p_variant_id: 'var-1',
          p_quantity: 1,
        })
      })
    })

    describe('Pending Payment', () => {
      it('should process pending payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'pending',
          status_detail: 'pending_waiting_payment',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(true)
        expect(result.status).toBe('pending')
        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
            paid_at: null,
          })
        )
      })

      it('should process in_process payment as pending', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'in_process',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
            paid_at: null,
          })
        )
      })

      it('should not update stock for pending payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'pending',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        // rpc should not be called for stock updates
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_product_stock', expect.anything())
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_variant_stock', expect.anything())
      })
    })

    describe('Rejected/Cancelled Payment', () => {
      it('should process rejected payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'rejected',
          status_detail: 'cc_rejected_insufficient_amount',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(true)
        expect(result.status).toBe('rejected')
        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'cancelled',
            paid_at: null,
          })
        )
      })

      it('should process cancelled payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'cancelled',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'cancelled',
          })
        )
      })

      it('should not update stock for rejected payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'rejected',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_product_stock', expect.anything())
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_variant_stock', expect.anything())
      })
    })

    describe('Refunded/Charged Back Payment', () => {
      it('should process refunded payment', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'refunded',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(true)
        expect(result.status).toBe('refunded')
        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'refunded',
            paid_at: null,
          })
        )
      })

      it('should process charged_back payment as refunded', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'charged_back',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'refunded',
          })
        )
      })
    })

    describe('Error Handling', () => {
      it('should return error when payment not found', async () => {
        mockPaymentGet.mockResolvedValueOnce(null)

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Pago no encontrado')
      })

      it('should return error when external_reference is missing', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          // external_reference missing
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Orden no encontrada en el pago')
      })

      it('should return error when order update fails', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        const mockSupabase = {
          from: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
          rpc: jest.fn(),
        }

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Error actualizando orden')
      })

      it('should handle payment.get() throwing error', async () => {
        mockPaymentGet.mockRejectedValueOnce(new Error('MP API error'))

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(false)
        expect(result.error).toContain('MP API error')
      })

      it('should handle non-Error exceptions', async () => {
        mockPaymentGet.mockRejectedValueOnce('String error')

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Error desconocido')
      })
    })

    describe('Stock Update Edge Cases', () => {
      it('should handle error when fetching order items', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        const mockSupabase = {
          from: jest.fn((table: string) => {
            if (table === 'orders') {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }
            }
            if (table === 'order_items') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Items not found' },
                  }),
                }),
              }
            }
            return {}
          }),
          rpc: jest.fn(),
        }

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        // Should still succeed even if stock update fails
        expect(result.success).toBe(true)
        expect(mockSupabase.rpc).not.toHaveBeenCalled()
      })

      it('should handle empty order items', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        const mockSupabase = {
          from: jest.fn((table: string) => {
            if (table === 'orders') {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }
            }
            if (table === 'order_items') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }
            }
            return {}
          }),
          rpc: jest.fn(),
        }

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        const result = await processPaymentWebhook(mockPaymentId)

        expect(result.success).toBe(true)
        expect(mockSupabase.rpc).not.toHaveBeenCalled()
      })

      it('should handle product without variant', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        const mockSupabase = {
          from: jest.fn((table: string) => {
            if (table === 'orders') {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }
            }
            if (table === 'order_items') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ product_id: 'prod-1', variant_id: null, quantity: 3 }],
                    error: null,
                  }),
                }),
              }
            }
            return {}
          }),
          rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
        }

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_product_stock', {
          p_product_id: 'prod-1',
          p_quantity: 3,
        })
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_variant_stock', expect.anything())
      })

      it('should handle product with variant', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'approved',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)

        const mockSupabase = {
          from: jest.fn((table: string) => {
            if (table === 'orders') {
              return {
                update: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }
            }
            if (table === 'order_items') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{ product_id: 'prod-1', variant_id: 'var-1', quantity: 2 }],
                    error: null,
                  }),
                }),
              }
            }
            return {}
          }),
          rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
        }

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_variant_stock', {
          p_variant_id: 'var-1',
          p_quantity: 2,
        })
        expect(mockSupabase.rpc).not.toHaveBeenCalledWith('decrement_product_stock', expect.anything())
      })
    })

    describe('Unknown Payment Status', () => {
      it('should default to pending for unknown status', async () => {
        const mockPaymentData = {
          id: 123456789,
          status: 'unknown_status',
          external_reference: mockOrderId,
        }

        mockPaymentGet.mockResolvedValueOnce(mockPaymentData)
        const mockSupabase = createMockSupabaseClient()

        ;(getMercadoPagoClient as jest.Mock).mockReturnValue({})
        ;(createAdminClient as jest.Mock).mockReturnValue(mockSupabase)

        await processPaymentWebhook(mockPaymentId)

        expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
          })
        )
      })
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should return true when secret matches', () => {
      process.env.MP_WEBHOOK_SECRET = 'my-secret-key'

      const result = verifyWebhookSignature('payload', 'any-signature', 'my-secret-key')

      expect(result).toBe(true)
    })

    it('should return false when secret does not match', () => {
      process.env.MP_WEBHOOK_SECRET = 'my-secret-key'

      const result = verifyWebhookSignature('payload', 'any-signature', 'wrong-secret')

      expect(result).toBe(false)
    })

    it('should return true when MP_WEBHOOK_SECRET is not configured', () => {
      delete process.env.MP_WEBHOOK_SECRET

      const result = verifyWebhookSignature('payload', 'any-signature', 'any-secret')

      expect(result).toBe(true)
    })

    it('should return true when MP_WEBHOOK_SECRET is empty', () => {
      process.env.MP_WEBHOOK_SECRET = ''

      const result = verifyWebhookSignature('payload', 'any-signature', 'any-secret')

      expect(result).toBe(true)
    })
  })
})
