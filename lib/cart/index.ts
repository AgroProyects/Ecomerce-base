'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  variant_name?: string | null;
  max_stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (product_id: string, variant_id?: string | null) => void;
  updateQuantity: (product_id: string, quantity: number, variant_id?: string | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItem: (product_id: string, variant_id?: string | null) => CartItem | undefined;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (i) =>
            i.product_id === item.product_id &&
            i.variant_id === item.variant_id
        );

        if (existingItemIndex > -1) {
          // Actualizar cantidad del item existente
          const newItems = [...items];
          const currentQty = newItems[existingItemIndex].quantity;
          const newQty = Math.min(
            currentQty + (item.quantity || 1),
            newItems[existingItemIndex].max_stock
          );
          newItems[existingItemIndex].quantity = newQty;
          set({ items: newItems });
        } else {
          // Agregar nuevo item
          set({
            items: [
              ...items,
              {
                ...item,
                quantity: Math.min(item.quantity || 1, item.max_stock),
              },
            ],
          });
        }
      },

      removeItem: (product_id, variant_id) => {
        set({
          items: get().items.filter(
            (item) =>
              !(item.product_id === product_id && item.variant_id === variant_id)
          ),
        });
      },

      updateQuantity: (product_id, quantity, variant_id) => {
        const { items } = get();
        const itemIndex = items.findIndex(
          (i) =>
            i.product_id === product_id &&
            i.variant_id === variant_id
        );

        if (itemIndex > -1) {
          const newItems = [...items];
          newItems[itemIndex].quantity = Math.min(
            Math.max(1, quantity),
            newItems[itemIndex].max_stock
          );
          set({ items: newItems });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItem: (product_id, variant_id) => {
        return get().items.find(
          (item) =>
            item.product_id === product_id &&
            item.variant_id === variant_id
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
