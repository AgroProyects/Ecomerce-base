/**
 * Redis Cache Utility
 * Usa la misma instancia de Upstash Redis que rate limiting
 */

import { Redis } from '@upstash/redis'
import { cacheLogger } from '@/lib/logger/config'
import { logCacheOperation } from '@/lib/logger/utils'

// Reutilizar la misma conexión de Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Obtiene datos con cache automático
 *
 * @param key - Cache key único
 * @param fetcher - Función que obtiene los datos si no están en cache
 * @param ttl - Time to live en segundos (default: 300 = 5 minutos)
 * @returns Datos (del cache o fetcher)
 *
 * @example
 * ```typescript
 * const products = await getCachedData(
 *   'products:all',
 *   async () => {
 *     const { data } = await supabase.from('products').select('*')
 *     return data
 *   },
 *   300 // 5 minutos
 * )
 * ```
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    // Intentar obtener de cache
    const cached = await redis.get<T>(key)

    if (cached !== null) {
      logCacheOperation(cacheLogger, 'HIT', key)
      return cached
    }

    logCacheOperation(cacheLogger, 'MISS', key)

    // Si no existe en cache, ejecutar fetcher
    const fresh = await fetcher()

    // Guardar en cache con TTL
    await redis.setex(key, ttl, JSON.stringify(fresh))
    logCacheOperation(cacheLogger, 'SET', key, { ttl })

    return fresh
  } catch (error) {
    cacheLogger.error({ error, key }, 'Cache error - falling back to direct fetch')
    // Si falla el cache, ejecutar fetcher directamente (fail-safe)
    return fetcher()
  }
}

/**
 * Invalida múltiples cache keys que coincidan con un patrón
 *
 * @param pattern - Patrón de búsqueda (soporta wildcards *)
 *
 * @example
 * ```typescript
 * // Invalidar todo el cache de productos
 * await invalidateCache('products:*')
 *
 * // Invalidar cache de una categoría específica
 * await invalidateCache('products:category:123:*')
 * ```
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // Obtener todas las keys que coincidan con el patrón
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      // Eliminar todas las keys
      await redis.del(...keys)
      logCacheOperation(cacheLogger, 'DELETE', pattern, { count: keys.length })
    } else {
      cacheLogger.debug({ pattern }, 'No cache keys found matching pattern')
    }
  } catch (error) {
    cacheLogger.error({ error, pattern }, 'Error invalidating cache pattern')
  }
}

/**
 * Invalida una cache key específica
 *
 * @param key - Cache key a invalidar
 *
 * @example
 * ```typescript
 * await invalidateCacheKey('products:all')
 * ```
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  try {
    const result = await redis.del(key)
    if (result > 0) {
      logCacheOperation(cacheLogger, 'DELETE', key)
    } else {
      cacheLogger.debug({ key }, 'Cache key not found')
    }
  } catch (error) {
    cacheLogger.error({ error, key }, 'Error invalidating cache key')
  }
}

/**
 * Invalida múltiples cache keys específicas
 *
 * @param keys - Array de cache keys a invalidar
 *
 * @example
 * ```typescript
 * await invalidateCacheKeys([
 *   'products:all',
 *   'products:featured',
 *   'categories:all'
 * ])
 * ```
 */
export async function invalidateCacheKeys(keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      const result = await redis.del(...keys)
      cacheLogger.info({ count: result, keys }, `Invalidated ${result} cache keys`)
    }
  } catch (error) {
    cacheLogger.error({ error, keys }, 'Error invalidating cache keys')
  }
}

/**
 * Obtiene el tiempo de vida restante de una cache key
 *
 * @param key - Cache key
 * @returns TTL en segundos, -1 si no existe, -2 si no tiene TTL
 */
export async function getCacheTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key)
  } catch (error) {
    cacheLogger.error({ error, key }, 'Error getting cache TTL')
    return -1
  }
}

/**
 * Verifica si una cache key existe
 *
 * @param key - Cache key
 * @returns true si existe, false si no
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    cacheLogger.error({ error, key }, 'Error checking cache existence')
    return false
  }
}

/**
 * TTL preconfigurados para diferentes tipos de datos
 */
export const CacheTTL = {
  // Datos que cambian raramente
  STATIC: 60 * 60 * 24, // 24 horas
  SETTINGS: 60 * 60, // 1 hora

  // Datos que cambian ocasionalmente
  PRODUCTS: 60 * 5, // 5 minutos
  CATEGORIES: 60 * 10, // 10 minutos
  FEATURED_PRODUCTS: 60 * 5, // 5 minutos

  // Datos que cambian frecuentemente
  CART: 60 * 2, // 2 minutos
  STOCK: 60, // 1 minuto

  // Datos en tiempo real
  ANALYTICS: 30, // 30 segundos
} as const

/**
 * Prefijos de cache keys para organización
 */
export const CacheKey = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  FEATURED: 'featured',
  ANALYTICS: 'analytics',
  CART: 'cart',
} as const
