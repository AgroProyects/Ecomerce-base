import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Folder } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    image_url?: string | null
  }
  className?: string
  variant?: 'default' | 'featured'
}

export function CategoryCard({
  category,
  className,
  variant = 'default',
}: CategoryCardProps) {
  return (
    <Link
      href={ROUTES.CATEGORY(category.slug)}
      className={cn(
        'group relative flex overflow-hidden rounded-xl transition-all',
        variant === 'default' && 'aspect-[4/3] bg-zinc-100 dark:bg-zinc-900',
        variant === 'featured' && 'aspect-[3/4] bg-zinc-900 dark:bg-zinc-100',
        'hover:shadow-xl',
        className
      )}
    >
      {/* Image */}
      {category.image_url ? (
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Folder className={cn(
            'h-16 w-16',
            variant === 'default' && 'text-zinc-300 dark:text-zinc-700',
            variant === 'featured' && 'text-zinc-700 dark:text-zinc-300'
          )} />
        </div>
      )}

      {/* Overlay */}
      <div className={cn(
        'absolute inset-0 transition-opacity',
        variant === 'default' && 'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
        variant === 'featured' && 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
      )} />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <h3 className={cn(
          'font-semibold text-white transition-transform group-hover:translate-y-0',
          variant === 'default' && 'text-lg',
          variant === 'featured' && 'text-xl sm:text-2xl'
        )}>
          {category.name}
        </h3>
        <div className="mt-2 flex items-center gap-1 text-sm text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
          <span>Ver productos</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
