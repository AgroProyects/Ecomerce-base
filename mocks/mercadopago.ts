/**
 * Mock de Mercado Pago Client para tests
 *
 * Este mock simula las operaciones de Mercado Pago sin hacer llamadas reales a la API.
 */

export const mockMercadoPagoPreference = {
  create: jest.fn().mockResolvedValue({
    id: 'mock-preference-123',
    init_point: 'https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    sandbox_init_point: 'https://sandbox.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    external_reference: 'order-123',
    items: [],
    payer: {},
    back_urls: {},
    auto_return: 'approved',
    payment_methods: {},
    notification_url: '',
    statement_descriptor: '',
    date_created: new Date().toISOString(),
  }),

  get: jest.fn().mockResolvedValue({
    id: 'mock-preference-123',
    init_point: 'https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    external_reference: 'order-123',
  }),

  update: jest.fn().mockResolvedValue({
    id: 'mock-preference-123',
    init_point: 'https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
  }),
}

export const mockMercadoPagoPayment = {
  get: jest.fn().mockResolvedValue({
    id: 123456789,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'order-123',
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: 1000,
    currency_id: 'UYU',
    date_approved: new Date().toISOString(),
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
      identification: {
        type: 'CI',
        number: '12345678',
      },
    },
    transaction_details: {
      net_received_amount: 950,
      total_paid_amount: 1000,
      installment_amount: 1000,
    },
  }),

  search: jest.fn().mockResolvedValue({
    results: [],
    paging: {
      total: 0,
      limit: 30,
      offset: 0,
    },
  }),

  capture: jest.fn().mockResolvedValue({
    id: 123456789,
    status: 'approved',
  }),

  refund: jest.fn().mockResolvedValue({
    id: 'refund-123',
    payment_id: 123456789,
    amount: 1000,
    status: 'approved',
  }),
}

export const mockMercadoPagoClient = {
  preference: mockMercadoPagoPreference,
  payment: mockMercadoPagoPayment,

  configure: jest.fn(),

  getAccessToken: jest.fn().mockReturnValue('TEST-123456789-123456-abcdef123456789-123456789'),
}

// Mock del módulo de Mercado Pago
jest.mock('mercadopago', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockMercadoPagoClient),
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => mockMercadoPagoPreference),
    Payment: jest.fn().mockImplementation(() => mockMercadoPagoPayment),
  }
})

// Mock del cliente customizado si existe
jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn(() => mockMercadoPagoClient),
  mercadopagoClient: mockMercadoPagoClient,
}))

/**
 * Helper para resetear los mocks de Mercado Pago
 */
export const resetMercadoPagoMocks = () => {
  jest.clearAllMocks()

  // Restaurar comportamiento por defecto
  mockMercadoPagoPreference.create.mockResolvedValue({
    id: 'mock-preference-123',
    init_point: 'https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    sandbox_init_point: 'https://sandbox.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    external_reference: 'order-123',
    items: [],
    payer: {},
    back_urls: {},
    auto_return: 'approved',
    payment_methods: {},
    notification_url: '',
    statement_descriptor: '',
    date_created: new Date().toISOString(),
  })

  mockMercadoPagoPayment.get.mockResolvedValue({
    id: 123456789,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'order-123',
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: 1000,
    currency_id: 'UYU',
    date_approved: new Date().toISOString(),
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
      identification: {
        type: 'CI',
        number: '12345678',
      },
    },
    transaction_details: {
      net_received_amount: 950,
      total_paid_amount: 1000,
      installment_amount: 1000,
    },
  })
}

/**
 * Helper para mockear una preferencia con datos específicos
 */
export const mockPreferenceResponse = (data: Partial<any>) => {
  mockMercadoPagoPreference.create.mockResolvedValueOnce({
    id: 'mock-preference-123',
    init_point: 'https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=mock-preference-123',
    ...data,
  })
}

/**
 * Helper para mockear un pago aprobado
 */
export const mockApprovedPayment = (orderId: string, amount: number = 1000) => {
  mockMercadoPagoPayment.get.mockResolvedValueOnce({
    id: 123456789,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: orderId,
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: amount,
    currency_id: 'UYU',
    date_approved: new Date().toISOString(),
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
      identification: {
        type: 'CI',
        number: '12345678',
      },
    },
  })
}

/**
 * Helper para mockear un pago rechazado
 */
export const mockRejectedPayment = (orderId: string) => {
  mockMercadoPagoPayment.get.mockResolvedValueOnce({
    id: 123456789,
    status: 'rejected',
    status_detail: 'cc_rejected_insufficient_amount',
    external_reference: orderId,
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: 1000,
    currency_id: 'UYU',
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
    },
  })
}

/**
 * Helper para mockear un pago pendiente
 */
export const mockPendingPayment = (orderId: string) => {
  mockMercadoPagoPayment.get.mockResolvedValueOnce({
    id: 123456789,
    status: 'pending',
    status_detail: 'pending_waiting_payment',
    external_reference: orderId,
    payment_method_id: 'pagofacil',
    payment_type_id: 'ticket',
    transaction_amount: 1000,
    currency_id: 'UYU',
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
    },
  })
}

/**
 * Helper para mockear un reembolso
 */
export const mockRefundedPayment = (orderId: string, paymentId: number = 123456789) => {
  mockMercadoPagoPayment.get.mockResolvedValueOnce({
    id: paymentId,
    status: 'refunded',
    status_detail: 'refunded',
    external_reference: orderId,
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    transaction_amount: 1000,
    currency_id: 'UYU',
    date_approved: new Date().toISOString(),
    date_created: new Date().toISOString(),
    payer: {
      email: 'test@test.com',
    },
  })
}

/**
 * Helper para mockear un error de Mercado Pago
 */
export const mockMercadoPagoError = (message: string, status: number = 400) => {
  const error = new Error(message) as any
  error.status = status
  error.cause = {
    code: status,
    description: message,
  }

  mockMercadoPagoPreference.create.mockRejectedValueOnce(error)
  mockMercadoPagoPayment.get.mockRejectedValueOnce(error)
}
