import type { Product, ProductVariant } from './database'

export interface CartItem {
  id: string // unique identifier for cart item
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'stock' | 'track_inventory'>
  variant: Pick<ProductVariant, 'id' | 'name' | 'price_override' | 'stock'> | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Cart {
  items: CartItem[]
  itemsCount: number
  subtotal: number
  shippingCost: number
  discount: number
  total: number
}

export interface CartState extends Cart {
  isOpen: boolean
  isLoading: boolean
}

export interface CartActions {
  addItem: (product: CartItem['product'], variant?: CartItem['variant'], quantity?: number) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

export type CartStore = CartState & CartActions

// Checkout types
export interface CheckoutFormData {
  email: string
  name: string
  phone: string
  address: ShippingAddress
  notes?: string
  saveInfo?: boolean
}

export interface ShippingAddress {
  street: string
  number: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface CheckoutResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  paymentMethod?: 'mercadopago' | 'bank_transfer' | 'cash_on_delivery'
  preferenceId?: string
  initPoint?: string
  redirectUrl?: string
  error?: string
}
