'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WishlistProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  images: string[]
}

interface WishlistStore {
  items: WishlistProduct[]
  addItem: (product: WishlistProduct) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items
        if (!items.find((item) => item.id === product.id)) {
          set({ items: [...items, product] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) })
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId)
      },

      clearWishlist: () => {
        set({ items: [] })
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useWishlist() {
  return useWishlistStore()
}
