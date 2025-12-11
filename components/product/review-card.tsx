'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ThumbsUp, Flag, BadgeCheck } from 'lucide-react'
import { RatingStars } from './rating-stars'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { voteHelpful, reportReview } from '@/actions/reviews/mutations'
import { toast } from 'sonner'
import type { Review } from '@/schemas/review.schema'

interface ReviewCardProps {
  review: Review
  onUpdate?: () => void
}

export function ReviewCard({ review, onUpdate }: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0)

  const handleVoteHelpful = async () => {
    if (hasVoted || isVoting) return

    setIsVoting(true)
    try {
      const result = await voteHelpful({ reviewId: review.id })

      if (result.success) {
        setHasVoted(true)
        setHelpfulCount((prev) => prev + 1)
        toast.success('Gracias por tu voto')
      } else {
        toast.error(result.error || 'No se pudo registrar tu voto')
      }
    } catch (error) {
      toast.error('Error al votar')
    } finally {
      setIsVoting(false)
    }
  }

  const handleReport = async () => {
    if (isReporting) return

    const details = prompt('¿Por qué deseas reportar esta reseña?')
    if (!details?.trim()) return

    setIsReporting(true)
    try {
      const result = await reportReview({ reviewId: review.id, reason: 'other', details })

      if (result.success) {
        toast.success('Reseña reportada. La revisaremos pronto.')
      } else {
        toast.error(result.error || 'No se pudo reportar la reseña')
      }
    } catch (error) {
      toast.error('Error al reportar')
    } finally {
      setIsReporting(false)
    }
  }

  const getUserInitials = () => {
    if (!review.user_name) return '?'
    const names = review.user_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return review.user_name.substring(0, 2).toUpperCase()
  }

  const formattedDate = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div className="border-2 rounded-xl p-6 space-y-5 bg-card shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
      {/* Header: User info and rating */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-12 w-12 ring-2 ring-blue-100 dark:ring-blue-900">
            <AvatarImage src={review.user_avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-lg">{review.user_name || 'Usuario'}</p>
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="gap-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Compra verificada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <RatingStars rating={review.rating} size="md" />
        </div>
      </div>

      {/* Review content */}
      <div className="space-y-3">
        {review.title && (
          <h4 className="font-bold text-xl text-gray-900 dark:text-gray-100">{review.title}</h4>
        )}
        {review.comment && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
            {review.comment}
          </p>
        )}
      </div>

      {/* Review images */}
      {review.images && review.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {review.images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 ring-1 ring-gray-200 dark:ring-gray-700">
              <OptimizedImage
                src={image}
                alt={`Imagen de reseña ${index + 1}`}
                layout="gallery"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t-2 border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVoteHelpful}
          disabled={isVoting || hasVoted}
          className={`gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 ${hasVoted ? 'text-blue-600 dark:text-blue-400' : ''}`}
        >
          <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
          <span className="font-medium">Útil ({helpfulCount})</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={isReporting}
          className="gap-2 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
        >
          <Flag className="h-4 w-4" />
          <span className="font-medium">Reportar</span>
        </Button>
      </div>
    </div>
  )
}
