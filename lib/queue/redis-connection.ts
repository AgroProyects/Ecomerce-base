/**
 * Redis Connection para BullMQ
 * Configuración centralizada de conexión Redis usando ioredis
 */

import { Redis } from 'ioredis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son requeridas')
}

/**
 * Parsear URL de Upstash Redis REST a formato compatible con ioredis
 * Upstash REST URL format: https://user-region.upstash.io
 */
function parseUpstashUrl(restUrl: string): { host: string; port: number; password: string } {
  const url = new URL(restUrl)

  // Upstash usa TLS en puerto 6379 o el puerto especificado
  const host = url.hostname
  const port = url.port ? parseInt(url.port) : 6379

  return {
    host,
    port,
    password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }
}

const upstashConfig = parseUpstashUrl(process.env.UPSTASH_REDIS_REST_URL)

/**
 * Configuración de Redis para BullMQ
 * Usa ioredis en lugar de @upstash/redis para compatibilidad con BullMQ
 */
export const redisConnection = new Redis({
  host: upstashConfig.host,
  port: upstashConfig.port,
  password: upstashConfig.password,
  maxRetriesPerRequest: null, // Requerido por BullMQ
  enableReadyCheck: false,
  tls: {
    // Upstash requiere TLS
    rejectUnauthorized: false,
  },
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// Manejar eventos de conexión
redisConnection.on('connect', () => {
  console.log('✓ BullMQ Redis: Connected')
})

redisConnection.on('error', (error) => {
  console.error('✗ BullMQ Redis Error:', error)
})

redisConnection.on('close', () => {
  console.log('⚠ BullMQ Redis: Connection closed')
})

// Exportar configuración para crear múltiples conexiones si es necesario
export const redisOptions = {
  host: upstashConfig.host,
  port: upstashConfig.port,
  password: upstashConfig.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false,
  },
}
