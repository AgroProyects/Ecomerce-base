import { Preference } from 'mercadopago'
import { getMercadoPagoClient } from './client'
import type { CartItem } from '@/types/cart'
import type { CheckoutFormInput } from '@/schemas/checkout.schema'

interface CreatePreferenceParams {
  orderId: string
  orderNumber: string
  items: CartItem[]
  customer: CheckoutFormInput
  shippingCost: number
}

interface PreferenceResult {
  id: string
  initPoint: string
  sandboxInitPoint: string
}

export async function createPreference({
  orderId,
  orderNumber,
  items,
  customer,
  shippingCost,
}: CreatePreferenceParams): Promise<PreferenceResult> {
  console.log('--- createPreference: Iniciando ---')
  console.log('Params:', { orderId, orderNumber, itemsCount: items.length, shippingCost })

  // Validar parámetros de entrada
  if (!orderId || !orderNumber) {
    throw new Error('orderId y orderNumber son requeridos')
  }

  if (!items || items.length === 0) {
    throw new Error('Debe haber al menos un item en el carrito')
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!customer.email || !emailRegex.test(customer.email)) {
    throw new Error(`Email inválido: ${customer.email}`)
  }

  const client = getMercadoPagoClient()
  const preference = new Preference(client)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  console.log('Base URL:', baseUrl)

  const preferenceItems = items.map((item) => {
    const itemId = item.variant?.id || item.product.id

    // Validar datos del item
    if (!item.product.name || item.product.name.trim() === '') {
      throw new Error('El nombre del producto no puede estar vacío')
    }

    if (item.quantity <= 0) {
      throw new Error(`Cantidad inválida para ${item.product.name}: ${item.quantity}`)
    }

    if (item.unitPrice <= 0) {
      throw new Error(`Precio inválido para ${item.product.name}: ${item.unitPrice}`)
    }

    // Limitar título a 256 caracteres (límite de Mercado Pago)
    const title = item.variant
      ? `${item.product.name} - ${item.variant.name}`
      : item.product.name
    const truncatedTitle = title.length > 256 ? title.substring(0, 253) + '...' : title

    return {
      id: itemId,
      title: truncatedTitle,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      currency_id: 'UYU', // Peso Uruguayo - cambiar a 'ARS' si es Argentina
      picture_url: item.product.images[0] || undefined,
    }
  })

  // Agregar costo de envío si existe
  if (shippingCost > 0) {
    preferenceItems.push({
      id: 'shipping',
      title: 'Costo de envío',
      quantity: 1,
      unit_price: shippingCost,
      currency_id: 'UYU', // Peso Uruguayo - cambiar a 'ARS' si es Argentina
      picture_url: undefined,
    })
  }

  const preferenceBody = {
    items: preferenceItems,
    payer: {
      name: customer.name.split(' ')[0],
      surname: customer.name.split(' ').slice(1).join(' ') || '',
      email: customer.email,
      phone: {
        area_code: '',
        number: customer.phone || '',
      },
      address: {
        street_name: customer.address.street,
        street_number: customer.address.number,
        zip_code: customer.address.postal_code,
      },
    },
    back_urls: {
      success: `${baseUrl}/checkout/success?order_id=${orderId}`,
      failure: `${baseUrl}/checkout/failure?order_id=${orderId}`,
      pending: `${baseUrl}/checkout/pending?order_id=${orderId}`,
    },
    external_reference: orderId,
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'TIENDA ONLINE',
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
  }

  console.log('--- Preference Body (Request) ---')
  console.log(JSON.stringify(preferenceBody, null, 2))

  try {
    console.log('Enviando request a Mercado Pago...')
    const response = await preference.create({
      body: preferenceBody,
    })

    console.log('--- Response de Mercado Pago ---')
    console.log('Response ID:', response.id)
    console.log('Init Point:', response.init_point)
    console.log('Sandbox Init Point:', response.sandbox_init_point)

    if (!response.id || !response.init_point) {
      console.error('Response incompleto:', response)
      throw new Error('Error al crear la preferencia de pago: respuesta incompleta de Mercado Pago')
    }

    console.log('✓ Preferencia creada exitosamente en checkout.ts')

    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point || response.init_point,
    }
  } catch (error) {
    console.error('--- Error en preference.create() ---')
    console.error('Error:', error)

    // Intentar extraer más información del error de Mercado Pago
    if (error && typeof error === 'object') {
      console.error('Error keys:', Object.keys(error))
      if ('cause' in error) {
        console.error('Error cause:', error.cause)
      }
      if ('response' in error) {
        console.error('Error response:', error.response)
      }
      if ('message' in error) {
        console.error('Error message:', error.message)
      }
    }

    throw error
  }
}
