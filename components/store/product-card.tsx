'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Eye, Package } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice, calculateDiscount } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { IMAGES } from '@/lib/constants/config'
import type { Product } from '@/types/database'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  className?: string
  showAddToCart?: boolean
  variant?: 'grid' | 'horizontal'
}

export function ProductCard({
  product,
  className,
  showAddToCart = true,
  variant = 'grid',
}: ProductCardProps) {
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)

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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isWishlisted) {
      removeFromWishlist(product.id)
      toast.success('Eliminado de favoritos')
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_price: product.compare_price,
        images: product.images,
      })
      toast.success('Agregado a favoritos')
    }
  }

  // Horizontal variant for list view
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          'group flex gap-4 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 sm:h-40 sm:w-40">
          <Image
            src={product.images[0] || IMAGES.PLACEHOLDER}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
          />
          {hasDiscount && (
            <Badge variant="destructive" className="absolute left-2 top-2 text-xs">
              -{discount}%
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="outline" className="bg-white text-xs">
                Sin stock
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="mb-1 flex flex-wrap gap-1">
              {product.is_featured && (
                <Badge variant="secondary" className="text-xs">
                  Destacado
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-50">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-zinc-500 line-through">
                  {formatPrice(product.compare_price!)}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  'h-9 w-9',
                  isWishlisted && 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 dark:border-red-900 dark:bg-red-950'
                )}
                onClick={handleToggleWishlist}
              >
                <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
              </Button>
              {showAddToCart && !isOutOfStock && (
                <Button size="sm" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Default grid variant
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={product.images[0] || IMAGES.PLACEHOLDER}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <Badge variant="destructive" className="px-2 py-1 text-xs font-semibold shadow-md">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold shadow-md">
              Destacado
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="outline" className="bg-white/95 px-2 py-1 text-xs font-semibold shadow-md">
              Sin stock
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              'h-10 w-10 rounded-full shadow-lg backdrop-blur-sm',
              isWishlisted && 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600'
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
            <span className="sr-only">{isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}</span>
          </Button>
          {showAddToCart && !isOutOfStock && (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg backdrop-blur-sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Agregar al carrito</span>
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg backdrop-blur-sm"
          >
            <Eye className="h-5 w-5" />
            <span className="sr-only">Ver detalles</span>
          </Button>
        </div>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] dark:bg-black/60">
            <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
              <Package className="h-4 w-4" />
              Sin stock
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-50">
          {product.name}
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-zinc-500 line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {!isOutOfStock && product.track_inventory && product.stock <= 5 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              ¡Solo quedan {product.stock}!
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
