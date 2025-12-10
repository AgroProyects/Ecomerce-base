'use client'

import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

/**
 * Componente de estrellas de rating
 * - Muestra rating con estrellas llenas, medias y vacías
 * - Modo interactivo para seleccionar rating
 * - Diferentes tamaños
 */
export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const sizeClass = sizes[size]

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value)
    }
  }

  const stars = []

  for (let i = 1; i <= maxRating; i++) {
    const filled = rating >= i
    const half = rating >= i - 0.5 && rating < i

    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => handleClick(i)}
        disabled={!interactive}
        className={cn(
          'transition-all',
          interactive
            ? 'cursor-pointer hover:scale-110'
            : 'cursor-default pointer-events-none'
        )}
      >
        {filled ? (
          <Star
            className={cn(
              sizeClass,
              'fill-yellow-400 text-yellow-400 transition-colors'
            )}
          />
        ) : half ? (
          <StarHalf
            className={cn(
              sizeClass,
              'fill-yellow-400 text-yellow-400 transition-colors'
            )}
          />
        ) : (
          <Star
            className={cn(
              sizeClass,
              'fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600 transition-colors'
            )}
          />
        )}
      </button>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {stars}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
