import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Package, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

async function SearchResults({ query, category, sort }: { query: string; category?: string; sort?: string }) {
  const supabase = createAdminClient()

  let productsQuery = supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('is_active', true)

  if (query) {
    productsQuery = productsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  if (category) {
    productsQuery = productsQuery.eq('category_id', category)
  }

  // Ordenamiento
  switch (sort) {
    case 'price_asc':
      productsQuery = productsQuery.order('price', { ascending: true })
      break
    case 'price_desc':
      productsQuery = productsQuery.order('price', { ascending: false })
      break
    case 'newest':
      productsQuery = productsQuery.order('created_at', { ascending: false })
      break
    default:
      productsQuery = productsQuery.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  }

  const { data: products } = await productsQuery.limit(50)

  // Obtener categorías para filtros
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order')

  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-zinc-300" />
        <h2 className="text-xl font-semibold">No encontramos resultados</h2>
        <p className="mt-2 text-zinc-500">
          {query ? `No hay productos que coincidan con "${query}"` : 'No hay productos disponibles'}
        </p>
        <Button asChild className="mt-6">
          <Link href={ROUTES.PRODUCTS}>Ver todos los productos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      {/* Sidebar - Filtros */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          <div>
            <h3 className="mb-3 font-semibold">Categorías</h3>
            <div className="space-y-2">
              <Link
                href={`/buscar?q=${encodeURIComponent(query)}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  !category ? 'bg-zinc-100 font-medium dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                Todas las categorías
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/buscar?q=${encodeURIComponent(query)}&category=${cat.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    category === cat.id ? 'bg-zinc-100 font-medium dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Ordenar por</h3>
            <div className="space-y-2">
              {[
                { value: '', label: 'Relevancia' },
                { value: 'price_asc', label: 'Menor precio' },
                { value: 'price_desc', label: 'Mayor precio' },
                { value: 'newest', label: 'Más nuevos' },
              ].map((option) => (
                <Link
                  key={option.value}
                  href={`/buscar?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ''}${option.value ? `&sort=${option.value}` : ''}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    (sort || '') === option.value ? 'bg-zinc-100 font-medium dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Productos */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {products.length} {products.length === 1 ? 'resultado' : 'resultados'}
            {query && <span> para "{query}"</span>}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={ROUTES.PRODUCT(product.slug)}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
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
                  <Badge className="absolute left-3 top-3 bg-red-500 text-white">
                    -{Math.round((1 - product.price / product.compare_price) * 100)}%
                  </Badge>
                )}
              </div>
              <div className="p-4">
                {product.category && (
                  <p className="mb-1 text-xs text-zinc-500">{product.category.name}</p>
                )}
                <h3 className="font-medium line-clamp-2 group-hover:text-primary">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(product.compare_price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:block">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </aside>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="aspect-square animate-pulse bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function BuscarPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const category = params.category
  const sort = params.sort

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 text-zinc-400" />
          <h1 className="text-2xl font-bold">
            {query ? `Resultados para "${query}"` : 'Buscar productos'}
          </h1>
        </div>
        <p className="text-zinc-500">
          Explorá nuestro catálogo de productos
        </p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={query} category={category} sort={sort} />
      </Suspense>
    </div>
  )
}
