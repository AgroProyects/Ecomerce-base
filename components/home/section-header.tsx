import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  href?: string
  linkText?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkText = 'Ver todos',
  align = 'left',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-2',
        align === 'center' && 'items-center text-center',
        align === 'left' && 'items-start sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group mt-2 flex items-center gap-1 text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300 sm:mt-0"
        >
          {linkText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
