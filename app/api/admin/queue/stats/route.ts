import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { getEmailQueueStats } from '@/lib/queue/email-queue'

/**
 * GET /api/admin/queue/stats
 * Obtiene estadísticas de la email queue
 */
export async function GET() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    const stats = await getEmailQueueStats()

    return NextResponse.json({
      queue: 'emails',
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de la queue' },
      { status: 500 }
    )
  }
}
