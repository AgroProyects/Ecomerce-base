/**
 * Módulo de Preferencias de Mercado Pago
 *
 * Este archivo maneja la creación de preferencias de pago
 * para Mercado Pago CheckoutPro
 */

import { Preference } from 'mercadopago'
import {
  mercadoPagoClient,
  getCallbackUrls,
  getWebhookUrl,
  mpLog,
  mpError,
} from './config'
import type { CheckoutFormInput } from '@/schemas/checkout.schema'
import type { CartItem } from '@/types/cart'

export interface CreatePreferenceInput {
  orderId: string
  orderNumber: string
  items: CartItem[]
  customer: CheckoutFormInput
  shippingCost: number
}

export interface PreferenceResponse {
  id: string
  initPoint: string
  sandboxInitPoint: string
}

/**
 * Crear una preferencia de pago en Mercado Pago
 *
 * @param input Datos de la orden y el cliente
 * @returns Preferencia creada con URL de pago
 */
export async function createPreference(
  input: CreatePreferenceInput
): Promise<PreferenceResponse> {
  try {
    mpLog('Creando preferencia de pago', {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      itemsCount: input.items.length,
    })

    const preference = new Preference(mercadoPagoClient)

    // Construir items para Mercado Pago
    const items = input.items.map((item) => {
      const productName = item.variant
        ? `${item.product.name} - ${item.variant.name}`
        : item.product.name

      return {
        id: item.variant?.id || item.product.id,
        title: productName,
        description: item.product.name,
        picture_url: item.product.images?.[0] || undefined,
        category_id: 'products', // Categoría genérica
        quantity: item.quantity,
        currency_id: 'ARS', // Peso argentino
        unit_price: item.unitPrice,
      }
    })

    // Agregar costo de envío como item si existe
    if (input.shippingCost > 0) {
      items.push({
        id: 'shipping',
        title: 'Costo de envío',
        description: 'Costo de envío del pedido',
        category_id: 'shipping',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: input.shippingCost,
      })
    }

    // Obtener URLs de callback
    const callbacks = getCallbackUrls()
    const webhookUrl = getWebhookUrl()

    // Crear la preferencia
    const preferenceData = {
      items,

      // Información del pagador
      payer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone
          ? {
              number: input.customer.phone,
            }
          : undefined,
        address: {
          street_name: input.customer.address.street,
          street_number: input.customer.address.number,
          zip_code: input.customer.address.zipCode,
        },
      },

      // URLs de retorno
      back_urls: {
        success: callbacks.success,
        failure: callbacks.failure,
        pending: callbacks.pending,
      },

      // Redirección automática después del pago
      auto_return: 'approved' as const,

      // Referencia externa (ID de la orden)
      external_reference: input.orderId,

      // Metadata adicional
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
      },

      // Notificación webhook
      notification_url: webhookUrl || undefined,

      // Configuración de pagos
      payment_methods: {
        excluded_payment_methods: [], // No excluir ninguno
        excluded_payment_types: [], // No excluir ninguno
        installments: 12, // Máximo 12 cuotas
      },

      // Información de envío
      shipments: {
        cost: input.shippingCost,
        mode: 'not_specified' as const,
      },

      // Datos adicionales
      statement_descriptor: 'TU TIENDA', // Aparece en el resumen de tarjeta (máx 11 caracteres)

      // Expiración de la preferencia (7 días)
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    mpLog('Datos de preferencia preparados', preferenceData)

    const response = await preference.create({ body: preferenceData })

    if (!response || !response.id) {
      throw new Error('No se recibió ID de preferencia de Mercado Pago')
    }

    mpLog('Preferencia creada exitosamente', {
      id: response.id,
      initPoint: response.init_point,
    })

    return {
      id: response.id,
      initPoint: response.init_point || '',
      sandboxInitPoint: response.sandbox_init_point || '',
    }
  } catch (error) {
    mpError('Error al crear preferencia de Mercado Pago', error)

    // Extraer mensaje de error específico si existe
    let errorMessage = 'Error al crear preferencia de pago'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    throw new Error(errorMessage)
  }
}

/**
 * Obtener una preferencia existente
 *
 * @param preferenceId ID de la preferencia
 * @returns Datos de la preferencia
 */
export async function getPreference(preferenceId: string) {
  try {
    mpLog('Obteniendo preferencia', { preferenceId })

    const preference = new Preference(mercadoPagoClient)
    const response = await preference.get({ preferenceId })

    mpLog('Preferencia obtenida', { id: response.id })

    return response
  } catch (error) {
    mpError('Error al obtener preferencia', error)
    throw error
  }
}

/**
 * Actualizar una preferencia existente
 *
 * @param preferenceId ID de la preferencia
 * @param data Datos a actualizar
 * @returns Preferencia actualizada
 */
export async function updatePreference(preferenceId: string, data: unknown) {
  try {
    mpLog('Actualizando preferencia', { preferenceId })

    const preference = new Preference(mercadoPagoClient)
    const response = await preference.update({
      id: preferenceId,
      updatePreferenceRequest: data,
    })

    mpLog('Preferencia actualizada', { id: response.id })

    return response
  } catch (error) {
    mpError('Error al actualizar preferencia', error)
    throw error
  }
}
