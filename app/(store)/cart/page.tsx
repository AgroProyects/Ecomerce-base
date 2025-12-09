'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartSummary } from '@/components/store/cart-summary'
import { useCart } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'
import { formatPrice } from '@/lib/utils/format'
import { IMAGES } from '@/lib/constants/config'
import { cn } from '@/lib/utils/cn'

export default function CartPage() {
  const { items, itemsCount, clearCart, updateQuantity, removeItem, subtotal } = useCart()

  if (itemsCount === 0) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <ShoppingBag className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Tu carrito está vacío
            </h1>
            <p className="mt-3 text-lg text-zinc-500">
              Parece que aún no has agregado ningún producto. ¡Explorá nuestro catálogo!
            </p>
            <Button size="lg" className="mt-8 h-14 rounded-full px-8" asChild>
              <Link href={ROUTES.PRODUCTS}>
                <Sparkles className="mr-2 h-5 w-5" />
                Explorar productos
              </Link>
            </Button>

            {/* Features */}
            <div className="mt-16 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <div className="text-center">
                <Truck className="mx-auto h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs text-zinc-500">Envío gratis +$50k</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="mx-auto h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs text-zinc-500">Compra segura</p>
              </div>
              <div className="text-center">
                <RotateCcw className="mx-auto h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs text-zinc-500">30 días devolución</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                <ShoppingBag className="h-8 w-8" />
                Mi Carrito
              </h1>
              <p className="mt-1 text-zinc-500">
                {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={clearCart}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vaciar carrito
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${item.variant?.id || 'default'}`}
                  className={cn(
                    'group overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:p-6',
                    index === 0 && 'ring-2 ring-zinc-900/5 dark:ring-zinc-50/5'
                  )}
                >
                  <div className="flex gap-4 md:gap-6">
                    {/* Image */}
                    <Link
                      href={ROUTES.PRODUCT(item.product.slug)}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 md:h-32 md:w-32"
                    >
                      <Image
                        src={item.product.images?.[0] || IMAGES.PLACEHOLDER}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={ROUTES.PRODUCT(item.product.slug)}
                              className="font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                            >
                              {item.product.name}
                            </Link>
                            {item.variant?.name && (
                              <p className="mt-1 text-sm text-zinc-500">
                                Variante: {item.variant.name}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center rounded-full border border-zinc-200 dark:border-zinc-700">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex h-10 w-10 items-center justify-center rounded-l-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium text-zinc-900 dark:text-zinc-50">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.product.track_inventory && item.quantity >= (item.variant?.stock ?? item.product.stock)}
                            className="flex h-10 w-10 items-center justify-center rounded-r-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-zinc-500">
                              {formatPrice(item.unitPrice)} c/u
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link href={ROUTES.PRODUCTS}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Seguir comprando
                </Link>
              </Button>

              <div className="hidden text-right sm:block">
                <p className="text-sm text-zinc-500">Subtotal ({itemsCount} productos)</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatPrice(subtotal)}
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Truck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Envío gratis</p>
                  <p className="text-sm text-zinc-500">En compras +$50k</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Pago seguro</p>
                  <p className="text-sm text-zinc-500">SSL encriptado</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                  <RotateCcw className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Devoluciones</p>
                  <p className="text-sm text-zinc-500">30 días gratis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary - sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
