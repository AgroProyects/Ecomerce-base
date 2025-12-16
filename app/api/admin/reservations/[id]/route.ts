import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { releaseReservation } from '@/lib/stock/reservations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/admin/reservations/[id]
 * Libera/cancela una reserva manualmente
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    const { id } = await params

    await releaseReservation(id, 'cancelled')

    return NextResponse.json({
      success: true,
      message: 'Reserva liberada exitosamente',
    })
  } catch (error) {
    console.error('Error releasing reservation:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al liberar reserva',
      },
      { status: 500 }
    )
  }
}
