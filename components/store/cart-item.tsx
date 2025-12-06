'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { IMAGES } from '@/lib/constants/config'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
  className?: string
  compact?: boolean
}

export function CartItem({ item, className, compact = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  const handleIncrement = () => {
    const maxStock = item.variant?.stock ?? item.product.stock
    if (item.product.track_inventory && item.quantity >= maxStock) {
      return
    }
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      removeItem(item.id)
      return
    }
    updateQuantity(item.id, item.quantity - 1)
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  return (
    <div
      className={cn(
        'flex gap-4 border-b border-zinc-200 py-4 dark:border-zinc-800',
        compact && 'py-3',
        className
      )}
    >
      {/* Imagen */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900"
      >
        <Image
          src={item.product.images[0] || IMAGES.PLACEHOLDER}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/products/${item.product.slug}`}
              className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
            >
              {item.product.name}
            </Link>
            {item.variant && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.variant.name}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-red-500"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleDecrement}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Disminuir cantidad</span>
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Aumentar cantidad</span>
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(item.totalPrice)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-zinc-500">
                {formatPrice(item.unitPrice)} c/u
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
