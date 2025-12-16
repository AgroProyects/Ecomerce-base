/**
 * Configuración de Logger con Pino
 * Logging estructurado para producción y desarrollo
 */

import pino from 'pino'

/**
 * Configuración del logger según el entorno
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Logger principal de la aplicación
 */
export const logger = pino({
  // Nivel de log según entorno
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Configuración base
  name: 'ecommerce-base',

  // Formateo para desarrollo (pretty print)
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Configuración para producción (JSON estructurado)
  ...(isProduction && {
    formatters: {
      level: (label) => {
        return { level: label }
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),

  // Configuración base para todos los entornos
  base: {
    env: process.env.NODE_ENV,
  },

  // Redactar información sensible
  redact: {
    paths: [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
      'email', // Solo redactar en producción si es necesario
    ],
    remove: true, // Eliminar completamente en lugar de [Redacted]
  },

  // Serializers personalizados
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      // NO incluir headers por defecto (pueden tener tokens)
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
})

/**
 * Logger para requests HTTP (API routes)
 */
export const httpLogger = logger.child({ module: 'http' })

/**
 * Logger para server actions
 */
export const actionLogger = logger.child({ module: 'action' })

/**
 * Logger para workers (email, cleanup)
 */
export const workerLogger = logger.child({ module: 'worker' })

/**
 * Logger para base de datos
 */
export const dbLogger = logger.child({ module: 'database' })

/**
 * Logger para autenticación
 */
export const authLogger = logger.child({ module: 'auth' })

/**
 * Logger para pagos
 */
export const paymentLogger = logger.child({ module: 'payment' })

/**
 * Logger para emails
 */
export const emailLogger = logger.child({ module: 'email' })

/**
 * Logger para cache
 */
export const cacheLogger = logger.child({ module: 'cache' })

/**
 * Helper: Crear child logger personalizado
 */
export function createLogger(module: string, context?: Record<string, any>) {
  return logger.child({
    module,
    ...context,
  })
}

/**
 * Helper: Log de timing de operaciones
 */
export function logTiming(
  logger: pino.Logger,
  operation: string,
  startTime: number,
  metadata?: Record<string, any>
) {
  const duration = Date.now() - startTime

  logger.info({
    operation,
    duration,
    ...metadata,
  }, `${operation} completed in ${duration}ms`)

  // Warning si la operación tarda mucho
  if (duration > 5000) {
    logger.warn({
      operation,
      duration,
      ...metadata,
    }, `Slow operation: ${operation} took ${duration}ms`)
  }
}

/**
 * Helper: Log de errores estructurado
 */
export function logError(
  logger: pino.Logger,
  error: Error | unknown,
  context?: Record<string, any>
) {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.error({
    err,
    ...context,
  }, err.message)
}

/**
 * Helper: Log de métricas
 */
export function logMetric(
  logger: pino.Logger,
  metric: string,
  value: number,
  unit?: string,
  metadata?: Record<string, any>
) {
  logger.info({
    metric,
    value,
    unit,
    ...metadata,
  }, `Metric: ${metric} = ${value}${unit ? ` ${unit}` : ''}`)
}

// Exportar logger por defecto
export default logger
