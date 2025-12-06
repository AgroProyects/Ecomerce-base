'use client'

import Link from 'next/link'
import { X, ShoppingBag } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/components/store/cart-item'
import { useCart } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'

export function CartDrawer() {
  const { items, itemsCount, total, isOpen, closeCart, clearCart } = useCart()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeCart])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-950',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Carrito ({itemsCount})
          </h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-180px)] flex-col overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12">
              <ShoppingBag className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Tu carrito está vacío
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Agregá productos para comenzar
              </p>
              <Button className="mt-6" onClick={closeCart} asChild>
                <Link href={ROUTES.PRODUCTS}>Ver productos</Link>
              </Button>
            </div>
          ) : (
            <div className="flex-1 py-2">
              {items.map((item) => (
                <CartItem key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Subtotal</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(total)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild onClick={closeCart}>
                <Link href={ROUTES.CHECKOUT}>Finalizar compra</Link>
              </Button>
              <Button variant="outline" asChild onClick={closeCart}>
                <Link href={ROUTES.CART}>Ver carrito</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
