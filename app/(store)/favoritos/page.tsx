'use client'

import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import { toast } from 'sonner'

export default function FavoritosPage() {
  const { items, removeItem, clearWishlist } = useWishlist()
  const { addItem } = useCart()

  const handleAddToCart = (product: typeof items[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
      stock: 999,
      track_inventory: false,
    })
    toast.success('Producto agregado al carrito')
  }

  const handleRemove = (productId: string) => {
    removeItem(productId)
    toast.success('Producto eliminado de favoritos')
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Heart className="h-8 w-8 text-red-500" />
            Mis Favoritos
          </h1>
          <p className="mt-2 text-zinc-500">
            {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              clearWishlist()
              toast.success('Lista de favoritos vaciada')
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vaciar lista
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <Heart className="mx-auto mb-4 h-16 w-16 text-zinc-300" />
          <h2 className="text-xl font-semibold">Tu lista de favoritos está vacía</h2>
          <p className="mt-2 text-zinc-500">
            Guardá tus productos favoritos para encontrarlos más fácil
          </p>
          <Button asChild className="mt-6">
            <Link href={ROUTES.PRODUCTS}>Explorar productos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Botón eliminar */}
              <button
                onClick={() => handleRemove(product.id)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-red-50 dark:bg-zinc-800/90 dark:hover:bg-red-900/50"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Imagen */}
              <Link href={ROUTES.PRODUCT(product.slug)}>
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-12 w-12 text-zinc-300" />
                    </div>
                  )}
                  {product.compare_price && product.compare_price > product.price && (
                    <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      -{Math.round((1 - product.price / product.compare_price) * 100)}%
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link href={ROUTES.PRODUCT(product.slug)}>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary">
                    {product.name}
                  </h3>
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(product.compare_price)}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => handleAddToCart(product)}
                  className="mt-4 w-full"
                  size="sm"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Agregar al carrito
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
