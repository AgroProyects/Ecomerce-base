/**
 * Cleanup Queue usando BullMQ
 * Jobs periódicos para mantenimiento del sistema
 */

import { Queue } from 'bullmq'
import { redisConnection } from './redis-connection'

/**
 * Queue para jobs de limpieza y mantenimiento
 */
export const cleanupQueue = new Queue('cleanup', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60 * 24 * 7, // Mantener completados por 7 días
      count: 100,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7, // Mantener fallidos por 7 días
    },
  },
})

/**
 * Tipos de cleanup jobs
 */
export enum CleanupJobType {
  EXPIRED_RESERVATIONS = 'expired_reservations',
  OLD_EMAIL_JOBS = 'old_email_jobs',
  EXPIRED_COUPONS = 'expired_coupons',
}

/**
 * Agregar job de limpieza de reservas expiradas
 * Se ejecuta cada 5 minutos
 */
export async function scheduleReservationsCleanup() {
  await cleanupQueue.add(
    CleanupJobType.EXPIRED_RESERVATIONS,
    {},
    {
      repeat: {
        every: 5 * 60 * 1000, // Cada 5 minutos
      },
      jobId: 'cleanup-reservations', // ID único para evitar duplicados
    }
  )

  console.log('✓ Scheduled: Cleanup expired reservations (every 5 minutes)')
}

/**
 * Agregar job de limpieza de email jobs viejos
 * Se ejecuta cada día a las 3 AM
 */
export async function scheduleEmailJobsCleanup() {
  await cleanupQueue.add(
    CleanupJobType.OLD_EMAIL_JOBS,
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Cron: 3 AM cada día
      },
      jobId: 'cleanup-email-jobs',
    }
  )

  console.log('✓ Scheduled: Cleanup old email jobs (daily at 3 AM)')
}

/**
 * Obtener estadísticas de la cleanup queue
 */
export async function getCleanupQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    cleanupQueue.getWaitingCount(),
    cleanupQueue.getActiveCount(),
    cleanupQueue.getCompletedCount(),
    cleanupQueue.getFailedCount(),
    cleanupQueue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Cerrar cleanup queue (shutdown)
 */
export async function closeCleanupQueue() {
  await cleanupQueue.close()
  console.log('✓ Cleanup queue closed')
}

// Event listeners para debugging
// Nota: En BullMQ v5+, los eventos 'completed' y 'failed' solo están disponibles en Worker, no en Queue
// Los event listeners se deben configurar en cleanup-worker.ts
