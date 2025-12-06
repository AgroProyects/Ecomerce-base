import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const shippingAddressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'La provincia/estado es requerido'),
  zipCode: z.string().min(1, 'El código postal es requerido'),
  country: z.string().default('Argentina'),
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
  shipping_address: shippingAddressSchema.nullable().optional(),
  billing_address: shippingAddressSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'La orden debe tener al menos un producto'),
})

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid('ID de orden inválido'),
  status: orderStatusSchema,
  notes: z.string().optional(),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
