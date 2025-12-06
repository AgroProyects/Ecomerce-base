import { cn } from '@/lib/utils/cn'
import { type LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-center p-6 text-center transition-all',
        'rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg',
        'dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700',
        className
      )}
    >
      {/* Icon container */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-zinc-900 dark:bg-zinc-900 dark:group-hover:bg-zinc-100">
        <Icon className="h-6 w-6 text-zinc-600 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-900" />
      </div>

      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  )
}
