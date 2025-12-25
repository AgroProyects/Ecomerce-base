/**
 * Tests para Checkout Process
 *
 * Objetivo: 90%+ coverage
 * Criticidad: ALTA - Maneja flujo completo de pago
 *
 * Nota: Estos tests cubren los principales flujos del checkout.
 * El archivo original es muy complejo con muchas dependencias,
 * por lo que nos enfocamos en los casos más críticos.
 */

import { mockSupabaseClient, resetSupabaseMocks } from '@/mocks/supabase'
import {
  createMockProduct,
  createMockVariant,
  createMockOrder,
  createMockAddress,
  createMockCoupon,
} from '@/test-utils/factories'

// Mock auth
jest.mock('@/lib/auth/config', () => ({
  auth: jest.fn().mockResolvedValue(null),
}))

// Mock shipping calculator
jest.mock('@/actions/shipping', () => ({
  calculateShippingServer: jest.fn().mockResolvedValue({ cost: 150 }),
}))

// Mock stock reservations
jest.mock('@/lib/stock/reservations', () => ({
  checkStockAvailability: jest.fn().mockResolvedValue({
    available: true,
    unavailableItems: [],
  }),
  reserveCartStock: jest.fn().mockResolvedValue(['reservation-1', 'reservation-2']),
  completeCartReservations: jest.fn().mockResolvedValue(undefined),
}))

// Mock Mercado Pago createPreference
jest.mock('@/lib/mercadopago/checkout', () => ({
  createPreference: jest.fn().mockResolvedValue({
    id: 'pref-123',
    initPoint: 'https://mercadopago.com/checkout/pref-123',
    sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/pref-123',
  }),
}))

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/logger/config', () => ({
  actionLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/logger/utils', () => ({
  logTiming: jest.fn(),
  logError: jest.fn(),
}))

// Importar después de los mocks
import { processCheckout } from '@/actions/checkout/process'
import {
  checkStockAvailability,
  reserveCartStock,
  completeCartReservations,
} from '@/lib/stock/reservations'
import { createPreference } from '@/lib/mercadopago/checkout'
import * as Sentry from '@/sentry/nextjs'

// Mock console para tests limpios
const originalLog = console.log
const originalError = console.error

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalLog
  console.error = originalError
})

describe('Checkout Process', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    jest.clearAllMocks()

    // Reset mocks to default values
    ;(checkStockAvailability as jest.Mock).mockResolvedValue({
      available: true,
      unavailableItems: [],
    })
    ;(reserveCartStock as jest.Mock).mockResolvedValue(['reservation-1', 'reservation-2'])
    ;(completeCartReservations as jest.Mock).mockResolvedValue(undefined)
    ;(createPreference as jest.Mock).mockResolvedValue({
      id: 'pref-123',
      initPoint: 'https://mercadopago.com/checkout/pref-123',
      sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/pref-123',
    })
  })

  // ===================================
  // TESTS DE VALIDACIÓN DE SCHEMA
  // ===================================
  describe('Schema Validation', () => {
    it('should reject checkout with empty items array', async () => {
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [], // Array vacío
      }

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('carrito')
    })

    it('should reject checkout with invalid email', async () => {
      const input = {
        customer: {
          email: 'invalid-email',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: 'prod-1', quantity: 1 }],
      }

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email')
    })

    it('should reject checkout with quantity <= 0', async () => {
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: 'prod-1', quantity: 0 }],
      }

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  // ===================================
  // TESTS DE VERIFICACIÓN DE STOCK
  // ===================================
  describe('Stock Verification', () => {
    it('should reject checkout when stock is insufficient', async () => {
      const product = createMockProduct({ id: 'prod-1', name: 'Test Product' })
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: product.id, quantity: 10 }],
      }

      // Mock productos
      mockSupabaseClient.from().select().in.mockResolvedValueOnce({
        data: [product],
        error: null,
      })

      // Mock stock insuficiente
      ;(checkStockAvailability as jest.Mock).mockResolvedValueOnce({
        available: false,
        unavailableItems: [
          {
            productId: product.id,
            available: 5,
            requested: 10,
          },
        ],
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stock insuficiente')
      expect(result.error).toContain('Disponible: 5')
      expect(result.error).toContain('Solicitado: 10')
    })

    it('should call checkStockAvailability with correct params for products', async () => {
      const product = createMockProduct({ id: 'prod-1' })
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'bank_transfer' as const,
        },
        items: [{ productId: product.id, quantity: 2 }],
      }

      // Mock productos
      mockSupabaseClient.from().select().in.mockResolvedValueOnce({
        data: [product],
        error: null,
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder({ id: 'order-123' })
      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: mockOrder,
        error: null,
      })

      // Mock crear items
      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await processCheckout(input)

      expect(checkStockAvailability).toHaveBeenCalledWith([
        {
          productId: product.id,
          variantId: undefined,
          quantity: 2,
        },
      ])
    })
  })

  // ===================================
  // TESTS DE RESERVA DE STOCK
  // ===================================
  describe('Stock Reservation', () => {
    it('should reserve stock before creating order', async () => {
      const product = createMockProduct({ id: 'prod-1' })
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'bank_transfer' as const,
        },
        items: [{ productId: product.id, quantity: 2 }],
      }

      // Mock productos
      mockSupabaseClient.from().select().in.mockResolvedValueOnce({
        data: [product],
        error: null,
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder()
      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: mockOrder,
        error: null,
      })

      // Mock crear items
      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      await processCheckout(input)

      expect(reserveCartStock).toHaveBeenCalledWith({
        items: [
          {
            productId: product.id,
            variantId: undefined,
            quantity: 2,
          },
        ],
        userId: undefined,
        sessionId: expect.any(String),
        expiresInMinutes: 15,
      })
    })

    it('should return error if stock reservation fails', async () => {
      const product = createMockProduct()
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: product.id, quantity: 2 }],
      }

      // Mock productos
      mockSupabaseClient.from().select().in.mockResolvedValueOnce({
        data: [product],
        error: null,
      })

      // Mock reservation error
      ;(reserveCartStock as jest.Mock).mockRejectedValueOnce(
        new Error('Stock insuficiente para completar la reserva')
      )

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stock insuficiente')
    })
  })

  // ===================================
  // TESTS DE MÉTODOS DE PAGO
  // ===================================
  describe('Payment Methods', () => {
    it('should handle bank transfer payment', async () => {
      // Usar ID fijo para que coincida
      const productId = 'test-product-123'
      const product = createMockProduct({ id: productId, price: 1000 })

      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'bank_transfer' as const,
        },
        items: [{ productId: productId, quantity: 1 }],
      }

      // Mock productos - la primera llamada from('products')
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: [product],
            error: null,
          }),
        }),
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden - segunda llamada from('orders')
      const mockOrder = createMockOrder({
        id: 'order-123',
        order_number: 'ORD-1234',
        status: 'pending_payment',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: mockOrder,
              error: null,
            }),
          }),
        }),
      })

      // Mock crear items - tercera llamada from('order_items')
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(true)
      expect(result.data?.paymentMethod).toBe('bank_transfer')
      expect(result.data?.redirectUrl).toContain('payment-instructions')
      expect(createPreference).not.toHaveBeenCalled()
    })

    it('should handle cash on delivery payment', async () => {
      // Usar ID fijo
      const productId = 'test-product-456'
      const product = createMockProduct({ id: productId, price: 1500 })

      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'cash_on_delivery' as const,
        },
        items: [{ productId: productId, quantity: 1 }],
      }

      // Mock productos
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: [product],
            error: null,
          }),
        }),
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder({
        id: 'order-123',
        order_number: 'ORD-1234',
        status: 'pending',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: mockOrder,
              error: null,
            }),
          }),
        }),
      })

      // Mock crear items
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(true)
      expect(result.data?.paymentMethod).toBe('cash_on_delivery')
      expect(result.data?.redirectUrl).toContain('confirmation')
      expect(createPreference).not.toHaveBeenCalled()
    })

    it('should handle mercadopago payment method', async () => {
      // Usar ID fijo
      const productId = 'test-product-789'
      const product = createMockProduct({ id: productId, price: 2000 })

      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: productId, quantity: 1 }],
      }

      // Mock productos
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: [product],
            error: null,
          }),
        }),
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder({
        id: 'order-123',
        order_number: 'ORD-1234',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: mockOrder,
              error: null,
            }),
          }),
        }),
      })

      // Mock crear items
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      })

      // Mock update order con preference ID
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null,
          }),
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(true)
      expect(result.data?.paymentMethod).toBe('mercadopago')
      expect(result.data?.preferenceId).toBe('pref-123')
      expect(result.data?.initPoint).toBe('https://mercadopago.com/checkout/pref-123')
      expect(createPreference).toHaveBeenCalled()
    })

    it('should handle MP preference creation error', async () => {
      // Usar ID fijo
      const productId = 'test-product-error'
      const product = createMockProduct({ id: productId, price: 3000 })

      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: productId, quantity: 1 }],
      }

      // Mock productos
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: [product],
            error: null,
          }),
        }),
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder({
        id: 'order-123',
        order_number: 'ORD-1234',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: mockOrder,
              error: null,
            }),
          }),
        }),
      })

      // Mock crear items
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      })

      // Mock MP error
      ;(createPreference as jest.Mock).mockRejectedValueOnce(new Error('MP API error'))

      // Mock update order to cancelled
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null,
          }),
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al procesar el pago con Mercado Pago')
    })
  })

  // ===================================
  // TESTS DE ERROR HANDLING
  // ===================================
  describe('Error Handling', () => {
    it('should return error if products query fails', async () => {
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: 'prod-1', quantity: 1 }],
      }

      // Mock productos error
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al obtener información de productos')
    })

    it('should return error if product not found in products list', async () => {
      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: 'non-existent', quantity: 1 }],
      }

      // Mock productos vacío (producto no encontrado)
      mockSupabaseClient.from().select().in.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Producto no encontrado')
    })

    it('should rollback order if items creation fails', async () => {
      // Usar ID fijo
      const productId = 'test-product-rollback'
      const product = createMockProduct({ id: productId, price: 4000 })

      const input = {
        customer: {
          email: 'test@test.com',
          name: 'Test User',
          phone: '099123456',
          address: createMockAddress(),
          paymentMethod: 'mercadopago' as const,
        },
        items: [{ productId: productId, quantity: 1 }],
      }

      // Mock productos
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValueOnce({
            data: [product],
            error: null,
          }),
        }),
      })

      // Mock order number
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'ORD-1234',
        error: null,
      })

      // Mock crear orden
      const mockOrder = createMockOrder({
        id: 'order-123',
        order_number: 'ORD-1234',
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: mockOrder,
              error: null,
            }),
          }),
        }),
      })

      // Mock error al crear items
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Error creating items' },
        }),
      })

      // Mock delete order (rollback)
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null,
          }),
        }),
      })

      const result = await processCheckout(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al crear los items')
    })
  })
})
