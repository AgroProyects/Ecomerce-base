import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'
import type { Category } from '@/types/database'

interface CategoryNavProps {
  categories: Category[]
  activeSlug?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function CategoryNav({
  categories,
  activeSlug,
  className,
  orientation = 'horizontal',
}: CategoryNavProps) {
  // Filtrar solo categorías padre
  const parentCategories = categories.filter((cat) => !cat.parent_id)

  return (
    <nav
      className={cn(
        orientation === 'horizontal'
          ? 'flex flex-wrap gap-2'
          : 'flex flex-col gap-1',
        className
      )}
    >
      <Link
        href={ROUTES.PRODUCTS}
        className={cn(
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          !activeSlug
            ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
        )}
      >
        Todos
      </Link>

      {parentCategories.map((category) => {
        const isActive = activeSlug === category.slug
        const subcategories = categories.filter(
          (cat) => cat.parent_id === category.id
        )

        return (
          <div key={category.id} className="relative">
            <Link
              href={ROUTES.CATEGORY(category.slug)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              )}
            >
              {category.name}
            </Link>

            {/* Subcategorías */}
            {orientation === 'vertical' && subcategories.length > 0 && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                {subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={ROUTES.CATEGORY(sub.slug)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      activeSlug === sub.slug
                        ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    )}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
