'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/components/store/cart-item'
import { CartSummary } from '@/components/store/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'

export default function CartPage() {
  const { items, itemsCount, clearCart } = useCart()

  if (itemsCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tu carrito está vacío
          </h1>
          <p className="mt-2 text-zinc-500">
            Agregá productos para comenzar tu compra
          </p>
          <Button className="mt-6" asChild>
            <Link href={ROUTES.PRODUCTS}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver productos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Mi carrito
        </h1>
        <Button variant="ghost" onClick={clearCart}>
          Vaciar carrito
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <Button variant="outline" className="mt-4" asChild>
            <Link href={ROUTES.PRODUCTS}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Seguir comprando
            </Link>
          </Button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
