import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { getAllActiveReservations } from '@/lib/stock/reservations'

/**
 * GET /api/admin/reservations
 * Obtiene todas las reservas activas
 */
export async function GET() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    const reservations = await getAllActiveReservations()

    return NextResponse.json({
      reservations,
      count: reservations.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    )
  }
}
