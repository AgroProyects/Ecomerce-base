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
  const client = getMercadoPagoClient()
  const preference = new Preference(client)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const preferenceItems = items.map((item) => ({
    id: item.variant?.id || item.product.id,
    title: item.variant
      ? `${item.product.name} - ${item.variant.name}`
      : item.product.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: 'ARS',
    picture_url: item.product.images[0] || undefined,
  }))

  // Agregar costo de envío si existe
  if (shippingCost > 0) {
    preferenceItems.push({
      id: 'shipping',
      title: 'Costo de envío',
      quantity: 1,
      unit_price: shippingCost,
      currency_id: 'ARS',
      picture_url: undefined,
    })
  }

  const response = await preference.create({
    body: {
      items: preferenceItems,
      payer: {
        name: customer.name.split(' ')[0],
        surname: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: {
          area_code: '',
          number: customer.phone,
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
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'TIENDA ONLINE',
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
      },
    },
  })

  if (!response.id || !response.init_point) {
    throw new Error('Error al crear la preferencia de pago')
  }

  return {
    id: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point || response.init_point,
  }
}
