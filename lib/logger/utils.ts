import { Logger } from 'pino'

/**
 * Wrapper para ejecutar funciones async con logging automático
 */
export async function withLogging<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now()

  logger.debug({ operation, ...metadata }, `Starting ${operation}`)

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    logger.info(
      { operation, duration, ...metadata },
      `Completed ${operation} in ${duration}ms`
    )

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorObj = error instanceof Error ? error : new Error(String(error))

    logger.error(
      {
        operation,
        duration,
        error: {
          message: errorObj.message,
          stack: errorObj.stack,
          name: errorObj.name,
        },
        ...metadata,
      },
      `Failed ${operation} after ${duration}ms`
    )

    throw error
  }
}

/**
 * Decorator para server actions con logging automático
 */
export function logAction(actionName: string, logger: Logger) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: T
  ): T {
    return (async (...args: any[]) => {
      return withLogging(
        logger,
        actionName,
        () => target(...args),
        { args: sanitizeArgs(args) }
      )
    }) as T
  }
}

/**
 * Sanitiza argumentos para logging (remueve datos sensibles)
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg !== 'object' || arg === null) {
      return arg
    }

    const sanitized = { ...arg }
    const sensitiveKeys = ['password', 'token', 'creditCard', 'cvv', 'accessToken', 'refreshToken']

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  })
}

/**
 * Helper para logging de queries de base de datos
 */
export function logDatabaseQuery(
  logger: Logger,
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  duration?: number,
  metadata?: Record<string, any>
) {
  logger.debug(
    {
      table,
      operation,
      duration,
      ...metadata,
    },
    `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`
  )
}

/**
 * Helper para logging de cache hits/misses
 */
export function logCacheOperation(
  logger: Logger,
  operation: 'HIT' | 'MISS' | 'SET' | 'DELETE',
  key: string,
  metadata?: Record<string, any>
) {
  const level = operation === 'HIT' ? 'debug' : 'info'

  logger[level](
    {
      operation,
      key,
      ...metadata,
    },
    `Cache ${operation}: ${key}`
  )
}

/**
 * Helper para logging de HTTP requests
 */
export interface HttpRequestLog {
  method: string
  url: string
  statusCode?: number
  duration?: number
  userAgent?: string
  ip?: string
  userId?: string
  error?: Error
}

export function logHttpRequest(logger: Logger, data: HttpRequestLog) {
  const { method, url, statusCode, duration, error, ...metadata } = data

  if (error) {
    logger.error(
      {
        method,
        url,
        statusCode,
        duration,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...metadata,
      },
      `${method} ${url} - ${statusCode} (${duration}ms) - ERROR`
    )
  } else if (statusCode && statusCode >= 400) {
    logger.warn(
      {
        method,
        url,
        statusCode,
        duration,
        ...metadata,
      },
      `${method} ${url} - ${statusCode} (${duration}ms)`
    )
  } else {
    logger.info(
      {
        method,
        url,
        statusCode,
        duration,
        ...metadata,
      },
      `${method} ${url} - ${statusCode} (${duration}ms)`
    )
  }
}

/**
 * Helper para logging de jobs de queue
 */
export interface QueueJobLog {
  jobId: string
  jobName: string
  queueName: string
  status: 'started' | 'completed' | 'failed' | 'retry'
  duration?: number
  attempt?: number
  error?: Error
  data?: Record<string, any>
}

export function logQueueJob(logger: Logger, data: QueueJobLog) {
  const { jobId, jobName, queueName, status, duration, attempt, error, data: jobData } = data

  const metadata = {
    jobId,
    jobName,
    queueName,
    duration,
    attempt,
    data: jobData,
  }

  switch (status) {
    case 'started':
      logger.info(metadata, `Job started: ${jobName} (${jobId})`)
      break

    case 'completed':
      logger.info(metadata, `Job completed: ${jobName} (${jobId}) in ${duration}ms`)
      break

    case 'failed':
      logger.error(
        {
          ...metadata,
          error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : undefined,
        },
        `Job failed: ${jobName} (${jobId}) - ${error?.message}`
      )
      break

    case 'retry':
      logger.warn(
        {
          ...metadata,
          error: error ? {
            message: error.message,
            name: error.name,
          } : undefined,
        },
        `Job retry: ${jobName} (${jobId}) - Attempt ${attempt}`
      )
      break
  }
}

/**
 * Helper para logging de operaciones de pago
 */
export interface PaymentLog {
  orderId: string
  amount: number
  currency: string
  provider: string
  status: 'initiated' | 'success' | 'failed' | 'refunded'
  transactionId?: string
  error?: Error
  metadata?: Record<string, any>
}

export function logPayment(logger: Logger, data: PaymentLog) {
  const { orderId, amount, currency, provider, status, transactionId, error, metadata } = data

  const logData = {
    orderId,
    amount,
    currency,
    provider,
    transactionId,
    ...metadata,
  }

  switch (status) {
    case 'initiated':
      logger.info(logData, `Payment initiated: ${orderId} - ${amount} ${currency}`)
      break

    case 'success':
      logger.info(logData, `Payment successful: ${orderId} - ${amount} ${currency}`)
      break

    case 'failed':
      logger.error(
        {
          ...logData,
          error: error ? {
            message: error.message,
            stack: error.stack,
          } : undefined,
        },
        `Payment failed: ${orderId} - ${error?.message}`
      )
      break

    case 'refunded':
      logger.info(logData, `Payment refunded: ${orderId} - ${amount} ${currency}`)
      break
  }
}
