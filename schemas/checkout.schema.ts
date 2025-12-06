import { z } from 'zod'
import { shippingAddressSchema } from './order.schema'

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
  address: shippingAddressSchema,
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  saveInfo: z.boolean().optional(),
})

export const checkoutCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1),
})

export const processCheckoutSchema = z.object({
  customer: checkoutFormSchema,
  items: z.array(checkoutCartItemSchema).min(1, 'El carrito está vacío'),
})

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>
export type CheckoutCartItem = z.infer<typeof checkoutCartItemSchema>
export type ProcessCheckoutInput = z.infer<typeof processCheckoutSchema>
