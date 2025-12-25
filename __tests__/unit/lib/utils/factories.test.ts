/**
 * Test de Factories
 *
 * Verifica que las factories de datos funcionan correctamente
 */

import {
  createMockProduct,
  createMockVariant,
  createMockOrder,
  createMockCartItem,
  createMockCoupon,
  createMockCheckoutData,
  createMany,
} from '@/test-utils/factories'

describe('Factories', () => {
  describe('createMockProduct', () => {
    it('should create a product with default values', () => {
      const product = createMockProduct()

      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('slug')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('stock')
      expect(product.track_inventory).toBe(true)
      expect(product.is_active).toBe(true)
      expect(typeof product.price).toBe('number')
      expect(product.price).toBeGreaterThan(0)
    })

    it('should allow overriding values', () => {
      const product = createMockProduct({
        name: 'Custom Product',
        price: 999,
        stock: 0,
      })

      expect(product.name).toBe('Custom Product')
      expect(product.price).toBe(999)
      expect(product.stock).toBe(0)
    })
  })

  describe('createMockVariant', () => {
    it('should create a variant with product_id', () => {
      const productId = 'test-product-123'
      const variant = createMockVariant(productId)

      expect(variant.product_id).toBe(productId)
      expect(variant).toHaveProperty('name')
      expect(variant).toHaveProperty('stock')
      expect(variant).toHaveProperty('sku')
    })

    it('should create variant with price_override or null', () => {
      const variant = createMockVariant()

      expect(variant).toHaveProperty('price_override')
      // price_override puede ser null o un número
      if (variant.price_override !== null) {
        expect(typeof variant.price_override).toBe('number')
      }
    })
  })

  describe('createMockOrder', () => {
    it('should create a complete order', () => {
      const order = createMockOrder()

      expect(order).toHaveProperty('order_number')
      expect(order.order_number).toMatch(/^ORD-\d{4}$/)
      expect(order).toHaveProperty('customer_email')
      expect(order).toHaveProperty('shipping_address')
      expect(order.shipping_address).toHaveProperty('country')
      expect(order.shipping_address.country).toBe('Uruguay')
    })

    it('should have valid payment method', () => {
      const order = createMockOrder()

      expect(['mercadopago', 'bank_transfer', 'cash_on_delivery']).toContain(
        order.payment_method
      )
    })

    it('should allow custom status', () => {
      const order = createMockOrder({ status: 'paid' })
      expect(order.status).toBe('paid')
    })
  })

  describe('createMockCartItem', () => {
    it('should create cart item with product', () => {
      const item = createMockCartItem()

      expect(item).toHaveProperty('product')
      expect(item).toHaveProperty('quantity')
      expect(item).toHaveProperty('unitPrice')
      expect(item).toHaveProperty('totalPrice')
    })

    it('should calculate totalPrice correctly', () => {
      const item = createMockCartItem()

      // totalPrice debe ser quantity * unitPrice
      const expectedTotal = item.quantity * item.unitPrice
      expect(item.totalPrice).toBe(expectedTotal)
    })

    it('should use variant price_override when available', () => {
      const item = createMockCartItem()

      if (item.variant && item.variant.price_override) {
        expect(item.unitPrice).toBe(item.variant.price_override)
      }
    })
  })

  describe('createMockCoupon', () => {
    it('should create coupon with valid discount type', () => {
      const coupon = createMockCoupon()

      expect(['percentage', 'fixed']).toContain(coupon.discount_type)
      expect(coupon.discount_value).toBeGreaterThan(0)
    })

    it('should have valid code format', () => {
      const coupon = createMockCoupon()

      expect(coupon.code).toMatch(/^[A-Z0-9]{8}$/)
    })

    it('should allow custom discount', () => {
      const coupon = createMockCoupon({
        discount_type: 'percentage',
        discount_value: 20,
      })

      expect(coupon.discount_type).toBe('percentage')
      expect(coupon.discount_value).toBe(20)
    })
  })

  describe('createMockCheckoutData', () => {
    it('should create complete checkout data', () => {
      const checkout = createMockCheckoutData()

      expect(checkout).toHaveProperty('customer')
      expect(checkout).toHaveProperty('items')
      expect(checkout).toHaveProperty('subtotal')
      expect(checkout).toHaveProperty('shippingCost')
      expect(checkout.items.length).toBeGreaterThan(0)
    })

    it('should have valid customer data', () => {
      const checkout = createMockCheckoutData()

      expect(checkout.customer).toHaveProperty('email')
      expect(checkout.customer).toHaveProperty('name')
      expect(checkout.customer).toHaveProperty('phone')
      expect(checkout.customer).toHaveProperty('address')
      expect(checkout.customer.email).toContain('@')
    })

    it('should calculate total correctly', () => {
      const checkout = createMockCheckoutData()

      const expectedTotal = checkout.subtotal + checkout.shippingCost - checkout.discount

      expect(checkout.total).toBe(expectedTotal)
    })
  })

  describe('createMany', () => {
    it('should create multiple items', () => {
      const products = createMany(createMockProduct, 5)

      expect(products).toHaveLength(5)
      expect(products[0]).toHaveProperty('id')
      expect(products[1]).toHaveProperty('id')
      // Todos los IDs deben ser diferentes
      const ids = products.map(p => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })

    it('should apply overrides to all items', () => {
      const products = createMany(createMockProduct, 3, { is_active: false })

      expect(products).toHaveLength(3)
      products.forEach(product => {
        expect(product.is_active).toBe(false)
      })
    })
  })
})
