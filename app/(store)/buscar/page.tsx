import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Package, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

const ITEMS_PER_PAGE = 12

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>
}

async function SearchResults({
  query,
  category,
  sort,
  page
}: {
  query: string
  category?: string
  sort?: string
  page: number
}) {
  const supabase = createAdminClient()

  // Calcular offset para paginación
  const offset = (page - 1) * ITEMS_PER_PAGE

  let productsQuery = supabase
    .from('products')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })
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

  // Aplicar paginación
  const { data: products, count } = await productsQuery
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  // Obtener categorías para filtros
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order')

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Construir URL base para links
  const buildUrl = (params: { page?: number; category?: string; sort?: string }) => {
    const searchParams = new URLSearchParams()
    if (query) searchParams.set('q', query)
    if (params.category !== undefined) {
      if (params.category) searchParams.set('category', params.category)
    } else if (category) {
      searchParams.set('category', category)
    }
    if (params.sort !== undefined) {
      if (params.sort) searchParams.set('sort', params.sort)
    } else if (sort) {
      searchParams.set('sort', sort)
    }
    if (params.page && params.page > 1) searchParams.set('page', params.page.toString())
    return `/buscar?${searchParams.toString()}`
  }

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      if (page > 3) pages.push('ellipsis')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (page < totalPages - 2) pages.push('ellipsis')

      pages.push(totalPages)
    }

    return pages
  }

  // Componente de filtros (reutilizado en sidebar y móvil)
  const FiltersContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-zinc-500">Categorías</h3>
        <div className="space-y-1">
          <Link
            href={buildUrl({ category: '' })}
            onClick={onClose}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
              !category ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Todas las categorías
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.id })}
              onClick={onClose}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                category === cat.id ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-3 font-semibold text-sm uppercase tracking-wide text-zinc-500">Ordenar por</h3>
        <div className="space-y-1">
          {[
            { value: '', label: 'Relevancia' },
            { value: 'price_asc', label: 'Menor precio' },
            { value: 'price_desc', label: 'Mayor precio' },
            { value: 'newest', label: 'Más nuevos' },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildUrl({ sort: option.value })}
              onClick={onClose}
              className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                (sort || '') === option.value ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )

  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Package className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No encontramos resultados</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          {query ? `No hay productos que coincidan con "${query}"` : 'No hay productos disponibles'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {category && (
            <Button variant="outline" asChild>
              <Link href={buildUrl({ category: '' })}>Quitar filtro de categoría</Link>
            </Button>
          )}
          <Button asChild>
            <Link href={ROUTES.PRODUCTS}>Ver todos los productos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[240px_1fr]">
      {/* Sidebar - Filtros (Desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <FiltersContent />
        </div>
      </aside>

      {/* Contenido principal */}
      <div>
        {/* Barra superior con info y filtros móvil */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Mostrando {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, totalCount)} de {totalCount} {totalCount === 1 ? 'resultado' : 'resultados'}
              {query && <span className="font-medium"> para "{query}"</span>}
            </p>
          </div>

          {/* Filtros móvil */}
          <div className="flex gap-2 lg:hidden w-full sm:w-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(category || sort) && (
                    <Badge variant="secondary" className="ml-1">
                      {[category, sort].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SheetClose asChild>
                    <div>
                      <FiltersContent onClose={() => {}} />
                    </div>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            {/* Ordenamiento rápido en móvil */}
            <select
              value={sort || ''}
              onChange={(e) => {
                window.location.href = buildUrl({ sort: e.target.value })
              }}
              className="flex-1 sm:flex-none h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Relevancia</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="newest">Más nuevos</option>
            </select>
          </div>
        </div>

        {/* Filtros activos */}
        {(category || sort) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {category && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {categories?.find(c => c.id === category)?.name || 'Categoría'}
                <Link
                  href={buildUrl({ category: '' })}
                  className="ml-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </Link>
              </Badge>
            )}
            {sort && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {sort === 'price_asc' ? 'Menor precio' : sort === 'price_desc' ? 'Mayor precio' : 'Más nuevos'}
                <Link
                  href={buildUrl({ sort: '' })}
                  className="ml-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </Link>
              </Badge>
            )}
            <Link
              href={`/buscar${query ? `?q=${encodeURIComponent(query)}` : ''}`}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
            >
              Limpiar filtros
            </Link>
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={ROUTES.PRODUCT(product.slug)}
              className="group overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-8 w-8 sm:h-12 sm:w-12 text-zinc-300" />
                  </div>
                )}
                {product.compare_price && product.compare_price > product.price && (
                  <Badge className="absolute left-2 top-2 sm:left-3 sm:top-3 bg-red-500 text-white text-xs">
                    -{Math.round((1 - product.price / product.compare_price) * 100)}%
                  </Badge>
                )}
              </div>
              <div className="p-3 sm:p-4">
                {product.category && (
                  <p className="mb-1 text-xs text-zinc-500 truncate">{product.category.name}</p>
                )}
                <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-primary min-h-[2.5rem] sm:min-h-[3rem]">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-xs sm:text-sm text-zinc-400 line-through">
                      {formatPrice(product.compare_price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-1 sm:gap-2" aria-label="Paginación">
            {/* Botón anterior */}
            {page > 1 ? (
              <Link
                href={buildUrl({ page: page - 1 })}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, idx) => (
                pageNum === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400">...</span>
                ) : (
                  <Link
                    key={pageNum}
                    href={buildUrl({ page: pageNum })}
                    className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'
                    }`}
                    aria-current={page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Link>
                )
              ))}
            </div>

            {/* Botón siguiente */}
            {page < totalPages ? (
              <Link
                href={buildUrl({ page: page + 1 })}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </nav>
        )}

        {/* Info de paginación móvil */}
        {totalPages > 1 && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Página {page} de {totalPages}
          </p>
        )}
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mt-6" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </aside>
      <div>
        <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 mb-6" />
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="aspect-square animate-pulse bg-zinc-100 dark:bg-zinc-800" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function BuscarPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const category = params.category
  const sort = params.sort
  const page = Math.max(1, parseInt(params.page || '1', 10))

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {query ? `Resultados para "${query}"` : 'Buscar productos'}
          </h1>
        </div>
        <p className="text-sm sm:text-base text-zinc-500 ml-[52px]">
          Explorá nuestro catálogo de productos
        </p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={query} category={category} sort={sort} page={page} />
      </Suspense>
    </div>
  )
}
