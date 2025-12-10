'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { ReviewCard } from './review-card'
import { ReviewForm } from './review-form'
import { RatingSummary } from './rating-summary'
import { getProductReviews, canUserReviewProduct } from '@/actions/reviews/queries'
import { Loader2, MessageSquare } from 'lucide-react'
import type { Review, ProductRating } from '@/schemas/review.schema'

interface ReviewsListProps {
  productId: string
  initialRating?: ProductRating
}

type SortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low'
type FilterRating = 'all' | '5' | '4' | '3' | '2' | '1'

export function ReviewsList({ productId, initialRating }: ReviewsListProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState<ProductRating | undefined>(initialRating)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [canReview, setCanReview] = useState(false)

  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterRating, setFilterRating] = useState<FilterRating>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const limit = 10

  useEffect(() => {
    loadReviews()
  }, [productId, sortBy, filterRating, page])

  useEffect(() => {
    if (user) {
      checkCanReview()
    }
  }, [user, productId])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const result = await getProductReviews({
        productId,
        sortBy,
        rating: filterRating !== 'all' ? parseInt(filterRating) : undefined,
        page,
        limit,
      })

      if (result.success && result.data) {
        setReviews(result.data.reviews)
        setRating(result.data.rating)
        setHasMore(result.data.hasMore)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCanReview = async () => {
    try {
      const result = await canUserReviewProduct(productId)
      setCanReview(result.success && result.data === true)
    } catch (error) {
      console.error('Error checking review permission:', error)
    }
  }

  const handleReviewSuccess = () => {
    setShowForm(false)
    setPage(1)
    loadReviews()
    checkCanReview()
  }

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    setPage(1)
  }

  const handleFilterChange = (value: FilterRating) => {
    setFilterRating(value)
    setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Rating summary */}
      {rating && <RatingSummary rating={rating} />}

      {/* Write review section */}
      {user && canReview && !showForm && (
        <div className="border rounded-lg p-6 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">¿Ya compraste este producto?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comparte tu experiencia con otros compradores
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>Escribir reseña</Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="font-semibold text-lg mb-4">Escribe tu reseña</h3>
          <ReviewForm
            productId={productId}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filters and sorting */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h3 className="font-semibold text-lg">
          Reseñas de clientes ({rating?.totalReviews || 0})
        </h3>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Filter by rating */}
          <select
            value={filterRating}
            onChange={(e) => handleFilterChange(e.target.value as FilterRating)}
            className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">Todas las estrellas</option>
            <option value="5">5 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="2">2 estrellas</option>
            <option value="1">1 estrella</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="recent">Más recientes</option>
            <option value="helpful">Más útiles</option>
            <option value="rating_high">Mayor calificación</option>
            <option value="rating_low">Menor calificación</option>
          </select>
        </div>
      </div>

      {/* Reviews list */}
      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No hay reseñas aún</h3>
          <p className="text-muted-foreground mb-4">
            Sé el primero en compartir tu opinión sobre este producto
          </p>
          {user && canReview && !showForm && (
            <Button onClick={() => setShowForm(true)}>Escribir primera reseña</Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onUpdate={loadReviews} />
            ))}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más reseñas'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
