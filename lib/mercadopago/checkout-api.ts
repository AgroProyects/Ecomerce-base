import { Payment } from 'mercadopago'
import { getMercadoPagoClient } from './client'
import type { CheckoutFormInput } from '@/schemas/checkout.schema'

/**
 * Datos necesarios para crear un pago con Checkout API
 */
export interface CreatePaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  customer: CheckoutFormInput
  token: string // Token generado por Mercado Pago SDK en el frontend
  installments?: number
  paymentMethodId: string
  issuerId?: string
}

/**
 * Resultado de crear un pago
 */
export interface PaymentResult {
  id: number
  status: string
  statusDetail: string
  approvalUrl?: string
  externalReference: string
}

/**
 * Crear un pago usando Checkout API
 * Esto procesa el pago directamente sin redirección
 */
export async function createPayment({
  orderId,
  orderNumber,
  amount,
  customer,
  token,
  installments = 1,
  paymentMethodId,
  issuerId,
}: CreatePaymentParams): Promise<PaymentResult> {
  console.log('--- createPayment (Checkout API): Iniciando ---')
  console.log('Params:', {
    orderId,
    orderNumber,
    amount,
    installments,
    paymentMethodId,
    issuerId,
  })

  // Validar parámetros
  if (!orderId || !orderNumber) {
    throw new Error('orderId y orderNumber son requeridos')
  }

  if (!token) {
    throw new Error('Token de tarjeta es requerido')
  }

  if (amount <= 0) {
    throw new Error('El monto debe ser mayor a 0')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!customer.email || !emailRegex.test(customer.email)) {
    throw new Error(`Email inválido: ${customer.email}`)
  }

  const client = getMercadoPagoClient()
  const payment = new Payment(client)

  // Separar nombre y apellido
  const nameParts = customer.name.trim().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || firstName

  // Construir el cuerpo del pago
  const paymentData: any = {
    transaction_amount: amount,
    token,
    description: `Orden #${orderNumber}`,
    installments,
    payment_method_id: paymentMethodId,
    payer: {
      email: customer.email,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: 'CI', // Cédula de Identidad para Uruguay (DNI para Argentina)
        number: customer.phone || '12345678', // En producción esto debería ser real
      },
      address: {
        zip_code: customer.address?.postal_code || '',
        street_name: customer.address?.street || '',
        street_number: customer.address?.number ? parseInt(customer.address.number) : undefined,
      },
    },
    external_reference: orderId,
    statement_descriptor: 'TIENDA ONLINE',
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
  }

  // Agregar issuer_id solo si existe y es válido
  if (issuerId && issuerId.trim() !== '') {
    paymentData.issuer_id = issuerId
    console.log('Issuer ID configurado:', issuerId)
  } else {
    console.log('⚠️ Issuer ID omitido (no disponible o vacío)')
  }

  // Solo agregar notification_url si es una URL pública válida
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
    paymentData.notification_url = `${baseUrl}/api/webhooks/mercadopago`
    console.log('Notification URL configurada:', paymentData.notification_url)
  } else {
    console.log('⚠️ Notification URL omitida (localhost no es válido para webhooks de MP)')
  }

  console.log('--- Payment Data (Request) ---')
  console.log(JSON.stringify(paymentData, null, 2))

  try {
    console.log('Enviando request de pago a Mercado Pago...')
    const response = await payment.create({
      body: paymentData,
    })

    console.log('--- Response de Mercado Pago ---')
    console.log('Payment ID:', response.id)
    console.log('Status:', response.status)
    console.log('Status Detail:', response.status_detail)

    if (!response.id) {
      console.error('Response incompleto:', response)
      throw new Error('Error al crear el pago: respuesta incompleta de Mercado Pago')
    }

    console.log('✓ Pago creado exitosamente')

    return {
      id: response.id,
      status: response.status || 'unknown',
      statusDetail: response.status_detail || 'unknown',
      approvalUrl: response.point_of_interaction?.transaction_data?.ticket_url,
      externalReference: orderId,
    }
  } catch (error) {
    console.error('--- Error en payment.create() ---')
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

/**
 * Obtener información de un pago
 */
export async function getPayment(paymentId: number) {
  const client = getMercadoPagoClient()
  const payment = new Payment(client)

  try {
    const response = await payment.get({ id: paymentId })
    return response
  } catch (error) {
    console.error('Error al obtener pago:', error)
    throw error
  }
}
