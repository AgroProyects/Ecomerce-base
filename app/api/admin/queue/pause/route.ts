import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth-validation'
import { pauseEmailQueue, resumeEmailQueue } from '@/lib/queue/email-queue'

/**
 * POST /api/admin/queue/pause
 * Pausa la email queue
 */
export async function POST() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    await pauseEmailQueue()

    return NextResponse.json({
      success: true,
      message: 'Email queue paused',
    })
  } catch (error) {
    console.error('Error pausing queue:', error)
    return NextResponse.json({ error: 'Error al pausar la queue' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/queue/pause
 * Resume la email queue
 */
export async function DELETE() {
  try {
    // Validar que el usuario sea admin
    const sessionOrError = await requireAdmin()
    if (sessionOrError instanceof NextResponse) return sessionOrError

    await resumeEmailQueue()

    return NextResponse.json({
      success: true,
      message: 'Email queue resumed',
    })
  } catch (error) {
    console.error('Error resuming queue:', error)
    return NextResponse.json({ error: 'Error al resumir la queue' }, { status: 500 })
  }
}
