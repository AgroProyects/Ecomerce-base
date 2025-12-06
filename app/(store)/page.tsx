import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/components/store/product-grid'
import { CategoryNav } from '@/components/store/category-nav'
import { getFeaturedProducts, getNewArrivals } from '@/actions/products'
import { getCategories } from '@/actions/categories'
import { getHeroBanners, getStoreSettings } from '@/actions/settings'
import { ROUTES } from '@/lib/constants/routes'

export default async function HomePage() {
  const [featuredProducts, newArrivals, categories, banners, settings] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(8),
    getCategories(true),
    getHeroBanners(),
    getStoreSettings(),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-zinc-100 dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
              {settings?.store_name || 'Bienvenido a nuestra tienda'}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {settings?.description || 'Descubrí los mejores productos al mejor precio'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={ROUTES.PRODUCTS}>
                  Ver productos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Categorías
          </h2>
          <CategoryNav categories={categories} />
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Productos destacados
            </h2>
            <Link
              href={ROUTES.PRODUCTS}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Ver todos
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Nuevos productos
            </h2>
            <Link
              href={ROUTES.PRODUCTS}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Ver todos
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-zinc-900 dark:bg-zinc-800">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">
            ¿Tenés alguna pregunta?
          </h2>
          <p className="mt-4 text-zinc-300">
            Contactanos y te ayudamos a encontrar lo que buscás
          </p>
          {settings?.contact_email && (
            <Button variant="outline" size="lg" className="mt-8" asChild>
              <a href={`mailto:${settings.contact_email}`}>
                Contactar
              </a>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
