'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, XCircle, AlertTriangle, Flag, MessageSquare, Star, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RatingStars } from '@/components/product/rating-stars'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { getPendingReviews } from '@/actions/reviews/queries'
import { moderateReview } from '@/actions/reviews/mutations'
import { toast } from 'sonner'
import type { Review } from '@/schemas/review.schema'

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'spam'
type SortBy = 'recent' | 'rating_high' | 'rating_low' | 'reports'

export function ReviewsModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ReviewStatus>('pending')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
    reported: 0,
  })

  useEffect(() => {
    loadReviews()
  }, [status, sortBy])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const result = await getPendingReviews({ status, sortBy })

      if (result.success && result.data) {
        setReviews(result.data.reviews)
        if (result.data.stats) {
          setStats(result.data.stats)
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Error al cargar reseñas')
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (reviewId: string, action: 'approve' | 'reject' | 'spam') => {
    try {
      const newStatus: ReviewStatus =
        action === 'approve' ? 'approved' :
        action === 'reject' ? 'rejected' : 'spam'

      const result = await moderateReview({
        reviewId,
        status: newStatus,
        moderatorNotes: undefined,
      })

      if (result.success) {
        toast.success(
          action === 'approve' ? 'Reseña aprobada' :
          action === 'reject' ? 'Reseña rechazada' : 'Reseña marcada como spam'
        )
        loadReviews()
      } else {
        toast.error(result.error || 'Error al moderar reseña')
      }
    } catch (error) {
      console.error('Error moderating review:', error)
      toast.error('Error al moderar reseña')
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendientes</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Aprobadas</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Rechazadas</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Spam</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.spam}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Reportadas</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.reported}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
        <Tabs value={status} onValueChange={(v) => setStatus(v as ReviewStatus)} className="w-full sm:w-auto overflow-x-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="pending" className="text-xs sm:text-sm whitespace-nowrap">
              Pendientes ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm whitespace-nowrap">
              Aprobadas ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm whitespace-nowrap">
              Rechazadas ({stats.rejected})
            </TabsTrigger>
            <TabsTrigger value="spam" className="text-xs sm:text-sm whitespace-nowrap">
              Spam ({stats.spam})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="h-10 w-full sm:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="recent">Más recientes</option>
          <option value="rating_high">Mayor calificación</option>
          <option value="rating_low">Menor calificación</option>
          <option value="reports">Más reportadas</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No hay reseñas</h3>
              <p className="text-muted-foreground">
                No hay reseñas {status === 'pending' ? 'pendientes' : status} en este momento
              </p>
            </div>
          </Card>
        ) : (
          reviews.map((review) => (
            <ReviewModerationCard
              key={review.id}
              review={review}
              onModerate={handleModerate}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ReviewModerationCardProps {
  review: Review
  onModerate: (reviewId: string, action: 'approve' | 'reject' | 'spam') => void
}

function ReviewModerationCard({ review, onModerate }: ReviewModerationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusConfig = {
    pending: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Pendiente' },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Aprobada' },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rechazada' },
    spam: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Spam' },
  }

  return (
    <Card className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 space-y-2 w-full min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {review.user_name || 'Usuario Anónimo'}
              </h3>
              <Badge className={statusConfig[review.status as ReviewStatus]?.color}>
                {statusConfig[review.status as ReviewStatus]?.label}
              </Badge>
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Compra verificada</span>
                  <span className="sm:hidden">Verificada</span>
                </Badge>
              )}
              {review.report_count && review.report_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Flag className="h-3 w-3 mr-1" />
                  {review.report_count}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span className="truncate">{review.product_name}</span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}</span>
            </div>

            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} size="sm" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({review.rating}/5)
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-xs sm:text-sm w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            {expanded ? 'Ocultar' : 'Ver'}
          </Button>
        </div>

        {/* Content Preview/Full */}
        <div className="space-y-2">
          {review.title && (
            <h4 className="font-semibold">{review.title}</h4>
          )}
          {review.comment && (
            <p className={`text-muted-foreground ${!expanded && 'line-clamp-2'}`}>
              {review.comment}
            </p>
          )}
        </div>

        {/* Images */}
        {expanded && review.images && review.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {review.images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                <OptimizedImage
                  src={image}
                  alt={`Review image ${index + 1}`}
                  layout="gallery"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {review.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              onClick={() => onModerate(review.id, 'approve')}
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Aprobar</span>
              <span className="sm:hidden">✓ Aprobar</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => onModerate(review.id, 'reject')}
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rechazar</span>
              <span className="sm:hidden">✗ Rechazar</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onModerate(review.id, 'spam')}
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Marcar como Spam</span>
              <span className="sm:hidden">⚠ Spam</span>
            </Button>
          </div>
        )}

        {/* Info for non-pending reviews */}
        {review.status !== 'pending' && review.moderated_at && (
          <div className="text-sm text-muted-foreground pt-4 border-t">
            Moderado {formatDistanceToNow(new Date(review.moderated_at), { addSuffix: true, locale: es })}
            {review.moderator_notes && (
              <p className="mt-1 italic">Nota: {review.moderator_notes}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
