'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Package,
  DollarSign
} from 'lucide-react'
import { ProductCard } from '@/components/store/product-card'
import { PriceRangeSlider } from '@/components/store/price-range-slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import type { Product, Category } from '@/types/database'

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Mas recientes' },
  { value: 'created_at:asc', label: 'Mas antiguos' },
  { value: 'price:asc', label: 'Menor precio' },
  { value: 'price:desc', label: 'Mayor precio' },
  { value: 'name:asc', label: 'A-Z' },
  { value: 'name:desc', label: 'Z-A' },
]

// Rango de precios por defecto (ajustar segun tu catalogo)
const DEFAULT_MIN_PRICE = 0
const DEFAULT_MAX_PRICE = 500000
const PRICE_STEP = 1000

interface ProductsData {
  data: Product[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])

  // Get params from URL
  const page = Number(searchParams.get('page')) || 1
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'created_at:desc'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  // Sincronizar priceRange con URL params
  useEffect(() => {
    const min = minPrice ? Number(minPrice) : DEFAULT_MIN_PRICE
    const max = maxPrice ? Number(maxPrice) : DEFAULT_MAX_PRICE
    setPriceRange([min, max])
  }, [minPrice, maxPrice])

  // Update URL params
  const updateParams = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    // Reset to page 1 when filters change
    if (!newParams.page) {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  // Aplicar filtro de precio cuando se suelta el slider
  const handlePriceChangeEnd = useCallback((value: [number, number]) => {
    updateParams({
      minPrice: value[0] > DEFAULT_MIN_PRICE ? value[0].toString() : '',
      maxPrice: value[1] < DEFAULT_MAX_PRICE ? value[1].toString() : '',
    })
  }, [updateParams])

  // Fetch products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [sortBy, sortOrder] = sort.split(':')
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: '12',
          ...(search && { search }),
          ...(category && { category }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
        })

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?${params}`),
          fetch('/api/categories'),
        ])

        const productsData: ProductsData = await productsRes.json()
        const categoriesData: Category[] = await categoriesRes.json()

        setProducts(productsData.data || [])
        setPagination({
          page: productsData.pagination?.page || 1,
          totalPages: productsData.pagination?.totalPages || 1,
          totalItems: productsData.pagination?.totalItems || 0,
        })
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, search, category, sort, minPrice, maxPrice])

  const selectedCategory = useMemo(() =>
    categories.find(c => c.slug === category),
    [categories, category]
  )

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category) count++
    if (minPrice || maxPrice) count++
    return count
  }, [category, minPrice, maxPrice])

  const clearAllFilters = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    router.push(pathname)
  }

  const clearPriceFilter = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    updateParams({ minPrice: '', maxPrice: '' })
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {selectedCategory ? selectedCategory.name : 'Todos los productos'}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-300">
            {selectedCategory?.description || 'Explorá nuestro catálogo completo con los mejores productos al mejor precio'}
          </p>
          {search && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/10 text-white">
                <Search className="mr-1 h-3 w-3" />
                Buscando: "{search}"
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-white hover:bg-white/10"
                onClick={() => updateParams({ search: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  <Package className="h-4 w-4" />
                  Categorías
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParams({ category: '' })}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      !category
                        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    )}
                  >
                    Todas las categorías
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateParams({ category: cat.slug })}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        category === cat.slug
                          ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    <DollarSign className="h-4 w-4" />
                    Rango de precio
                  </h3>
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={clearPriceFilter}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <PriceRangeSlider
                  min={DEFAULT_MIN_PRICE}
                  max={DEFAULT_MAX_PRICE}
                  step={PRICE_STEP}
                  value={priceRange}
                  onChange={setPriceRange}
                  onChangeEnd={handlePriceChangeEnd}
                />
              </div>

              {/* Clear filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros ({activeFiltersCount})
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2">{activeFiltersCount}</Badge>
                  )}
                </Button>

                <span className="text-sm text-zinc-500">
                  {pagination.totalItems} productos
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value })}
                    className="appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-10 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>

                {/* View mode */}
                <div className="hidden items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700 sm:flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      viewMode === 'list'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Filtros</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-zinc-500">Categorías</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateParams({ category: '' })}
                      className={cn(
                        'rounded-full px-3 py-1 text-sm transition-colors',
                        !category
                          ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      )}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams({ category: cat.slug })}
                        className={cn(
                          'rounded-full px-3 py-1 text-sm transition-colors',
                          category === cat.slug
                            ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                      <DollarSign className="h-3.5 w-3.5" />
                      Rango de precio
                    </h4>
                    {(minPrice || maxPrice) && (
                      <button
                        onClick={clearPriceFilter}
                        className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <PriceRangeSlider
                    min={DEFAULT_MIN_PRICE}
                    max={DEFAULT_MAX_PRICE}
                    step={PRICE_STEP}
                    value={priceRange}
                    onChange={setPriceRange}
                    onChangeEnd={(value) => {
                      handlePriceChangeEnd(value)
                      setShowFilters(false)
                    }}
                  />
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(category || minPrice || maxPrice) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">Filtros activos:</span>
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory.name}
                    <button onClick={() => updateParams({ category: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(minPrice || maxPrice) && (
                  <Badge variant="secondary" className="gap-1">
                    {minPrice && maxPrice
                      ? `${formatPrice(Number(minPrice))} - ${formatPrice(Number(maxPrice))}`
                      : minPrice
                        ? `Desde ${formatPrice(Number(minPrice))}`
                        : `Hasta ${formatPrice(Number(maxPrice))}`}
                    <button onClick={() => updateParams({ minPrice: '', maxPrice: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid/List */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
                <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No encontramos productos
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Intentá ajustar los filtros o buscá algo diferente
                </p>
                {activeFiltersCount > 0 && (
                  <Button className="mt-4" onClick={clearAllFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} variant="horizontal" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: (page - 1).toString() })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      // Show first, last, current, and adjacent pages
                      if (p === 1 || p === pagination.totalPages) return true
                      if (Math.abs(p - page) <= 1) return true
                      return false
                    })
                    .map((p, idx, arr) => {
                      // Add ellipsis
                      const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-zinc-400">...</span>
                          )}
                          <Button
                            variant={page === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateParams({ page: p.toString() })}
                            className="min-w-[40px]"
                          >
                            {p}
                          </Button>
                        </div>
                      )
                    })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= pagination.totalPages}
                  onClick={() => updateParams({ page: (page + 1).toString() })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
