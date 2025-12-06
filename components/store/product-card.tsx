'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice, calculateDiscount } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { IMAGES } from '@/lib/constants/config'
import type { Product } from '@/types/database'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  className?: string
  showAddToCart?: boolean
}

export function ProductCard({
  product,
  className,
  showAddToCart = true,
}: ProductCardProps) {
  const { addItem } = useCart()

  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discount = hasDiscount
    ? calculateDiscount(product.price, product.compare_price!)
    : 0

  const isOutOfStock = product.track_inventory && product.stock <= 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error('Producto sin stock')
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
      stock: product.stock,
      track_inventory: product.track_inventory,
    })

    toast.success('Producto agregado al carrito')
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950',
        className
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={product.images[0] || IMAGES.PLACEHOLDER}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge variant="secondary" className="text-xs">
              Destacado
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="outline" className="bg-white text-xs">
              Sin stock
            </Badge>
          )}
        </div>

        {/* Quick add button */}
        {showAddToCart && !isOutOfStock && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Agregar al carrito</span>
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-zinc-500 line-through">
              {formatPrice(product.compare_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
