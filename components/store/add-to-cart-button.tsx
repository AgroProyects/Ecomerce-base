'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
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

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('Producto sin stock')
      return
    }

    addItem(product, variant, quantity)
    toast.success(
      quantity === 1
        ? 'Producto agregado al carrito'
        : `${quantity} productos agregados al carrito`
    )
    setQuantity(1)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Quantity selector */}
      {showQuantity && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Cantidad:
          </span>
          <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none"
              onClick={handleDecrement}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Disminuir cantidad</span>
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none"
              onClick={handleIncrement}
              disabled={quantity >= max}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Aumentar cantidad</span>
            </Button>
          </div>
          {product.track_inventory && (
            <span className="text-sm text-zinc-500">
              ({stock} disponibles)
            </span>
          )}
        </div>
      )}

      {/* Add to cart button */}
      <Button
        size="lg"
        className={cn(
          "w-full h-16 text-lg font-bold shadow-lg transition-all duration-300",
          "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          "dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700",
          "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
          isOutOfStock && "from-zinc-400 to-zinc-500 hover:from-zinc-400 hover:to-zinc-500 cursor-not-allowed"
        )}
        onClick={handleAddToCart}
        disabled={isOutOfStock}
      >
        <ShoppingCart className="mr-3 h-6 w-6" />
        {isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
      </Button>
    </div>
  )
}
