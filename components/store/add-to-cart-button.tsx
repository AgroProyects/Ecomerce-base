'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'
import type { Product, ProductVariant } from '@/types/database'

interface AddToCartButtonProps {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'stock' | 'track_inventory'>
  variant?: Pick<ProductVariant, 'id' | 'name' | 'price_override' | 'stock'> | null
  className?: string
  showQuantity?: boolean
  maxQuantity?: number
}

export function AddToCartButton({
  product,
  variant,
  className,
  showQuantity = true,
  maxQuantity,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { addItem } = useCart()

  const stock = variant?.stock ?? product.stock
  const isOutOfStock = product.track_inventory && stock <= 0
  const max = maxQuantity ?? (product.track_inventory ? stock : 99)

  const handleIncrement = () => {
    if (quantity < max) {
      setQuantity((prev) => prev + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding) return

    setIsAdding(true)

    // Pequeño delay para mostrar la animación
    await new Promise(resolve => setTimeout(resolve, 300))

    addItem(product, variant, quantity)
    toast.success(
      quantity === 1
        ? 'Producto agregado al carrito'
        : `${quantity} productos agregados al carrito`
    )

    // Mostrar el check por un momento
    await new Promise(resolve => setTimeout(resolve, 800))

    setQuantity(1)
    setIsAdding(false)
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Quantity selector */}
      {showQuantity && !isOutOfStock && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Cantidad
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-14 text-center text-lg font-semibold tabular-nums">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              onClick={handleIncrement}
              disabled={quantity >= max}
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <Button
        size="lg"
        className={cn(
          "relative w-full h-14 text-base font-semibold rounded-xl transition-all duration-300",
          "bg-zinc-900 text-white hover:bg-zinc-800",
          "dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
          "shadow-lg hover:shadow-xl",
          "active:scale-[0.98]",
          isAdding && "bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-600 dark:text-white",
          isOutOfStock && "bg-zinc-300 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800 cursor-not-allowed shadow-none"
        )}
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
      >
        <span className={cn(
          "flex items-center justify-center gap-2 transition-all duration-300",
          isAdding && "opacity-0"
        )}>
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Sin stock disponible' : 'Agregar al carrito'}
        </span>

        {/* Success animation */}
        <span className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300",
          isAdding ? "opacity-100" : "opacity-0"
        )}>
          <Check className="h-5 w-5" />
          Agregado
        </span>
      </Button>

    </div>
  )
}
