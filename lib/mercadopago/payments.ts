/**
 * Módulo de Pagos de Mercado Pago
 *
 * Este archivo maneja las operaciones relacionadas con pagos
 * como consultas, actualizaciones y reembolsos
 */

import { Payment } from 'mercadopago'
import { mercadoPagoClient, mpLog, mpError, mapMercadoPagoStatus } from './config'

/**
 * Obtener información de un pago
 *
 * @param paymentId ID del pago en Mercado Pago
 * @returns Datos del pago
 */
export async function getPayment(paymentId: string) {
  try {
    mpLog('Obteniendo información de pago', { paymentId })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.get({ id: paymentId })

    mpLog('Pago obtenido', {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
    })

    return response
  } catch (error) {
    mpError('Error al obtener pago', error)
    throw error
  }
}

/**
 * Buscar pagos por referencia externa (order_id)
 *
 * @param externalReference ID de la orden
 * @returns Lista de pagos asociados
 */
export async function searchPaymentsByExternalReference(externalReference: string) {
  try {
    mpLog('Buscando pagos por referencia externa', { externalReference })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.search({
      options: {
        criteria: 'desc',
        external_reference: externalReference,
      },
    })

    mpLog('Pagos encontrados', {
      count: response.results?.length || 0,
    })

    return response.results || []
  } catch (error) {
    mpError('Error al buscar pagos', error)
    throw error
  }
}

/**
 * Procesar información de webhook de pago
 *
 * @param paymentData Datos del pago desde webhook
 * @returns Información procesada del pago
 */
export async function processPaymentWebhook(paymentData: {
  id: string
  type: string
  action: string
}) {
  try {
    mpLog('Procesando webhook de pago', paymentData)

    // Solo procesar notificaciones de tipo payment
    if (paymentData.type !== 'payment') {
      mpLog('Tipo de notificación ignorada', { type: paymentData.type })
      return null
    }

    // Obtener información completa del pago
    const payment = await getPayment(paymentData.id)

    if (!payment) {
      throw new Error(`Pago ${paymentData.id} no encontrado`)
    }

    // Extraer información relevante
    const paymentInfo = {
      paymentId: payment.id?.toString() || '',
      externalReference: payment.external_reference || '',
      status: payment.status || 'pending',
      statusDetail: payment.status_detail || '',
      paymentType: payment.payment_type_id || '',
      paymentMethod: payment.payment_method_id || '',
      transactionAmount: payment.transaction_amount || 0,
      dateApproved: payment.date_approved || null,
      dateCreated: payment.date_created || '',
      payer: {
        email: payment.payer?.email || '',
        identification: payment.payer?.identification,
      },
      orderStatus: mapMercadoPagoStatus(payment.status || 'pending'),
    }

    mpLog('Webhook de pago procesado', paymentInfo)

    return paymentInfo
  } catch (error) {
    mpError('Error al procesar webhook de pago', error)
    throw error
  }
}

/**
 * Crear reembolso total de un pago
 *
 * @param paymentId ID del pago a reembolsar
 * @returns Información del reembolso
 */
export async function refundPayment(paymentId: string) {
  try {
    mpLog('Creando reembolso total', { paymentId })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.refund({ id: paymentId })

    mpLog('Reembolso creado', {
      id: response.id,
      status: response.status,
    })

    return response
  } catch (error) {
    mpError('Error al crear reembolso', error)
    throw error
  }
}

/**
 * Crear reembolso parcial de un pago
 *
 * @param paymentId ID del pago
 * @param amount Monto a reembolsar
 * @returns Información del reembolso
 */
export async function partialRefundPayment(paymentId: string, amount: number) {
  try {
    mpLog('Creando reembolso parcial', { paymentId, amount })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.refund({
      id: paymentId,
      body: {
        amount,
      },
    })

    mpLog('Reembolso parcial creado', {
      id: response.id,
      amount,
      status: response.status,
    })

    return response
  } catch (error) {
    mpError('Error al crear reembolso parcial', error)
    throw error
  }
}

/**
 * Capturar un pago autorizado
 *
 * @param paymentId ID del pago autorizado
 * @returns Pago capturado
 */
export async function capturePayment(paymentId: string) {
  try {
    mpLog('Capturando pago autorizado', { paymentId })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.capture({ id: paymentId })

    mpLog('Pago capturado', {
      id: response.id,
      status: response.status,
    })

    return response
  } catch (error) {
    mpError('Error al capturar pago', error)
    throw error
  }
}

/**
 * Cancelar un pago pendiente
 *
 * @param paymentId ID del pago a cancelar
 * @returns Pago cancelado
 */
export async function cancelPayment(paymentId: string) {
  try {
    mpLog('Cancelando pago', { paymentId })

    const payment = new Payment(mercadoPagoClient)
    const response = await payment.cancel({ id: paymentId })

    mpLog('Pago cancelado', {
      id: response.id,
      status: response.status,
    })

    return response
  } catch (error) {
    mpError('Error al cancelar pago', error)
    throw error
  }
}

/**
 * Verificar si un pago está aprobado
 *
 * @param status Estado del pago
 * @returns true si está aprobado
 */
export function isPaymentApproved(status: string): boolean {
  return status === 'approved' || status === 'accredited'
}

/**
 * Verificar si un pago está pendiente
 *
 * @param status Estado del pago
 * @returns true si está pendiente
 */
export function isPaymentPending(status: string): boolean {
  return (
    status === 'pending' ||
    status === 'in_process' ||
    status === 'in_mediation' ||
    status === 'authorized'
  )
}

/**
 * Verificar si un pago fue rechazado
 *
 * @param status Estado del pago
 * @returns true si fue rechazado
 */
export function isPaymentRejected(status: string): boolean {
  return status === 'rejected' || status === 'cancelled'
}

/**
 * Verificar si un pago fue reembolsado
 *
 * @param status Estado del pago
 * @returns true si fue reembolsado
 */
export function isPaymentRefunded(status: string): boolean {
  return status === 'refunded' || status === 'charged_back'
}
