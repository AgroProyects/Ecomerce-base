'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartStore, CartItem } from '@/types/cart'
import { v4 as uuid } from 'uuid'

const initialState = {
  items: [],
  itemsCount: 0,
  subtotal: 0,
  shippingCost: 0,
  discount: 0,
  total: 0,
  isOpen: false,
  isLoading: false,
}

function calculateTotals(items: CartItem[]) {
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0)

  return {
    itemsCount,
    subtotal,
    total: subtotal, // Se puede agregar shipping y descuentos aquí
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (product, variant, quantity = 1) => {
        const items = get().items
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

        const totals = calculateTotals(newItems)
        set({ items: newItems, ...totals })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId)
          return
        }

        const items = get().items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: quantity * item.unitPrice,
              }
            : item
        )

        const totals = calculateTotals(items)
        set({ items, ...totals })
      },

      removeItem: (itemId) => {
        const items = get().items.filter((item) => item.id !== itemId)
        const totals = calculateTotals(items)
        set({ items, ...totals })
      },

      clearCart: () => {
        set({ ...initialState })
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
      }),
    }
  )
)

// Hook simplificado
export function useCart() {
  const store = useCartStore()
  return store
}
