/**
 * Factories de datos para tests
 *
 * Estas funciones crean datos de prueba realistas para usar en tests.
 * Puedes sobrescribir cualquier campo pasando un objeto con los valores deseados.
 */

// Helpers simples para generar datos aleatorios
const randomString = (length: number = 8) => {
  return Math.random().toString(36).substring(2, 2 + length)
}

const randomNumber = (min: number = 0, max: number = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomPrice = (min: number = 100, max: number = 10000) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

const randomEmail = () => {
  return `test${randomString(8)}@test.com`
}

const randomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const randomChoice = <T>(array: T[]): T => {
  return array[randomNumber(0, array.length - 1)]
}

const randomBoolean = () => Math.random() > 0.5

const maybe = <T>(fn: () => T, probability: number = 0.5): T | null => {
  return Math.random() < probability ? fn() : null
}

/**
 * Crea un producto mock
 */
export const createMockProduct = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  name: `Product ${randomString(6)}`,
  slug: `product-${randomString(8).toLowerCase()}`,
  description: `Description for product ${randomString(10)}`,
  price: randomPrice(100, 10000),
  stock: randomNumber(0, 100),
  images: [`https://example.com/image-${randomString(8)}.jpg`],
  category_id: randomUUID(),
  track_inventory: true,
  is_active: true,
  low_stock_threshold: 5,
  sku: randomString(8).toUpperCase(),
  featured: randomBoolean(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea una variante de producto mock
 */
export const createMockVariant = (productId?: string, overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  product_id: productId || randomUUID(),
  name: `Talla ${randomChoice(['S', 'M', 'L', 'XL'])}`,
  price_override: randomBoolean() ? randomPrice(100, 10000) : null,
  stock: randomNumber(0, 50),
  sku: randomString(10).toUpperCase(),
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea una orden mock
 */
export const createMockOrder = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  order_number: `ORD-${randomNumber(1000, 9999)}`,
  status: randomChoice(['pending', 'paid', 'cancelled', 'refunded', 'pending_payment']),
  customer_email: randomEmail(),
  customer_name: `Customer ${randomString(6)}`,
  customer_phone: `099${randomNumber(100000, 999999)}`,
  shipping_address: {
    street: `Street ${randomString(5)}`,
    number: randomNumber(100, 9999).toString(),
    floor: maybe(() => randomNumber(1, 20).toString()),
    apartment: maybe(() => randomString(3).toUpperCase()),
    city: randomChoice(['Montevideo', 'Punta del Este', 'Colonia']),
    state: randomChoice(['Montevideo', 'Canelones', 'Maldonado', 'Colonia']),
    postal_code: randomNumber(10000, 99999).toString(),
    country: 'Uruguay',
  },
  subtotal: randomPrice(100, 10000),
  shipping_cost: 150,
  discount_amount: 0,
  total: randomPrice(100, 10000),
  payment_method: randomChoice(['mercadopago', 'bank_transfer', 'cash_on_delivery']),
  mp_preference_id: maybe(() => `pref-${randomString(10)}`),
  mp_payment_id: maybe(() => randomNumber(100000, 999999).toString()),
  mp_status: maybe(() => randomChoice(['approved', 'pending', 'rejected'])),
  notes: maybe(() => `Note: ${randomString(20)}`),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea un item de orden mock
 */
export const createMockOrderItem = (orderId?: string, overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  order_id: orderId || randomUUID(),
  product_id: randomUUID(),
  variant_id: maybe(() => randomUUID()),
  product_name: `Product ${randomString(6)}`,
  variant_name: maybe(() => `Talla ${randomChoice(['S', 'M', 'L', 'XL'])}`),
  quantity: randomNumber(1, 5),
  unit_price: randomPrice(100, 5000),
  total_price: randomPrice(100, 10000),
  ...overrides,
})

/**
 * Crea un item de carrito mock
 */
export const createMockCartItem = (overrides: Partial<any> = {}) => {
  const product = createMockProduct()
  const variant = randomBoolean() ? createMockVariant(product.id) : null
  const quantity = randomNumber(1, 5)
  const unitPrice = variant?.price_override || product.price
  const totalPrice = unitPrice * quantity

  return {
    id: randomUUID(),
    product,
    variant,
    quantity,
    unitPrice,
    totalPrice,
    ...overrides,
  }
}

/**
 * Crea una categoría mock
 */
export const createMockCategory = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  name: `Category ${randomString(6)}`,
  slug: `category-${randomString(8).toLowerCase()}`,
  description: `Description for category ${randomString(10)}`,
  image: `https://example.com/category-${randomString(8)}.jpg`,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea un cupón mock
 */
export const createMockCoupon = (overrides: Partial<any> = {}) => {
  const discountType = randomChoice(['percentage', 'fixed']) as 'percentage' | 'fixed'
  const discountValue = discountType === 'percentage'
    ? randomNumber(5, 50)
    : randomPrice(100, 1000)

  return {
    id: randomUUID(),
    code: randomString(8).toUpperCase(),
    description: `${discountValue}${discountType === 'percentage' ? '%' : ' UYU'} de descuento`,
    discount_type: discountType,
    discount_value: discountValue,
    min_purchase: maybe(() => randomPrice(500, 2000)),
    max_discount: maybe(() => randomPrice(500, 5000)),
    max_uses: maybe(() => randomNumber(10, 100)),
    usage_count: 0,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Crea una review mock
 */
export const createMockReview = (productId?: string, overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  product_id: productId || randomUUID(),
  user_id: randomUUID(),
  user_name: `User ${randomString(6)}`,
  rating: randomNumber(1, 5),
  comment: `This is a review comment ${randomString(20)}`,
  images: maybe(() => [
    `https://example.com/review-${randomString(8)}.jpg`,
    `https://example.com/review-${randomString(8)}.jpg`,
  ], 0.3),
  is_verified_purchase: randomBoolean(),
  is_approved: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea un usuario mock
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  email: randomEmail(),
  name: `User ${randomString(6)}`,
  phone: `099${randomNumber(100000, 999999)}`,
  role: randomChoice(['user', 'admin']),
  email_verified: randomBoolean(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Crea una dirección mock
 */
export const createMockAddress = (overrides: Partial<any> = {}) => ({
  street: `Street ${randomString(5)}`,
  number: randomNumber(100, 9999).toString(),
  floor: maybe(() => randomNumber(1, 20).toString()),
  apartment: maybe(() => randomString(3).toUpperCase()),
  city: randomChoice(['Montevideo', 'Punta del Este', 'Colonia']),
  state: randomChoice([
    'Montevideo',
    'Canelones',
    'Maldonado',
    'Colonia',
    'Paysandú',
    'Salto',
    'Rivera',
  ]),
  postal_code: randomNumber(10000, 99999).toString(),
  country: 'Uruguay',
  ...overrides,
})

/**
 * Crea información de envío mock
 */
export const createMockShipping = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  department: randomChoice(['Montevideo', 'Canelones', 'Maldonado', 'Colonia']),
  cost: randomPrice(100, 300),
  free_shipping_threshold: 5000,
  estimated_days: randomNumber(1, 7),
  is_active: true,
  ...overrides,
})

/**
 * Crea una reserva de stock mock
 */
export const createMockStockReservation = (overrides: Partial<any> = {}) => ({
  id: randomUUID(),
  product_id: maybe(() => randomUUID()),
  variant_id: maybe(() => randomUUID()),
  quantity: randomNumber(1, 5),
  user_id: maybe(() => randomUUID()),
  session_id: maybe(() => randomUUID()),
  order_id: maybe(() => randomUUID()),
  status: randomChoice(['active', 'completed', 'cancelled', 'expired']),
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  completed_at: maybe(() => new Date().toISOString()),
  ...overrides,
})

/**
 * Crea datos de checkout completos
 */
export const createMockCheckoutData = (overrides: Partial<any> = {}) => {
  const itemCount = randomNumber(1, 3)
  const items = Array.from({ length: itemCount }, () => createMockCartItem())
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

  return {
    customer: {
      email: randomEmail(),
      name: `Customer ${randomString(6)}`,
      phone: `099${randomNumber(100000, 999999)}`,
      address: createMockAddress(),
      paymentMethod: randomChoice(['mercadopago', 'bank_transfer', 'cash_on_delivery']),
      notes: maybe(() => `Customer note: ${randomString(20)}`),
    },
    items: items.map(item => ({
      productId: item.product.id,
      variantId: item.variant?.id || null,
      quantity: item.quantity,
    })),
    coupon: maybe(() => createMockCoupon()),
    subtotal,
    shippingCost: 150,
    discount: 0,
    total: subtotal + 150,
    ...overrides,
  }
}

/**
 * Crea múltiples items usando una factory
 */
export const createMany = <T>(factory: (overrides?: any) => T, count: number, overrides: any = {}) => {
  return Array.from({ length: count }, () => factory(overrides))
}
