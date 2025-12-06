import { cn } from '@/lib/utils/cn'
import { formatPrice, calculateDiscount } from '@/lib/utils/format'

interface PriceDisplayProps {
  price: number
  comparePrice?: number | null
  className?: string
  size?: 'sm' | 'default' | 'lg'
  showDiscount?: boolean
}

export function PriceDisplay({
  price,
  comparePrice,
  className,
  size = 'default',
  showDiscount = true,
}: PriceDisplayProps) {
  const hasDiscount = comparePrice && comparePrice > price
  const discount = hasDiscount ? calculateDiscount(price, comparePrice) : 0

  const sizeClasses = {
    sm: {
      price: 'text-base',
      compare: 'text-sm',
      discount: 'text-xs',
    },
    default: {
      price: 'text-xl',
      compare: 'text-base',
      discount: 'text-sm',
    },
    lg: {
      price: 'text-3xl',
      compare: 'text-xl',
      discount: 'text-base',
    },
  }

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span
        className={cn(
          'font-bold text-zinc-900 dark:text-zinc-50',
          sizeClasses[size].price
        )}
      >
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn(
              'text-zinc-500 line-through',
              sizeClasses[size].compare
            )}
          >
            {formatPrice(comparePrice)}
          </span>

          {showDiscount && (
            <span
              className={cn(
                'rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900 dark:text-red-100',
                sizeClasses[size].discount
              )}
            >
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  )
}
