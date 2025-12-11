'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart, Eye, Package, Star, Truck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice, calculateDiscount } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { IMAGES } from '@/lib/constants/config'
import type { Product } from '@/types/database'
import { toast } from 'sonner'

// Umbral para envío gratis
const FREE_SHIPPING_THRESHOLD = 15000

const MotionLink = motion.create(Link)

interface ProductCardProps {
  product: Product
  className?: string
  showAddToCart?: boolean
  variant?: 'grid' | 'horizontal'
}

function ProductCardComponent({
  product,
  className,
  showAddToCart = true,
  variant = 'grid',
}: ProductCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()

  // Evitar hidratación mismatch - solo verificar wishlist después del mount
  const isWishlisted = mounted && isInWishlist(product.id)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discount = hasDiscount
    ? calculateDiscount(product.price, product.compare_price!)
    : 0

  const isOutOfStock = product.track_inventory && product.stock <= 0

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
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
  }, [product, isOutOfStock, addItem])

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Verificar si el usuario está autenticado
    if (!session) {
      toast.error('Debes iniciar sesión para agregar a favoritos')
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

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
  }, [session, isWishlisted, product, router, addToWishlist, removeFromWishlist])

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
                aria-label={isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}
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

  const hasFreeShipping = product.price >= FREE_SHIPPING_THRESHOLD

  // Default grid variant
  return (
    <MotionLink
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-xl dark:border-zinc-800/80 dark:bg-zinc-950',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800">
        <Image
          src={product.images[0] || IMAGES.PLACEHOLDER}
          alt={product.name}
          fill
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {hasDiscount && (
            <Badge className="bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Destacado
            </Badge>
          )}
        </div>

        {/* Wishlist button - always visible */}
        <motion.div
          className="absolute right-3 top-3"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              'h-9 w-9 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900',
              isWishlisted && 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400'
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
            <span className="sr-only">{isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}</span>
          </Button>
        </motion.div>

        {/* Quick add to cart - appears on hover */}
        {showAddToCart && !isOutOfStock && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="w-full gap-2 rounded-xl bg-zinc-900/95 py-5 font-semibold text-white shadow-xl backdrop-blur-sm transition-all hover:bg-zinc-800 dark:bg-white/95 dark:text-zinc-900 dark:hover:bg-white opacity-0 group-hover:opacity-100"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Agregar al carrito
            </Button>
          </motion.div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-black/70">
            <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-zinc-900">
              <Package className="h-4 w-4" />
              Agotado
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-50">
          {product.name}
        </h3>

        <div className="mt-auto space-y-2 pt-3">
          {/* Price section */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm font-medium text-zinc-400 line-through">
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>

          {/* Free shipping badge */}
          {hasFreeShipping && !isOutOfStock && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Envío gratis</span>
            </div>
          )}

          {/* Stock indicator */}
          {!isOutOfStock && product.track_inventory && product.stock <= 5 && (
            <p className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              ¡Solo {product.stock} disponibles!
            </p>
          )}
        </div>
      </div>
    </MotionLink>
  )
}

// Memoizar el componente para evitar re-renders innecesarios
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.compare_price === nextProps.product.compare_price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.is_featured === nextProps.product.is_featured &&
    prevProps.className === nextProps.className &&
    prevProps.showAddToCart === nextProps.showAddToCart &&
    prevProps.variant === nextProps.variant
  )
})
