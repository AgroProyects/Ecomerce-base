import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'pending',
  'pending_payment', // Esperando pago (transferencia)
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const paymentMethodSchema = z.enum([
  'mercadopago',
  'bank_transfer',
  'cash_on_delivery',
])

export const shippingAddressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  floor: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'La provincia/estado es requerido'),
  postal_code: z.string().min(1, 'El código postal es requerido'),
  country: z.string().min(1, 'El país es requerido').default('Argentina'),
  additional_info: z.string().nullable().optional(),
})

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  product_name: z.string(),
  variant_name: z.string().nullable().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
})

export const createOrderSchema = z.object({
  customer_email: z.string().email('Email inválido'),
  customer_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customer_phone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres')
    .nullable()
    .optional(),
  shipping_address: shippingAddressSchema,
  billing_address: shippingAddressSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'La orden debe tener al menos un producto'),
  payment_method: paymentMethodSchema,
  payment_proof_url: z.string().url().nullable().optional(), // Para transferencias
  shipping_cost: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
})

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid('ID de orden inválido'),
  status: orderStatusSchema,
  notes: z.string().max(1000).nullable().optional(),
})

export const uploadPaymentProofSchema = z.object({
  order_id: z.string().uuid('ID de orden inválido'),
  payment_proof_url: z.string().url('URL de comprobante inválida'),
})

export const updateOrderNotesSchema = z.object({
  id: z.string().uuid('ID de orden inválido'),
  notes: z.string().max(1000, 'Las notas no pueden superar 1000 caracteres'),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UploadPaymentProofInput = z.infer<typeof uploadPaymentProofSchema>
export type UpdateOrderNotesInput = z.infer<typeof updateOrderNotesSchema>
