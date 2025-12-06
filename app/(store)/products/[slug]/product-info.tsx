'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PriceDisplay } from '@/components/store/price-display'
import { VariantSelector } from '@/components/store/variant-selector'
import { AddToCartButton } from '@/components/store/add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants/routes'
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

  const currentPrice = selectedVariant?.price_override ?? product.price
  const currentStock = selectedVariant?.stock ?? product.stock
  const isOutOfStock = product.track_inventory && currentStock <= 0

  const category = product.categories as { id: string; name: string; slug: string } | null

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center text-sm text-zinc-500">
        <Link href={ROUTES.HOME} className="hover:text-zinc-900 dark:hover:text-zinc-50">
          Inicio
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={ROUTES.PRODUCTS} className="hover:text-zinc-900 dark:hover:text-zinc-50">
          Productos
        </Link>
        {category && (
          <>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={ROUTES.CATEGORY(category.slug)}
              className="hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              {category.name}
            </Link>
          </>
        )}
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {product.name}
      </h1>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        {product.is_featured && (
          <Badge variant="secondary">Destacado</Badge>
        )}
        {isOutOfStock && (
          <Badge variant="destructive">Sin stock</Badge>
        )}
        {!isOutOfStock && currentStock <= 5 && product.track_inventory && (
          <Badge variant="warning">Últimas unidades</Badge>
        )}
      </div>

      {/* Price */}
      <div className="mt-6">
        <PriceDisplay
          price={currentPrice}
          comparePrice={product.compare_price}
          size="lg"
        />
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
        <p className="mt-4 text-sm text-zinc-500">
          {currentStock} unidades disponibles
        </p>
      )}

      {/* Add to cart */}
      <div className="mt-6">
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
        />
      </div>

      {/* Short description */}
      {product.description && (
        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="line-clamp-4 text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
      )}
    </div>
  )
}
