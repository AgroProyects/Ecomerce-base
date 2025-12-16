#!/usr/bin/env tsx

/**
 * Script para iniciar el Email Worker
 * Procesa la queue de emails en background
 *
 * Uso:
 * npm run worker:email
 */

import '../lib/queue/email-worker'

console.log('✓ Email Worker script loaded')
console.log('🔄 Processing emails...')

// Keep process alive
process.stdin.resume()
