/**
 * Cleanup Worker
 * Procesa jobs de limpieza y mantenimiento
 */

import { Worker, Job } from 'bullmq'
import { redisOptions } from './redis-connection'
import { CleanupJobType } from './cleanup-queue'
import { cleanupExpiredReservations } from '@/lib/stock/reservations'
import { cleanEmailQueue } from './email-queue'
import * as Sentry from '@sentry/nextjs'

/**
 * Procesar job de limpieza
 */
async function processCleanupJob(job: Job) {
  console.log(`🧹 Processing cleanup job: ${job.name}`)

  try {
    switch (job.name) {
      case CleanupJobType.EXPIRED_RESERVATIONS:
        return await cleanupExpiredReservationsJob()

      case CleanupJobType.OLD_EMAIL_JOBS:
        return await cleanupOldEmailJobsJob()

      default:
        throw new Error(`Unknown cleanup job type: ${job.name}`)
    }
  } catch (error) {
    console.error(`❌ Cleanup job ${job.name} failed:`, error)

    // Capturar error en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'cleanup-queue',
        job_type: job.name,
      },
      extra: {
        jobId: job.id,
        jobData: job.data,
      },
      level: 'error',
    })

    throw error
  }
}

/**
 * Job: Limpiar reservas expiradas
 */
async function cleanupExpiredReservationsJob() {
  const count = await cleanupExpiredReservations()

  return {
    jobType: CleanupJobType.EXPIRED_RESERVATIONS,
    reservationsExpired: count,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Job: Limpiar email jobs viejos
 */
async function cleanupOldEmailJobsJob() {
  await cleanEmailQueue()

  return {
    jobType: CleanupJobType.OLD_EMAIL_JOBS,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Worker que procesa cleanup jobs
 */
export const cleanupWorker = new Worker('cleanup', processCleanupJob, {
  connection: redisOptions,
  concurrency: 1, // Ejecutar jobs secuencialmente
})

// Event listeners
cleanupWorker.on('completed', (job, result) => {
  console.log(`✅ Cleanup job ${job.name} completed:`, result)
})

cleanupWorker.on('failed', (job, err) => {
  console.error(`❌ Cleanup job ${job?.name} failed:`, err.message)
})

cleanupWorker.on('error', (err) => {
  console.error('❌ Cleanup worker error:', err)
  Sentry.captureException(err, {
    tags: { module: 'cleanup-queue', type: 'worker_error' },
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏸ SIGTERM received, closing cleanup worker...')
  await cleanupWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('⏸ SIGINT received, closing cleanup worker...')
  await cleanupWorker.close()
  process.exit(0)
})

console.log('✓ Cleanup worker started')
