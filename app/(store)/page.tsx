import { getFeaturedProducts, getNewArrivals } from '@/actions/products'
import { getCategories } from '@/actions/categories'
import { getHeroBanners, getStoreSettings } from '@/actions/settings'
import {
  HeroSection,
  CategoriesGrid,
  FeaturesSection,
  ProductsSection,
  NewsletterSection,
  CTASection,
} from '@/components/home'

export default async function HomePage() {
  const [featuredProducts, newArrivals, categories, banners, settings] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(8),
    getCategories(true),
    getHeroBanners(),
    getStoreSettings(),
  ])

  // Obtener la primera imagen del banner si existe
  const heroBannerUrl = banners?.[0]?.image_url || null

  // Filtrar solo categorías padre para mostrar en el grid
  const parentCategories = categories.filter((c) => !c.parent_id)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection
        storeName={settings?.store_name}
        description={settings?.description}
        bannerUrl={heroBannerUrl}
      />

      {/* Features/Benefits */}
      <FeaturesSection />

      {/* Categories Grid */}
      <CategoriesGrid
        categories={parentCategories}
        title="Explorá por categoría"
        subtitle="Encontrá exactamente lo que buscás navegando nuestras categorías"
      />

      {/* Featured Products */}
      <ProductsSection
        title="Productos destacados"
        subtitle="Nuestra selección de los mejores productos para vos"
        products={featuredProducts}
      />

      {/* New Arrivals */}
      <ProductsSection
        title="Recién llegados"
        subtitle="Los últimos productos que agregamos a nuestro catálogo"
        products={newArrivals}
        background="muted"
      />

      {/* Newsletter */}
      <NewsletterSection />

      {/* CTA Section */}
      <CTASection
        contactEmail={settings?.contact_email}
        contactPhone={settings?.contact_phone}
      />
    </div>
  )
}
