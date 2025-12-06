// Tipos adicionales para Mercado Pago

export interface MPPaymentStatus {
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
}

export interface MPPreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id: string
  picture_url?: string
  description?: string
  category_id?: string
}

export interface MPPayer {
  name: string
  surname: string
  email: string
  phone?: {
    area_code: string
    number: string
  }
  address?: {
    street_name: string
    street_number: number
    zip_code: string
  }
}

export interface MPBackUrls {
  success: string
  failure: string
  pending: string
}

export interface MPWebhookPayload {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: 'payment' | 'merchant_order' | 'plan' | 'subscription' | 'invoice'
  user_id: string
}

export const MP_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
}

export const MP_STATUS_DETAIL_LABELS: Record<string, string> = {
  accredited: 'Acreditado',
  pending_contingency: 'Pendiente de contingencia',
  pending_review_manual: 'En revisión manual',
  cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
  cc_rejected_bad_filled_other: 'Datos incorrectos',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_blacklist: 'Tarjeta en lista negra',
  cc_rejected_call_for_authorize: 'Debe autorizar el pago',
  cc_rejected_card_disabled: 'Tarjeta deshabilitada',
  cc_rejected_card_error: 'Error en la tarjeta',
  cc_rejected_duplicated_payment: 'Pago duplicado',
  cc_rejected_high_risk: 'Pago rechazado por riesgo',
  cc_rejected_insufficient_amount: 'Monto insuficiente',
  cc_rejected_invalid_installments: 'Cuotas inválidas',
  cc_rejected_max_attempts: 'Máximo de intentos alcanzado',
  cc_rejected_other_reason: 'Rechazado por otro motivo',
}
