import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductGallery } from './product-gallery'
import { ProductInfo } from './product-info'
import { ProductGrid } from '@/components/store/product-grid'
import { ReviewsList } from '@/components/product/reviews-list'
import { getProductBySlug, getProductVariants, getRelatedProducts } from '@/actions/products'
import { getProductRating } from '@/actions/reviews/queries'
import { formatPrice } from '@/lib/utils/format'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.description || undefined,
    openGraph: {
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const [variants, relatedProducts, ratingResult] = await Promise.all([
    getProductVariants(product.id),
    getRelatedProducts(product.id, product.category_id, 4),
    getProductRating(product.id),
  ])

  const initialRating = ratingResult.success ? ratingResult.data : undefined

  // JSON-LD structured data para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images[0] || undefined,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'UYU',
      availability: product.track_inventory && product.stock <= 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      ...(product.compare_price && product.compare_price > product.price && {
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
    },
    ...(initialRating && initialRating.total_reviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: initialRating.average_rating,
        reviewCount: initialRating.total_reviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Info */}
        <ProductInfo product={product} variants={variants} />
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Descripción
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-16">
        <ReviewsList productId={product.id} initialRating={initialRating} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Productos relacionados
          </h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </div>
      )}
      </div>
    </>
  )
}
