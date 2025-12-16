#!/usr/bin/env tsx

/**
 * Script para iniciar el Cleanup Worker
 * Procesa jobs de limpieza y mantenimiento
 *
 * Uso:
 * npm run worker:cleanup
 */

import '../lib/queue/cleanup-worker'
import { scheduleReservationsCleanup, scheduleEmailJobsCleanup } from '../lib/queue/cleanup-queue'

console.log('✓ Cleanup Worker script loaded')

// Programar jobs recurrentes
;(async () => {
  try {
    await scheduleReservationsCleanup()
    await scheduleEmailJobsCleanup()
    console.log('✓ All cleanup jobs scheduled')
    console.log('🔄 Processing cleanup jobs...')
  } catch (error) {
    console.error('❌ Error scheduling cleanup jobs:', error)
  }
})()

// Keep process alive
process.stdin.resume()
