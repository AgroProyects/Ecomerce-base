import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { cleanEmailQueue } from '@/lib/queue/email-queue'

/**
 * POST /api/admin/queue/clean
 * Limpia jobs viejos de la email queue
 */
export async function POST() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    await cleanEmailQueue()

    return NextResponse.json({
      success: true,
      message: 'Email queue cleaned',
    })
  } catch (error) {
    console.error('Error cleaning queue:', error)
    return NextResponse.json({ error: 'Error al limpiar la queue' }, { status: 500 })
  }
}
