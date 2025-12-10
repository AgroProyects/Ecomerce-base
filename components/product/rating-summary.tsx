'use client'

import { RatingStars } from './rating-stars'
import { Progress } from '@/components/ui/progress'
import type { ProductRating } from '@/schemas/review.schema'

interface RatingSummaryProps {
  rating: ProductRating
  onFilterByRating?: (rating: number | null) => void
}

/**
 * Resumen de ratings con distribución de estrellas
 */
export function RatingSummary({ rating, onFilterByRating }: RatingSummaryProps) {
  const { average_rating, total_reviews, rating_distribution } = rating

  const distribution = [
    { stars: 5, count: rating_distribution['5'] },
    { stars: 4, count: rating_distribution['4'] },
    { stars: 3, count: rating_distribution['3'] },
    { stars: 2, count: rating_distribution['2'] },
    { stars: 1, count: rating_distribution['1'] },
  ]

  const getPercentage = (count: number) => {
    if (total_reviews === 0) return 0
    return (count / total_reviews) * 100
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-lg">
      {/* Rating Promedio */}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {average_rating.toFixed(1)}
          </div>
          <div className="mt-2 flex justify-center">
            <RatingStars rating={average_rating} size="lg" />
          </div>
          <div className="mt-3 text-base font-medium text-gray-700 dark:text-gray-300">
            {total_reviews} {total_reviews === 1 ? 'reseña' : 'reseñas'}
          </div>
        </div>
      </div>

      {/* Distribución de Estrellas */}
      <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-lg">
        {distribution.map(({ stars, count }) => (
          <div
            key={stars}
            onClick={() => onFilterByRating?.(stars)}
            className="flex w-full items-center gap-3 text-sm transition-all hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer p-2 rounded-md group"
          >
            <span className="w-8 text-right font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {stars}
            </span>
            <RatingStars rating={stars} size="sm" />
            <div className="flex-1">
              <Progress value={getPercentage(count)} className="h-2.5 bg-gray-200 dark:bg-gray-700" />
            </div>
            <span className="w-14 text-right font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Botón para ver todos */}
      {onFilterByRating && (
        <button
          type="button"
          onClick={() => onFilterByRating(null)}
          className="w-full mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          Ver todas las reseñas
        </button>
      )}
    </div>
  )
}
