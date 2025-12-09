'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  ArrowLeft,
  FolderTree,
  Sparkles,
} from 'lucide-react'
import { ProductCard } from '@/components/store/product-card'
import { PriceRangeSlider } from '@/components/store/price-range-slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import type { Product, Category } from '@/types/database'

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguos' },
  { value: 'price:asc', label: 'Menor precio' },
  { value: 'price:desc', label: 'Mayor precio' },
  { value: 'name:asc', label: 'A-Z' },
  { value: 'name:desc', label: 'Z-A' },
]

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

export default function CategoryPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])

  // Get params from URL
  const page = Number(searchParams.get('page')) || 1
  const sort = searchParams.get('sort') || 'created_at:desc'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  // Sync priceRange with URL params
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
    if (!newParams.page) {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const handlePriceChangeEnd = useCallback((value: [number, number]) => {
    updateParams({
      minPrice: value[0] > DEFAULT_MIN_PRICE ? value[0].toString() : '',
      maxPrice: value[1] < DEFAULT_MAX_PRICE ? value[1].toString() : '',
    })
  }, [updateParams])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch category info
        const categoryRes = await fetch(`/api/categories?slug=${slug}`)
        const categoriesData = await categoryRes.json()
        const currentCategory = Array.isArray(categoriesData)
          ? categoriesData.find((c: Category) => c.slug === slug)
          : null

        if (!currentCategory) {
          router.push('/products')
          return
        }

        setCategory(currentCategory)
        setAllCategories(Array.isArray(categoriesData) ? categoriesData : [])

        // Find subcategories
        const subs = Array.isArray(categoriesData)
          ? categoriesData.filter((c: Category) => c.parent_id === currentCategory.id)
          : []
        setSubcategories(subs)

        // Fetch products
        const [sortBy, sortOrder] = sort.split(':')
        const productParams = new URLSearchParams({
          page: page.toString(),
          pageSize: '12',
          category: slug,
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
        })

        const productsRes = await fetch(`/api/products?${productParams}`)
        const productsData: ProductsData = await productsRes.json()

        setProducts(productsData.data || [])
        setPagination({
          page: productsData.pagination?.page || 1,
          totalPages: productsData.pagination?.totalPages || 1,
          totalItems: productsData.pagination?.totalItems || 0,
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug, page, sort, minPrice, maxPrice, router])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (minPrice || maxPrice) count++
    return count
  }, [minPrice, maxPrice])

  const clearPriceFilter = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    updateParams({ minPrice: '', maxPrice: '' })
  }

  const clearAllFilters = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    const params = new URLSearchParams()
    router.push(`${pathname}?${params.toString()}`)
  }

  // Skeleton loading
  if (loading && !category) {
    return (
      <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800">
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-10 w-64 bg-zinc-700" />
            <Skeleton className="mt-3 h-5 w-96 bg-zinc-700" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!category) return null

  // Get parent categories for breadcrumb
  const parentCategory = allCategories.find(c => c.id === category.parent_id)

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950">
        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/products"
              className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Productos
            </Link>
            {parentCategory && (
              <>
                <span className="text-zinc-600">/</span>
                <Link
                  href={`/category/${parentCategory.slug}`}
                  className="text-zinc-400 transition-colors hover:text-white"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            <span className="text-zinc-600">/</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 max-w-2xl text-base text-zinc-300 md:text-lg">
                  {category.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-sm">
                <Package className="mr-1.5 h-3.5 w-3.5" />
                {pagination.totalItems} productos
              </Badge>
            </div>
          </div>

          {/* Subcategories Pills */}
          {subcategories.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/category/${sub.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Related Categories */}
              {allCategories.filter(c => !c.parent_id && c.id !== category.id).length > 0 && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Sparkles className="h-4 w-4" />
                    Otras categorías
                  </h3>
                  <div className="space-y-1">
                    {allCategories
                      .filter(c => !c.parent_id && c.id !== category.id)
                      .slice(0, 8)
                      .map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          className="block rounded-xl px-4 py-2.5 text-sm text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    <Link
                      href="/products"
                      className="mt-2 block rounded-xl bg-zinc-100 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Ver todos los productos
                    </Link>
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                    Precio
                  </h3>
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={clearPriceFilter}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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

              {/* Clear all filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5">{activeFiltersCount}</Badge>
                  )}
                </Button>

                <span className="hidden text-sm text-zinc-500 sm:inline">
                  Mostrando {products.length} de {pagination.totalItems} productos
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value })}
                    className="appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm font-medium transition-colors hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
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
                <div className="hidden items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800 sm:flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-lg p-2 transition-all',
                      viewMode === 'grid'
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-lg p-2 transition-all',
                      viewMode === 'list'
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
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
              <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
                <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="font-semibold">Filtros</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4">
                  {/* Subcategories Mobile */}
                  {subcategories.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <FolderTree className="h-4 w-4" />
                        Subcategorías
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/category/${sub.slug}`}
                            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Mobile */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <DollarSign className="h-4 w-4" />
                        Rango de precio
                      </h4>
                      {(minPrice || maxPrice) && (
                        <button
                          onClick={clearPriceFilter}
                          className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
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
              </div>
            )}

            {/* Active Filters */}
            {(minPrice || maxPrice) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">Filtros activos:</span>
                <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1.5">
                  {minPrice && maxPrice
                    ? `${formatPrice(Number(minPrice))} - ${formatPrice(Number(maxPrice))}`
                    : minPrice
                      ? `Desde ${formatPrice(Number(minPrice))}`
                      : `Hasta ${formatPrice(Number(maxPrice))}`}
                  <button
                    onClick={clearPriceFilter}
                    className="ml-1 rounded-full p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            {/* Products Grid/List */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="mt-3 h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-20 dark:border-zinc-800">
                <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                  <Package className="h-12 w-12 text-zinc-400" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  No encontramos productos
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-zinc-500">
                  No hay productos en esta categoría con los filtros seleccionados. Probá ajustando los filtros.
                </p>
                {activeFiltersCount > 0 && (
                  <Button className="mt-6 rounded-xl" onClick={clearAllFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
                <Link href="/products">
                  <Button variant="outline" className="mt-3 rounded-xl">
                    Ver todos los productos
                  </Button>
                </Link>
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
                  className="rounded-xl"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: (page - 1).toString() })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (p === 1 || p === pagination.totalPages) return true
                      if (Math.abs(p - page) <= 1) return true
                      return false
                    })
                    .map((p, idx, arr) => {
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
                            className="min-w-[40px] rounded-xl"
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
                  className="rounded-xl"
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
