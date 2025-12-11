'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartStore, CartItem, ShippingInfo } from '@/types/cart'
import { v4 as uuid } from 'uuid'

export type { ShippingInfo }

export interface AppliedCoupon {
  id: string
  code: string
  description: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
}

interface CartStoreWithCoupon extends CartStore {
  appliedCoupon: AppliedCoupon | null
  applyCoupon: (coupon: AppliedCoupon) => void
  removeCoupon: () => void
  shippingInfo: ShippingInfo | null
  setShippingInfo: (info: ShippingInfo | null) => void
  setShippingCost: (cost: number) => void
}

const initialState = {
  items: [],
  itemsCount: 0,
  subtotal: 0,
  shippingCost: 0,
  discount: 0,
  total: 0,
  isOpen: false,
  isLoading: false,
  appliedCoupon: null,
  shippingInfo: null,
}

function calculateTotals(
  items: CartItem[],
  coupon: AppliedCoupon | null = null,
  shippingCost: number = 0
) {
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0)

  let discount = 0
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discount = subtotal * (coupon.discountValue / 100)
    } else {
      discount = coupon.discountValue
    }
    // Aplicar límite si existe
    if (coupon.discountAmount && discount > coupon.discountAmount) {
      discount = coupon.discountAmount
    }
    // El descuento no puede ser mayor que el subtotal
    if (discount > subtotal) {
      discount = subtotal
    }
  }

  return {
    itemsCount,
    subtotal,
    shippingCost,
    discount,
    total: subtotal + shippingCost - discount,
  }
}

export const useCartStore = create<CartStoreWithCoupon>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (product, variant, quantity = 1) => {
        const items = get().items
        const coupon = get().appliedCoupon
        const unitPrice = variant?.price_override ?? product.price

        // Verificar si el item ya existe
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            ((!item.variant && !variant) ||
              (item.variant?.id === variant?.id))
        )

        let newItems: CartItem[]

        if (existingItemIndex >= 0) {
          // Actualizar cantidad existente
          newItems = items.map((item, index) =>
            index === existingItemIndex
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  totalPrice: (item.quantity + quantity) * item.unitPrice,
                }
              : item
          )
        } else {
          // Agregar nuevo item
          const newItem: CartItem = {
            id: uuid(),
            product,
            variant: variant ?? null,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
          }
          newItems = [...items, newItem]
        }

        const totals = calculateTotals(newItems, coupon, get().shippingCost)
        set({ items: newItems, ...totals })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId)
          return
        }

        const coupon = get().appliedCoupon
        const currentShipping = get().shippingCost
        const items = get().items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: quantity * item.unitPrice,
              }
            : item
        )

        const totals = calculateTotals(items, coupon, currentShipping)
        set({ items, ...totals })
      },

      removeItem: (itemId) => {
        const coupon = get().appliedCoupon
        const currentShipping = get().shippingCost
        const items = get().items.filter((item) => item.id !== itemId)
        const totals = calculateTotals(items, coupon, currentShipping)
        set({ items, ...totals })
      },

      clearCart: () => {
        set({ ...initialState })
      },

      applyCoupon: (coupon) => {
        const items = get().items
        const currentShipping = get().shippingCost
        const totals = calculateTotals(items, coupon, currentShipping)
        set({ appliedCoupon: coupon, ...totals })
      },

      removeCoupon: () => {
        const items = get().items
        const currentShipping = get().shippingCost
        const totals = calculateTotals(items, null, currentShipping)
        set({ appliedCoupon: null, ...totals })
      },

      setShippingInfo: (info) => {
        const items = get().items
        const coupon = get().appliedCoupon
        const newShippingCost = info?.cost ?? 0
        const totals = calculateTotals(items, coupon, newShippingCost)
        set({ shippingInfo: info, ...totals })
      },

      setShippingCost: (cost) => {
        const items = get().items
        const coupon = get().appliedCoupon
        const totals = calculateTotals(items, coupon, cost)
        set({ ...totals })
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        itemsCount: state.itemsCount,
        subtotal: state.subtotal,
        shippingCost: state.shippingCost,
        discount: state.discount,
        total: state.total,
        appliedCoupon: state.appliedCoupon,
        shippingInfo: state.shippingInfo,
      }),
    }
  )
)

// Hook simplificado
export function useCart() {
  const store = useCartStore()
  return store
}
