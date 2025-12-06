import { CategoryCard } from './category-card'
import { SectionHeader } from './section-header'
import { ROUTES } from '@/lib/constants/routes'

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

interface CategoriesGridProps {
  categories: Category[]
  title?: string
  subtitle?: string
}

export function CategoriesGrid({
  categories,
  title = 'Categorías',
  subtitle = 'Explorá nuestra selección de productos organizados para vos',
}: CategoriesGridProps) {
  if (categories.length === 0) return null

  // Layout: first category featured (large), rest smaller
  const [featured, ...rest] = categories.slice(0, 5)

  return (
    <section className="container mx-auto px-4 py-16">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        href={ROUTES.PRODUCTS}
        linkText="Ver todas"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Featured category - spans 2 columns on larger screens */}
        {featured && (
          <div className="sm:col-span-2 sm:row-span-2">
            <CategoryCard category={featured} variant="featured" className="h-full" />
          </div>
        )}

        {/* Smaller categories */}
        {rest.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}
