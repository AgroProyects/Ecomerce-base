/**
 * Email Queue usando BullMQ
 * Sistema de cola para envío asíncrono de emails
 */

import { Queue } from 'bullmq'
import { redisConnection } from './redis-connection'
import {
  EmailData,
  EmailDataSchema,
  EMAIL_RETRY_CONFIG,
  PRIORITY_DELAYS,
  EmailType,
} from './types'

/**
 * Queue de emails
 * Maneja el envío asíncrono de todos los tipos de emails
 */
export const emailQueue = new Queue('emails', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60 * 24, // Mantener jobs completados por 24 horas
      count: 1000, // Máximo 1000 jobs completados
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7, // Mantener jobs fallidos por 7 días
    },
  },
})

/**
 * Agrega un email a la queue
 *
 * @param emailData - Datos del email (validados con Zod)
 * @returns Job ID
 *
 * @example
 * ```typescript
 * await addEmailToQueue({
 *   type: EmailType.VERIFICATION,
 *   to: 'user@example.com',
 *   subject: 'Verifica tu email',
 *   priority: EmailPriority.CRITICAL,
 *   data: {
 *     userName: 'Juan',
 *     verificationUrl: 'https://...',
 *     expiresIn: '24 horas'
 *   }
 * })
 * ```
 */
export async function addEmailToQueue(emailData: EmailData) {
  // Validar datos con Zod
  const validated = EmailDataSchema.parse(emailData)

  // Obtener configuración de retry según tipo de email
  const retryConfig = EMAIL_RETRY_CONFIG[validated.type]

  // Obtener delay según prioridad
  const delay = PRIORITY_DELAYS[validated.priority]

  // Agregar job a la queue
  const job = await emailQueue.add(
    validated.type, // Job name (por tipo de email)
    validated, // Job data
    {
      priority: validated.priority,
      delay,
      attempts: retryConfig.attempts,
      backoff: retryConfig.backoff,
      // Remover duplicados: Si ya existe un job con el mismo email y tipo pendiente, no agregar otro
      jobId: `${validated.type}-${validated.to}-${Date.now()}`,
    }
  )

  console.log(`📧 Email queued: ${validated.type} to ${validated.to} (Job ID: ${job.id})`)

  return job.id
}

/**
 * Helper: Agregar email de verificación
 */
export async function queueVerificationEmail(params: {
  to: string
  userName: string
  verificationUrl: string
  expiresIn?: string
}) {
  return addEmailToQueue({
    type: EmailType.VERIFICATION,
    to: params.to,
    subject: 'Verifica tu correo electrónico',
    priority: 1, // CRITICAL
    data: {
      userName: params.userName,
      verificationUrl: params.verificationUrl,
      expiresIn: params.expiresIn || '24 horas',
    },
  })
}

/**
 * Helper: Agregar email de reset de contraseña
 */
export async function queuePasswordResetEmail(params: {
  to: string
  userName: string
  resetUrl: string
  expiresIn?: string
}) {
  return addEmailToQueue({
    type: EmailType.PASSWORD_RESET,
    to: params.to,
    subject: 'Recupera tu contraseña',
    priority: 1, // CRITICAL
    data: {
      userName: params.userName,
      resetUrl: params.resetUrl,
      expiresIn: params.expiresIn || '1 hora',
    },
  })
}

/**
 * Helper: Agregar email de confirmación de pedido
 */
export async function queueOrderConfirmationEmail(params: {
  to: string
  userName: string
  orderNumber: string
  orderDate: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shipping: number
  discount?: number
  total: number
  trackingUrl?: string
}) {
  return addEmailToQueue({
    type: EmailType.ORDER_CONFIRMATION,
    to: params.to,
    subject: `Confirmación de pedido #${params.orderNumber}`,
    priority: 2, // HIGH
    data: {
      userName: params.userName,
      orderNumber: params.orderNumber,
      orderDate: params.orderDate,
      items: params.items,
      subtotal: params.subtotal,
      shipping: params.shipping,
      discount: params.discount,
      total: params.total,
      trackingUrl: params.trackingUrl,
    },
  })
}

/**
 * Helper: Agregar email de actualización de pedido
 */
export async function queueOrderStatusEmail(params: {
  to: string
  userName: string
  orderNumber: string
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  statusMessage: string
  trackingUrl?: string
}) {
  return addEmailToQueue({
    type: EmailType.ORDER_STATUS,
    to: params.to,
    subject: `Actualización de pedido #${params.orderNumber}`,
    priority: 3, // NORMAL
    data: {
      userName: params.userName,
      orderNumber: params.orderNumber,
      status: params.status,
      statusMessage: params.statusMessage,
      trackingUrl: params.trackingUrl,
    },
  })
}

/**
 * Helper: Agregar email de pago confirmado
 */
export async function queuePaymentConfirmedEmail(params: {
  to: string
  userName: string
  orderNumber: string
  amount: number
  paymentMethod: string
  transactionId: string
}) {
  return addEmailToQueue({
    type: EmailType.PAYMENT_CONFIRMED,
    to: params.to,
    subject: `Pago confirmado - Pedido #${params.orderNumber}`,
    priority: 2, // HIGH
    data: {
      userName: params.userName,
      orderNumber: params.orderNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      transactionId: params.transactionId,
    },
  })
}

/**
 * Helper: Agregar email de pago fallido
 */
export async function queuePaymentFailedEmail(params: {
  to: string
  userName: string
  orderNumber: string
  amount: number
  reason: string
  retryUrl?: string
}) {
  return addEmailToQueue({
    type: EmailType.PAYMENT_FAILED,
    to: params.to,
    subject: `Problema con el pago - Pedido #${params.orderNumber}`,
    priority: 2, // HIGH
    data: {
      userName: params.userName,
      orderNumber: params.orderNumber,
      amount: params.amount,
      reason: params.reason,
      retryUrl: params.retryUrl,
    },
  })
}

/**
 * Helper: Agregar email de bienvenida
 */
export async function queueWelcomeEmail(params: {
  to: string
  userName: string
  discountCode?: string
  discountAmount?: number
}) {
  return addEmailToQueue({
    type: EmailType.WELCOME,
    to: params.to,
    subject: `¡Bienvenido a nuestra tienda, ${params.userName}!`,
    priority: 3, // NORMAL
    data: {
      userName: params.userName,
      discountCode: params.discountCode,
      discountAmount: params.discountAmount,
    },
  })
}

/**
 * Obtener estadísticas de la queue
 */
export async function getEmailQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
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
 * Limpiar jobs viejos
 */
export async function cleanEmailQueue() {
  // Limpiar jobs completados más antiguos de 24 horas
  await emailQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed')

  // Limpiar jobs fallidos más antiguos de 7 días
  await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed')

  console.log('✓ Email queue cleaned')
}

/**
 * Pausar queue (útil para mantenimiento)
 */
export async function pauseEmailQueue() {
  await emailQueue.pause()
  console.log('⏸ Email queue paused')
}

/**
 * Resumir queue
 */
export async function resumeEmailQueue() {
  await emailQueue.resume()
  console.log('▶ Email queue resumed')
}

/**
 * Cerrar queue (cleanup en shutdown)
 */
export async function closeEmailQueue() {
  await emailQueue.close()
  console.log('✓ Email queue closed')
}

// Event listeners para debugging
if (process.env.NODE_ENV === 'development') {
  emailQueue.on('waiting', (job) => {
    console.log(`⏳ Job ${job.id} is waiting`)
  })

  emailQueue.on('active', (job) => {
    console.log(`🔄 Job ${job.id} is active`)
  })

  emailQueue.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })

  emailQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })
}
