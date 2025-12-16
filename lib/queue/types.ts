/**
 * Tipos y schemas para Email Queue
 */

import { z } from 'zod'

/**
 * Tipos de emails que se pueden enviar
 */
export enum EmailType {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS = 'order_status',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  SHIPPING_UPDATE = 'shipping_update',
  WELCOME = 'welcome',
  NEWSLETTER = 'newsletter',
  PROMOTIONAL = 'promotional',
}

/**
 * Prioridades de emails
 */
export enum EmailPriority {
  CRITICAL = 1, // Verificación, password reset (envío inmediato)
  HIGH = 2, // Confirmaciones de pedidos
  NORMAL = 3, // Actualizaciones de estado
  LOW = 4, // Newsletters, promociones
}

/**
 * Schema base para todos los emails
 */
export const BaseEmailDataSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  type: z.nativeEnum(EmailType),
  priority: z.nativeEnum(EmailPriority).default(EmailPriority.NORMAL),
})

/**
 * Email de verificación
 */
export const VerificationEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.VERIFICATION),
  priority: z.literal(EmailPriority.CRITICAL),
  data: z.object({
    userName: z.string(),
    verificationUrl: z.string().url(),
    expiresIn: z.string().default('24 horas'),
  }),
})

/**
 * Email de reset de contraseña
 */
export const PasswordResetEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.PASSWORD_RESET),
  priority: z.literal(EmailPriority.CRITICAL),
  data: z.object({
    userName: z.string(),
    resetUrl: z.string().url(),
    expiresIn: z.string().default('1 hora'),
  }),
})

/**
 * Email de confirmación de pedido
 */
export const OrderConfirmationEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.ORDER_CONFIRMATION),
  priority: z.literal(EmailPriority.HIGH),
  data: z.object({
    userName: z.string(),
    orderNumber: z.string(),
    orderDate: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    ),
    subtotal: z.number(),
    shipping: z.number(),
    discount: z.number().optional(),
    total: z.number(),
    trackingUrl: z.string().url().optional(),
  }),
})

/**
 * Email de actualización de estado de pedido
 */
export const OrderStatusEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.ORDER_STATUS),
  priority: z.literal(EmailPriority.NORMAL),
  data: z.object({
    userName: z.string(),
    orderNumber: z.string(),
    status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
    statusMessage: z.string(),
    trackingUrl: z.string().url().optional(),
  }),
})

/**
 * Email de pago confirmado
 */
export const PaymentConfirmedEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.PAYMENT_CONFIRMED),
  priority: z.literal(EmailPriority.HIGH),
  data: z.object({
    userName: z.string(),
    orderNumber: z.string(),
    amount: z.number(),
    paymentMethod: z.string(),
    transactionId: z.string(),
  }),
})

/**
 * Email de pago fallido
 */
export const PaymentFailedEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.PAYMENT_FAILED),
  priority: z.literal(EmailPriority.HIGH),
  data: z.object({
    userName: z.string(),
    orderNumber: z.string(),
    amount: z.number(),
    reason: z.string(),
    retryUrl: z.string().url().optional(),
  }),
})

/**
 * Email de bienvenida
 */
export const WelcomeEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.WELCOME),
  priority: z.literal(EmailPriority.NORMAL),
  data: z.object({
    userName: z.string(),
    discountCode: z.string().optional(),
    discountAmount: z.number().optional(),
  }),
})

/**
 * Email promocional
 */
export const PromotionalEmailDataSchema = BaseEmailDataSchema.extend({
  type: z.literal(EmailType.PROMOTIONAL),
  priority: z.literal(EmailPriority.LOW),
  data: z.object({
    userName: z.string(),
    campaignName: z.string(),
    content: z.string(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().url().optional(),
    unsubscribeUrl: z.string().url(),
  }),
})

/**
 * Union type de todos los schemas
 */
export const EmailDataSchema = z.discriminatedUnion('type', [
  VerificationEmailDataSchema,
  PasswordResetEmailDataSchema,
  OrderConfirmationEmailDataSchema,
  OrderStatusEmailDataSchema,
  PaymentConfirmedEmailDataSchema,
  PaymentFailedEmailDataSchema,
  WelcomeEmailDataSchema,
  PromotionalEmailDataSchema,
])

/**
 * Tipos TypeScript inferidos de los schemas
 */
export type BaseEmailData = z.infer<typeof BaseEmailDataSchema>
export type VerificationEmailData = z.infer<typeof VerificationEmailDataSchema>
export type PasswordResetEmailData = z.infer<typeof PasswordResetEmailDataSchema>
export type OrderConfirmationEmailData = z.infer<typeof OrderConfirmationEmailDataSchema>
export type OrderStatusEmailData = z.infer<typeof OrderStatusEmailDataSchema>
export type PaymentConfirmedEmailData = z.infer<typeof PaymentConfirmedEmailDataSchema>
export type PaymentFailedEmailData = z.infer<typeof PaymentFailedEmailDataSchema>
export type WelcomeEmailData = z.infer<typeof WelcomeEmailDataSchema>
export type PromotionalEmailData = z.infer<typeof PromotionalEmailDataSchema>

export type EmailData = z.infer<typeof EmailDataSchema>

/**
 * Configuración de retry para diferentes tipos de emails
 */
export const EMAIL_RETRY_CONFIG = {
  [EmailType.VERIFICATION]: {
    attempts: 5, // Más intentos para emails críticos
    backoff: {
      type: 'exponential' as const,
      delay: 2000, // 2s, 4s, 8s, 16s, 32s
    },
  },
  [EmailType.PASSWORD_RESET]: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
  },
  [EmailType.ORDER_CONFIRMATION]: {
    attempts: 4,
    backoff: {
      type: 'exponential' as const,
      delay: 3000, // 3s, 6s, 12s, 24s
    },
  },
  [EmailType.ORDER_STATUS]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000, // 5s, 10s, 20s
    },
  },
  [EmailType.PAYMENT_CONFIRMED]: {
    attempts: 4,
    backoff: {
      type: 'exponential' as const,
      delay: 3000,
    },
  },
  [EmailType.PAYMENT_FAILED]: {
    attempts: 4,
    backoff: {
      type: 'exponential' as const,
      delay: 3000,
    },
  },
  [EmailType.SHIPPING_UPDATE]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
    },
  },
  [EmailType.WELCOME]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
    },
  },
  [EmailType.NEWSLETTER]: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 10000, // 10s, 10s
    },
  },
  [EmailType.PROMOTIONAL]: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 10000,
    },
  },
} as const

/**
 * Delays por prioridad (en ms)
 */
export const PRIORITY_DELAYS = {
  [EmailPriority.CRITICAL]: 0, // Inmediato
  [EmailPriority.HIGH]: 1000, // 1 segundo
  [EmailPriority.NORMAL]: 5000, // 5 segundos
  [EmailPriority.LOW]: 30000, // 30 segundos
} as const
