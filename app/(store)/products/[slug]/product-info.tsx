'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package,
  Star,
  Check,
  AlertCircle
} from 'lucide-react'
import { PriceDisplay } from '@/components/store/price-display'
import { VariantSelector } from '@/components/store/variant-selector'
import { AddToCartButton } from '@/components/store/add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'
import { useWishlist } from '@/hooks/use-wishlist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { Product, ProductVariant } from '@/types/database'

interface ProductInfoProps {
  product: Product & {
    categories?: { id: string; name: string; slug: string } | null
  }
  variants: ProductVariant[]
}

export function ProductInfo({ product, variants }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  )
  const { addItem, removeItem, isInWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)

  const currentPrice = selectedVariant?.price_override ?? product.price
  const currentStock = selectedVariant?.stock ?? product.stock
  const isOutOfStock = product.track_inventory && currentStock <= 0
  const isLowStock = product.track_inventory && currentStock <= 5 && currentStock > 0

  const category = product.categories as { id: string; name: string; slug: string } | null

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeItem(product.id)
      toast.success('Eliminado de favoritos')
    } else {
      addItem({
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm">
        <Link
          href={ROUTES.HOME}
          className="text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Inicio
        </Link>
        <ChevronRight className="mx-2 h-4 w-4 text-zinc-400" />
        <Link
          href={ROUTES.PRODUCTS}
          className="text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Productos
        </Link>
        {category && (
          <>
            <ChevronRight className="mx-2 h-4 w-4 text-zinc-400" />
            <Link
              href={ROUTES.CATEGORY(category.slug)}
              className="text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              {category.name}
            </Link>
          </>
        )}
      </nav>

      {/* Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {product.is_featured && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Star className="mr-1 h-3 w-3" />
            Destacado
          </Badge>
        )}
        {isOutOfStock && (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Sin stock
          </Badge>
        )}
        {isLowStock && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            ¡Solo quedan {currentStock}!
          </Badge>
        )}
        {product.compare_price && product.compare_price > product.price && (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
            -{Math.round((1 - product.price / product.compare_price) * 100)}% OFF
          </Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
        {product.name}
      </h1>

      {/* Rating placeholder */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700'
              )}
            />
          ))}
        </div>
        <span className="text-sm text-zinc-500">(4.0) · 24 opiniones</span>
      </div>

      {/* Price */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <PriceDisplay
          price={currentPrice}
          comparePrice={product.compare_price}
          size="xl"
        />
        {product.compare_price && product.compare_price > product.price && (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            ¡Ahorrás ${((product.compare_price - product.price)).toLocaleString('es-AR')}!
          </p>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="mt-6">
          <VariantSelector
            variants={variants}
            selectedVariant={selectedVariant}
            onSelect={setSelectedVariant}
          />
        </div>
      )}

      {/* Stock info */}
      {product.track_inventory && !isOutOfStock && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className={cn(
            'h-2 w-2 rounded-full',
            currentStock > 10 ? 'bg-emerald-500' : currentStock > 5 ? 'bg-amber-500' : 'bg-red-500'
          )} />
          <span className="text-zinc-600 dark:text-zinc-400">
            {currentStock > 10
              ? 'Stock disponible'
              : `Solo quedan ${currentStock} unidades`}
          </span>
        </div>
      )}

      {/* Add to cart */}
      <div className="mt-8 space-y-4">
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            images: product.images,
            stock: product.stock,
            track_inventory: product.track_inventory,
          }}
          variant={selectedVariant}
          showQuantity={!isOutOfStock}
        />

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'flex-1 h-12 rounded-xl',
              isWishlisted && 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50'
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className={cn('mr-2 h-5 w-5', isWishlisted && 'fill-current')} />
            {isWishlisted ? 'En favoritos' : 'Agregar a favoritos'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Envío gratis</p>
            <p className="text-xs text-zinc-500">En compras +$50k</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Garantía</p>
            <p className="text-xs text-zinc-500">12 meses</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <RotateCcw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Devoluciones</p>
            <p className="text-xs text-zinc-500">30 días gratis</p>
          </div>
        </div>
      </div>

      {/* Description preview */}
      {product.description && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            <Package className="h-5 w-5" />
            Descripción
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
      )}

      {/* Features list */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Check className="h-4 w-4 text-emerald-500" />
          Compra 100% segura
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Check className="h-4 w-4 text-emerald-500" />
          Pago en cuotas sin interés
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Check className="h-4 w-4 text-emerald-500" />
          Atención al cliente 24/7
        </div>
      </div>
    </div>
  )
}
