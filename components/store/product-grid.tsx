import { cn } from '@/lib/utils/cn'
import { ProductCard } from './product-card'
import type { Product } from '@/types/database'

interface ProductGridProps {
  products: Product[]
  className?: string
  columns?: 2 | 3 | 4
}

export function ProductGrid({
  products,
  className,
  columns = 4,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          No se encontraron productos
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
