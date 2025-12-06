import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductGrid } from '@/components/store/product-grid'
import { CategoryNav } from '@/components/store/category-nav'
import { getProducts } from '@/actions/products'
import { getCategories, getCategoryBySlug, getSubcategories } from '@/actions/categories'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: 'Categoría no encontrada' }
  }

  return {
    title: category.name,
    description: category.description || `Productos en ${category.name}`,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const [productsResult, categories, subcategories] = await Promise.all([
    getProducts({
      page,
      pageSize: 12,
      categoryId: category.id,
    }),
    getCategories(true),
    getSubcategories(category.id),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {category.description}
          </p>
        )}
        <p className="mt-1 text-sm text-zinc-500">
          {productsResult.pagination.totalItems} productos
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
              activeSlug={slug}
              orientation="vertical"
            />

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Subcategorías
                </h4>
                <CategoryNav
                  categories={subcategories}
                  orientation="vertical"
                />
              </div>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <ProductGrid products={productsResult.data} columns={3} />

          {/* Pagination */}
          {productsResult.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: productsResult.pagination.totalPages }, (_, i) => (
                <a
                  key={i + 1}
                  href={`/category/${slug}?page=${i + 1}`}
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
