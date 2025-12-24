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
import { workerLogger } from '@/lib/logger/config'
import { logQueueJob } from '@/lib/logger/utils'

/**
 * Procesar job de limpieza
 */
async function processCleanupJob(job: Job) {
  const startTime = Date.now()

  logQueueJob(workerLogger, {
    jobId: job.id!,
    jobName: job.name,
    queueName: 'cleanup',
    status: 'started',
  })

  try {
    let result
    switch (job.name) {
      case CleanupJobType.EXPIRED_RESERVATIONS:
        result = await cleanupExpiredReservationsJob()
        break

      case CleanupJobType.OLD_EMAIL_JOBS:
        result = await cleanupOldEmailJobsJob()
        break

      default:
        throw new Error(`Unknown cleanup job type: ${job.name}`)
    }

    const duration = Date.now() - startTime

    logQueueJob(workerLogger, {
      jobId: job.id!,
      jobName: job.name,
      queueName: 'cleanup',
      status: 'completed',
      duration,
      data: result,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorObj = error instanceof Error ? error : new Error(String(error))

    logQueueJob(workerLogger, {
      jobId: job.id!,
      jobName: job.name,
      queueName: 'cleanup',
      status: 'failed',
      duration,
      error: errorObj,
    })

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
  workerLogger.debug({ jobName: job.name, result }, 'Cleanup job completed')
})

cleanupWorker.on('failed', (job, err) => {
  if (!job) return
  workerLogger.error(
    { jobName: job.name, error: { message: err.message, name: err.name } },
    'Cleanup job failed'
  )
})

cleanupWorker.on('error', (err) => {
  workerLogger.error({ error: err }, 'Cleanup worker error')
  Sentry.captureException(err, {
    tags: { module: 'cleanup-queue', type: 'worker_error' },
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  workerLogger.info('SIGTERM received, closing cleanup worker...')
  await cleanupWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  workerLogger.info('SIGINT received, closing cleanup worker...')
  await cleanupWorker.close()
  process.exit(0)
})

workerLogger.info('Cleanup worker started')
