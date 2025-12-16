import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { cleanupExpiredReservations } from '@/lib/stock/reservations'

/**
 * POST /api/admin/reservations/cleanup
 * Ejecuta limpieza manual de reservas expiradas
 */
export async function POST() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    const count = await cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      reservationsExpired: count,
      message: `${count} reservas expiradas limpiadas`,
    })
  } catch (error) {
    console.error('Error cleaning up reservations:', error)
    return NextResponse.json(
      { error: 'Error al limpiar reservas' },
      { status: 500 }
    )
  }
}
