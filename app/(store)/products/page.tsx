import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductGrid } from '@/components/store/product-grid'
import { CategoryNav } from '@/components/store/category-nav'
import { PageSpinner } from '@/components/ui/spinner'
import { getProducts } from '@/actions/products'
import { getCategories } from '@/actions/categories'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Explorá nuestro catálogo completo de productos',
}

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    sort?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search
  const sort = params.sort || 'created_at:desc'
  const [sortBy, sortOrder] = sort.split(':') as [string, 'asc' | 'desc']

  const [productsResult, categories] = await Promise.all([
    getProducts({
      page,
      pageSize: 12,
      search,
      sortBy: sortBy as any,
      sortOrder,
    }),
    getCategories(true),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Todos los productos
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {productsResult.pagination.totalItems} productos encontrados
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64">
          <div className="sticky top-20">
            <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">
              Categorías
            </h3>
            <CategoryNav
              categories={categories}
              orientation="vertical"
            />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Sort controls */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Página {page} de {productsResult.pagination.totalPages}
            </span>
            {/* Sort dropdown would go here */}
          </div>

          <Suspense fallback={<PageSpinner />}>
            <ProductGrid products={productsResult.data} columns={3} />
          </Suspense>

          {/* Pagination */}
          {productsResult.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {/* Simple pagination - can be enhanced */}
              {Array.from({ length: productsResult.pagination.totalPages }, (_, i) => (
                <a
                  key={i + 1}
                  href={`/products?page=${i + 1}${search ? `&search=${search}` : ''}`}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${
                    page === i + 1
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
