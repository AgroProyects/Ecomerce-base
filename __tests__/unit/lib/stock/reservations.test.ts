/**
 * Tests para Sistema de Reservas de Stock
 *
 * Objetivo: 95%+ coverage
 * Criticidad: ALTA - Previene overselling
 */

import { mockSupabaseClient, resetSupabaseMocks } from '@/mocks/supabase'
import { createMockStockReservation } from '@/test-utils/factories'

// Los mocks se configuran automáticamente en mocks/supabase.ts

// Importar después de los mocks
import {
  getAvailableStock,
  reserveStock,
  releaseReservation,
  completeReservation,
  cleanupExpiredReservations,
  getUserReservations,
  getAllActiveReservations,
  reserveCartStock,
  completeCartReservations,
  checkStockAvailability,
} from '@/lib/stock/reservations'

// Mock console.log y console.error para tests más limpios
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

describe('Stock Reservations System', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    jest.clearAllMocks()
  })

  describe('getAvailableStock', () => {
    it('should return available stock for a product', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 50,
        error: null,
      })

      const stock = await getAvailableStock({ productId: 'prod-123' })

      expect(stock).toBe(50)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_available_stock', {
        p_product_id: 'prod-123',
        p_variant_id: null,
      })
    })

    it('should return available stock for a variant', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 25,
        error: null,
      })

      const stock = await getAvailableStock({ variantId: 'var-123' })

      expect(stock).toBe(25)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_available_stock', {
        p_product_id: null,
        p_variant_id: 'var-123',
      })
    })

    it('should throw error if neither productId nor variantId is provided', async () => {
      await expect(getAvailableStock({})).rejects.toThrow(
        'Debe proporcionar productId o variantId'
      )
    })

    it('should throw error if both productId and variantId are provided', async () => {
      await expect(
        getAvailableStock({ productId: 'prod-123', variantId: 'var-123' })
      ).rejects.toThrow('Solo puede proporcionar productId O variantId, no ambos')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(getAvailableStock({ productId: 'prod-123' })).rejects.toThrow(
        'Error al obtener stock disponible'
      )

      expect(console.error).toHaveBeenCalledWith(
        'Error getting available stock:',
        { message: 'Database error' }
      )
    })

    it('should return 0 when no stock is available', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 0,
        error: null,
      })

      const stock = await getAvailableStock({ productId: 'prod-123' })

      expect(stock).toBe(0)
    })
  })

  describe('reserveStock', () => {
    it('should create a reservation successfully', async () => {
      const reservationId = 'reservation-123'

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: reservationId,
        error: null,
      })

      const result = await reserveStock({
        productId: 'prod-123',
        quantity: 5,
        userId: 'user-123',
      })

      expect(result).toBe(reservationId)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('reserve_stock', {
        p_product_id: 'prod-123',
        p_variant_id: null,
        p_quantity: 5,
        p_user_id: 'user-123',
        p_session_id: null,
        p_expires_in_minutes: 15, // Default value
      })
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Stock reserved: 5 units')
      )
    })

    it('should create reservation with custom expiration time', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'reservation-123',
        error: null,
      })

      await reserveStock({
        productId: 'prod-123',
        quantity: 5,
        userId: 'user-123',
        expiresInMinutes: 30,
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'reserve_stock',
        expect.objectContaining({
          p_expires_in_minutes: 30,
        })
      )
    })

    it('should create reservation with sessionId instead of userId', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'reservation-123',
        error: null,
      })

      await reserveStock({
        variantId: 'var-123',
        quantity: 3,
        sessionId: 'session-abc',
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'reserve_stock',
        expect.objectContaining({
          p_user_id: null,
          p_session_id: 'session-abc',
        })
      )
    })

    it('should throw error if neither productId nor variantId is provided', async () => {
      await expect(
        reserveStock({
          quantity: 5,
          userId: 'user-123',
        })
      ).rejects.toThrow('Debe proporcionar productId o variantId')
    })

    it('should throw error if neither userId nor sessionId is provided', async () => {
      await expect(
        reserveStock({
          productId: 'prod-123',
          quantity: 5,
        })
      ).rejects.toThrow('Debe proporcionar userId o sessionId')
    })

    it('should throw error if quantity is 0', async () => {
      await expect(
        reserveStock({
          productId: 'prod-123',
          quantity: 0,
          userId: 'user-123',
        })
      ).rejects.toThrow('La cantidad debe ser mayor a 0')
    })

    it('should throw error if quantity is negative', async () => {
      await expect(
        reserveStock({
          productId: 'prod-123',
          quantity: -5,
          userId: 'user-123',
        })
      ).rejects.toThrow('La cantidad debe ser mayor a 0')
    })

    it('should throw specific error for insufficient stock', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Stock insuficiente para completar la reserva' },
      })

      await expect(
        reserveStock({
          productId: 'prod-123',
          quantity: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow('Stock insuficiente')
    })

    it('should throw generic error for other database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection error' },
      })

      await expect(
        reserveStock({
          productId: 'prod-123',
          quantity: 5,
          userId: 'user-123',
        })
      ).rejects.toThrow('Error al reservar stock')

      expect(console.error).toHaveBeenCalledWith(
        'Error reserving stock:',
        expect.any(Object)
      )
    })
  })

  describe('releaseReservation', () => {
    it('should release a reservation with default reason (cancelled)', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const result = await releaseReservation('reservation-123')

      expect(result).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('release_reservation', {
        p_reservation_id: 'reservation-123',
        p_reason: 'cancelled',
      })
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Reservation released')
      )
    })

    it('should release a reservation with expired reason', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const result = await releaseReservation('reservation-123', 'expired')

      expect(result).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('release_reservation', {
        p_reservation_id: 'reservation-123',
        p_reason: 'expired',
      })
    })

    it('should handle database errors when releasing', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Reservation not found' },
      })

      await expect(releaseReservation('invalid-id')).rejects.toThrow(
        'Error al liberar reserva'
      )

      expect(console.error).toHaveBeenCalledWith(
        'Error releasing reservation:',
        expect.any(Object)
      )
    })
  })

  describe('completeReservation', () => {
    it('should complete a reservation successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const result = await completeReservation('reservation-123', 'order-456')

      expect(result).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('complete_reservation', {
        p_reservation_id: 'reservation-123',
        p_order_id: 'order-456',
      })
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Reservation completed')
      )
    })

    it('should handle errors when completing reservation', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Reservation already completed' },
      })

      await expect(
        completeReservation('reservation-123', 'order-456')
      ).rejects.toThrow('Error al completar reserva')

      expect(console.error).toHaveBeenCalledWith(
        'Error completing reservation:',
        expect.any(Object)
      )
    })
  })

  describe('cleanupExpiredReservations', () => {
    it('should return count of cleaned up reservations', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 5,
        error: null,
      })

      const count = await cleanupExpiredReservations()

      expect(count).toBe(5)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('cleanup_expired_reservations')
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 5 expired reservations')
      )
    })

    it('should return 0 when no expired reservations', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 0,
        error: null,
      })

      const count = await cleanupExpiredReservations()

      expect(count).toBe(0)
      // No debería loguear nada cuando count es 0
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up')
      )
    })

    it('should handle database errors during cleanup', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(cleanupExpiredReservations()).rejects.toThrow(
        'Error al limpiar reservas expiradas'
      )

      expect(console.error).toHaveBeenCalledWith(
        'Error cleaning up expired reservations:',
        expect.any(Object)
      )
    })
  })

  describe('getUserReservations', () => {
    // TODO: Estos tests requieren un mock más sofisticado de Supabase query chains
    // El código hace query = query.eq() múltiples veces y nuestro mock actual no lo maneja
    it.skip('should get reservations for a user', async () => {
      const mockReservations = [
        createMockStockReservation({ user_id: 'user-123', status: 'active' }),
        createMockStockReservation({ user_id: 'user-123', status: 'active' }),
      ]

      // Mock la cadena completa - el código hace query = query.eq() varias veces
      const createMockChain = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      })

      const finalQuery = {
        ...createMockChain(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockReservations,
          error: null,
        }),
      }

      mockSupabaseClient.from = jest.fn().mockReturnValue(finalQuery)

      const reservations = await getUserReservations({ userId: 'user-123' })

      expect(reservations).toEqual(mockReservations)
      expect(reservations).toHaveLength(2)
    })

    it.skip('should get reservations for a session', async () => {
      const mockReservations = [createMockStockReservation({ session_id: 'session-abc' })]

      const finalQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockReservations,
          error: null,
        }),
      }

      mockSupabaseClient.from = jest.fn().mockReturnValue(finalQuery)

      const reservations = await getUserReservations({ sessionId: 'session-abc' })

      expect(reservations).toEqual(mockReservations)
    })

    it('should throw error if neither userId nor sessionId provided', async () => {
      await expect(getUserReservations({})).rejects.toThrow(
        'Debe proporcionar userId o sessionId'
      )
    })

    it.skip('should handle database errors', async () => {
      const finalQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      mockSupabaseClient.from = jest.fn().mockReturnValue(finalQuery)

      await expect(getUserReservations({ userId: 'user-123' })).rejects.toThrow(
        'Error al obtener reservas'
      )
    })
  })

  describe('getAllActiveReservations', () => {
    it('should return all active reservations', async () => {
      const mockReservations = [
        createMockStockReservation({ status: 'active' }),
        createMockStockReservation({ status: 'active' }),
        createMockStockReservation({ status: 'active' }),
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockReservations,
          error: null,
        }),
      }

      mockSupabaseClient.from = jest.fn().mockReturnValue(mockQuery)

      const reservations = await getAllActiveReservations()

      expect(reservations).toEqual(mockReservations)
      expect(reservations).toHaveLength(3)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('active_reservations')
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      mockSupabaseClient.from = jest.fn().mockReturnValue(mockQuery)

      await expect(getAllActiveReservations()).rejects.toThrow(
        'Error al obtener reservas activas'
      )
    })
  })

  describe('reserveCartStock', () => {
    it('should reserve stock for multiple items successfully', async () => {
      // Mock reserveStock para retornar IDs diferentes
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 'reservation-1', error: null })
        .mockResolvedValueOnce({ data: 'reservation-2', error: null })
        .mockResolvedValueOnce({ data: 'reservation-3', error: null })

      const items = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
        { variantId: 'var-1', quantity: 3 },
      ]

      const reservationIds = await reserveCartStock({
        items,
        userId: 'user-123',
      })

      expect(reservationIds).toEqual(['reservation-1', 'reservation-2', 'reservation-3'])
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3)
    })

    it('should rollback reservations if one fails', async () => {
      // Primeras dos reservas exitosas, tercera falla
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 'reservation-1', error: null })
        .mockResolvedValueOnce({ data: 'reservation-2', error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Stock insuficiente' },
        })
        // Mocks para rollback
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })

      const items = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
        { productId: 'prod-3', quantity: 100 }, // Esta fallará
      ]

      await expect(
        reserveCartStock({
          items,
          userId: 'user-123',
        })
      ).rejects.toThrow('Stock insuficiente')

      // Verificar que se intentó hacer rollback (release de las 2 reservas exitosas)
      // 3 reserve_stock + 2 release_reservation = 5 llamadas total
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(5)
    })

    it('should handle empty items array', async () => {
      const reservationIds = await reserveCartStock({
        items: [],
        userId: 'user-123',
      })

      expect(reservationIds).toEqual([])
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled()
    })

    it('should continue rollback even if release fails', async () => {
      // Dos reservas exitosas, tercera falla
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 'reservation-1', error: null })
        .mockResolvedValueOnce({ data: 'reservation-2', error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Stock insuficiente' },
        })
        // Rollback: primer release falla, segundo exitoso
        .mockResolvedValueOnce({ data: null, error: { message: 'Error' } })
        .mockResolvedValueOnce({ data: true, error: null })

      const items = [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 1 },
        { productId: 'prod-3', quantity: 100 },
      ]

      await expect(
        reserveCartStock({
          items,
          userId: 'user-123',
        })
      ).rejects.toThrow('Stock insuficiente')

      // Debería intentar liberar ambas reservas a pesar del primer error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error rolling back'),
        expect.any(Error)
      )
    })
  })

  describe('completeCartReservations', () => {
    it('should complete all reservations successfully', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })

      const reservationIds = ['res-1', 'res-2', 'res-3']

      await completeCartReservations(reservationIds, 'order-456')

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('complete_reservation', {
        p_reservation_id: 'res-1',
        p_order_id: 'order-456',
      })
    })

    it('should throw error if any completion fails', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Reservation expired' },
        })

      const reservationIds = ['res-1', 'res-2']

      await expect(
        completeCartReservations(reservationIds, 'order-456')
      ).rejects.toThrow('Error al completar reserva')

      // Solo debería intentar completar hasta que falle
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2)
    })

    it('should handle empty reservation IDs', async () => {
      await completeCartReservations([], 'order-456')

      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled()
    })
  })

  describe('checkStockAvailability', () => {
    it('should return available=true when all items have sufficient stock', async () => {
      // Mock para cada item
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 10, error: null })
        .mockResolvedValueOnce({ data: 5, error: null })
        .mockResolvedValueOnce({ data: 20, error: null })

      const items = [
        { productId: 'prod-1', quantity: 5 },
        { productId: 'prod-2', quantity: 3 },
        { variantId: 'var-1', quantity: 10 },
      ]

      const result = await checkStockAvailability(items)

      expect(result.available).toBe(true)
      expect(result.unavailableItems).toEqual([])
    })

    it('should return available=false with unavailable items list', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 10, error: null }) // Suficiente
        .mockResolvedValueOnce({ data: 2, error: null })  // Insuficiente (requested: 5)
        .mockResolvedValueOnce({ data: 0, error: null })  // Sin stock

      const items = [
        { productId: 'prod-1', quantity: 5 },
        { productId: 'prod-2', quantity: 5 },
        { variantId: 'var-1', quantity: 2 },
      ]

      const result = await checkStockAvailability(items)

      expect(result.available).toBe(false)
      expect(result.unavailableItems).toHaveLength(2)
      expect(result.unavailableItems).toEqual([
        {
          productId: 'prod-2',
          variantId: undefined,
          requested: 5,
          available: 2,
        },
        {
          productId: undefined,
          variantId: 'var-1',
          requested: 2,
          available: 0,
        },
      ])
    })

    it('should handle empty items array', async () => {
      const result = await checkStockAvailability([])

      expect(result.available).toBe(true)
      expect(result.unavailableItems).toEqual([])
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled()
    })

    it('should check stock for each item independently', async () => {
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: 5, error: null })
        .mockResolvedValueOnce({ data: 0, error: null })

      const items = [
        { productId: 'prod-1', quantity: 3 },
        { productId: 'prod-2', quantity: 1 },
      ]

      const result = await checkStockAvailability(items)

      expect(result.available).toBe(false)
      expect(result.unavailableItems).toHaveLength(1)
      expect(result.unavailableItems[0].productId).toBe('prod-2')
    })
  })
})
