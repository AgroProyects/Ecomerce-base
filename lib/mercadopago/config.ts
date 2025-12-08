/**
 * Configuración de Mercado Pago
 *
 * Este archivo centraliza la configuración del SDK de Mercado Pago
 * y proporciona funciones auxiliares para validar la configuración.
 */

import { MercadoPagoConfig } from 'mercadopago'

// Validar que exista el access token
if (!process.env.MP_ACCESS_TOKEN) {
  console.warn('⚠️ MP_ACCESS_TOKEN no está configurado en las variables de entorno')
}

/**
 * Cliente de Mercado Pago configurado
 * Utiliza el access token de las variables de entorno
 */
export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'your-idempotency-key', // Se sobrescribirá por operación
  },
})

/**
 * Configuración de URLs de callback
 * Estas URLs son a donde Mercado Pago redirigirá al usuario después del pago
 */
export const getCallbackUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return {
    success: `${baseUrl}/checkout/success`,
    failure: `${baseUrl}/checkout/failure`,
    pending: `${baseUrl}/checkout/pending`,
  }
}

/**
 * URL del webhook para notificaciones de Mercado Pago
 * Esta URL debe ser accesible públicamente (usar ngrok en desarrollo)
 */
export const getWebhookUrl = () => {
  // En producción, usar la URL pública
  // En desarrollo, usar ngrok o similar
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL

  if (!baseUrl) {
    console.warn('⚠️ No se ha configurado NEXT_PUBLIC_APP_URL para webhooks')
    return null
  }

  return `${baseUrl}/api/webhooks/mercadopago`
}

/**
 * Configuración del ambiente
 * true = sandbox (pruebas)
 * false = production
 */
export const isSandbox = () => {
  return process.env.NODE_ENV !== 'production' || process.env.MP_SANDBOX === 'true'
}

/**
 * Validar que la configuración de Mercado Pago esté completa
 */
export const validateMercadoPagoConfig = () => {
  const errors: string[] = []

  if (!process.env.MP_ACCESS_TOKEN) {
    errors.push('MP_ACCESS_TOKEN no está configurado')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXTAUTH_URL) {
    errors.push('NEXT_PUBLIC_APP_URL o NEXTAUTH_URL debe estar configurado para callbacks')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Mapeo de estados de Mercado Pago a estados de orden
 */
export const mapMercadoPagoStatus = (mpStatus: string): 'pending' | 'paid' | 'cancelled' | 'refunded' => {
  const statusMap: Record<string, 'pending' | 'paid' | 'cancelled' | 'refunded'> = {
    // Estados de aprobación
    'approved': 'paid',
    'accredited': 'paid',

    // Estados pendientes
    'pending': 'pending',
    'in_process': 'pending',
    'in_mediation': 'pending',
    'authorized': 'pending',

    // Estados rechazados/cancelados
    'rejected': 'cancelled',
    'cancelled': 'cancelled',

    // Estados de devolución
    'refunded': 'refunded',
    'charged_back': 'refunded',
  }

  return statusMap[mpStatus] || 'pending'
}

/**
 * Obtener mensaje descriptivo del estado de Mercado Pago
 */
export const getMercadoPagoStatusMessage = (status: string, statusDetail?: string): string => {
  const messages: Record<string, string> = {
    // Aprobados
    'approved': 'Pago aprobado exitosamente',
    'accredited': 'Pago acreditado',

    // Pendientes
    'pending': 'Pago pendiente de confirmación',
    'in_process': 'Pago en proceso',
    'in_mediation': 'Pago en mediación',
    'authorized': 'Pago autorizado, pendiente de captura',

    // Rechazados
    'rejected': 'Pago rechazado',
    'cancelled': 'Pago cancelado',

    // Devoluciones
    'refunded': 'Pago reembolsado',
    'charged_back': 'Contracargo realizado',
  }

  let message = messages[status] || 'Estado desconocido'

  if (statusDetail) {
    message += ` (${statusDetail})`
  }

  return message
}

/**
 * Configuración de notificaciones por email
 */
export const emailNotificationsEnabled = () => {
  return process.env.MP_EMAIL_NOTIFICATIONS === 'true'
}

/**
 * Configuración de logs
 */
export const debugMode = () => {
  return process.env.MP_DEBUG === 'true' || process.env.NODE_ENV === 'development'
}

/**
 * Logger personalizado para Mercado Pago
 */
export const mpLog = (message: string, data?: unknown) => {
  if (debugMode()) {
    console.log(`[Mercado Pago] ${message}`, data || '')
  }
}

export const mpError = (message: string, error?: unknown) => {
  console.error(`[Mercado Pago Error] ${message}`, error || '')
}
