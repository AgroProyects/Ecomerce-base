import { z } from 'zod'

// ============================================
// SCHEMA: Item de Carrito
// ============================================
export const cartItemSchema = z.object({
  id: z.string().uuid('ID inválido'),
  productId: z.string().uuid('ID de producto inválido'),
  variantId: z.string().uuid('ID de variante inválido').optional().nullable(),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(100, 'Cantidad máxima excedida'),
  unitPrice: z.number().min(0, 'Precio inválido'),
  totalPrice: z.number().min(0, 'Precio total inválido'),
})

export type CartItemInput = z.infer<typeof cartItemSchema>

// ============================================
// SCHEMA: Agregar al Carrito
// ============================================
export const addToCartSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  variantId: z.string().uuid('ID de variante inválido').optional().nullable(),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(100, 'Cantidad máxima: 100 unidades')
    .default(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>

// ============================================
// SCHEMA: Actualizar Cantidad
// ============================================
export const updateCartItemSchema = z.object({
  itemId: z.string().uuid('ID de item inválido'),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad mínima es 0')
    .max(100, 'Cantidad máxima excedida'),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

// ============================================
// SCHEMA: Sincronizar Carrito
// ============================================
export const syncCartSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().optional().nullable(),
})

export type SyncCartInput = z.infer<typeof syncCartSchema>

// ============================================
// SCHEMA: Reservar Stock
// ============================================
export const reserveStockSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional().nullable(),
      quantity: z.number().int().min(1),
    })
  ),
  durationMinutes: z.number().int().min(1).max(30).default(15),
})

export type ReserveStockInput = z.infer<typeof reserveStockSchema>

// ============================================
// SCHEMA: Validar Stock Disponible
// ============================================
export const validateStockSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  variantId: z.string().uuid('ID de variante inválido').optional().nullable(),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1'),
})

export type ValidateStockInput = z.infer<typeof validateStockSchema>

// ============================================
// TIPOS de respuesta
// ============================================
export type Cart = {
  id: string
  user_id: string | null
  session_id: string | null
  items: CartItemData[]
  subtotal: number
  discount: number
  total: number
  coupon_id: string | null
  coupon_code: string | null
  status: 'active' | 'abandoned' | 'converted' | 'expired'
  created_at: string
  updated_at: string
  last_activity_at: string
  expires_at: string
}

export type CartItemData = {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string
  variantId?: string | null
  variantName?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  inStock: boolean
  availableStock: number
}

export type StockReservation = {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  cart_id: string | null
  order_id: string | null
  status: 'active' | 'released' | 'converted'
  created_at: string
  expires_at: string
}

export type CartSyncResult = {
  cart: Cart
  outOfStockItems: string[]
  lowStockItems: Array<{
    itemId: string
    productName: string
    requestedQuantity: number
    availableStock: number
  }>
  priceChanges: Array<{
    itemId: string
    productName: string
    oldPrice: number
    newPrice: number
  }>
}

export type StockValidationResult = {
  available: boolean
  availableStock: number
  requestedQuantity: number
  reservedStock: number
  message?: string
}
