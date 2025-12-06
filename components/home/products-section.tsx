import { ProductGrid } from '@/components/store/product-grid'
import { SectionHeader } from './section-header'
import { ROUTES } from '@/lib/constants/routes'
import type { Product } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface ProductsSectionProps {
  title: string
  subtitle?: string
  products: Product[]
  href?: string
  linkText?: string
  className?: string
  background?: 'default' | 'muted'
}

export function ProductsSection({
  title,
  subtitle,
  products,
  href = ROUTES.PRODUCTS,
  linkText = 'Ver todos',
  className,
  background = 'default',
}: ProductsSectionProps) {
  if (products.length === 0) return null

  return (
    <section
      className={cn(
        'py-16',
        background === 'muted' && 'bg-zinc-50 dark:bg-zinc-900/50',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          href={href}
          linkText={linkText}
        />
        <ProductGrid products={products} />
      </div>
    </section>
  )
}
