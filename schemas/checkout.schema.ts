import { z } from 'zod'
import { paymentMethodSchema } from './order.schema'

// Schema de dirección específico para el checkout (country es requerido sin default para evitar problemas de tipos)
const checkoutAddressSchema = z.object({
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  floor: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'La provincia/estado es requerido'),
  postal_code: z.string().min(1, 'El código postal es requerido'),
  country: z.string().min(1, 'El país es requerido'),
  additional_info: z.string().nullable().optional(),
})

export const checkoutFormSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  address: checkoutAddressSchema,
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  saveInfo: z.boolean().optional(),
  paymentMethod: paymentMethodSchema,
  paymentProofUrl: z.string().url().nullable().optional(),
})

export const checkoutCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1),
})

export const couponInfoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountAmount: z.number().min(0),
})

export const processCheckoutSchema = z.object({
  customer: checkoutFormSchema,
  items: z.array(checkoutCartItemSchema).min(1, 'El carrito está vacío'),
  coupon: couponInfoSchema.optional(),
})

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>
export type CheckoutCartItem = z.infer<typeof checkoutCartItemSchema>
export type ProcessCheckoutInput = z.infer<typeof processCheckoutSchema>
export type CouponInfo = z.infer<typeof couponInfoSchema>
