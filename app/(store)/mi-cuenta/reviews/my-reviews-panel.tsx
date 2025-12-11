'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Edit, Trash2, Eye, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RatingStars } from '@/components/product/rating-stars'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { getUserReviews } from '@/actions/reviews/queries'
import { deleteReview } from '@/actions/reviews/mutations'
import { toast } from 'sonner'
import type { Review } from '@/schemas/review.schema'

interface MyReviewsPanelProps {
  userId: string
}

export function MyReviewsPanel({ userId }: MyReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadReviews()
  }, [userId])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const result = await getUserReviews(userId)

      if (result.success && result.data) {
        setReviews(result.data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Error al cargar tus reseñas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return

    try {
      const result = await deleteReview(reviewToDelete)

      if (result.success) {
        toast.success('Reseña eliminada')
        loadReviews()
      } else {
        toast.error(result.error || 'Error al eliminar reseña')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Error al eliminar reseña')
    } finally {
      setDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'bg-orange-100 text-orange-800',
      label: 'Pendiente de aprobación',
      description: 'Tu reseña está siendo revisada por nuestro equipo',
    },
    approved: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      label: 'Publicada',
      description: 'Tu reseña está visible para otros compradores',
    },
    rejected: {
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Rechazada',
      description: 'Tu reseña no cumple con nuestras políticas',
    },
    spam: {
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Marcada como spam',
      description: 'Tu reseña fue identificada como contenido inapropiado',
    },
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cargando tus reseñas...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Edit className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Aún no has dejado reseñas</h3>
          <p className="text-muted-foreground mb-6">
            Comparte tu experiencia con otros compradores dejando reseñas en los productos que has adquirido
          </p>
          <Button asChild>
            <Link href="/mi-cuenta/pedidos">Ver mis pedidos</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {reviews.map((review) => {
          const StatusIcon = statusConfig[review.status as keyof typeof statusConfig]?.icon
          const statusInfo = statusConfig[review.status as keyof typeof statusConfig]

          return (
            <Card key={review.id} className="p-6">
              <div className="space-y-4">
                {/* Header: Product and Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${review.product_slug}`}
                        className="font-semibold hover:underline flex items-center gap-2"
                      >
                        {review.product_name}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={statusInfo?.color}>
                        {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                        {statusInfo?.label}
                      </Badge>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Compra verificada
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {statusInfo?.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {review.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/products/${review.product_slug}#reviews`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver publicada
                        </Link>
                      </Button>
                    )}

                    {review.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="No puedes editar mientras esté en revisión"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(review.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {review.rating}/5 estrellas
                    </span>
                  </div>

                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}

                  {review.comment && (
                    <p className="text-muted-foreground">{review.comment}</p>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {review.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-md overflow-hidden border"
                        >
                          <OptimizedImage
                            src={image}
                            alt={`Imagen ${index + 1}`}
                            layout="gallery"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: Date and Stats */}
                <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                  <span>
                    Publicada {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
                  </span>

                  {review.status === 'approved' && review.helpful_count !== undefined && (
                    <span>
                      {review.helpful_count} {review.helpful_count === 1 ? 'persona encontró' : 'personas encontraron'} esto útil
                    </span>
                  )}
                </div>

                {/* Moderator Notes (if rejected or spam) */}
                {(review.status === 'rejected' || review.status === 'spam') && review.moderator_notes && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Nota del moderador:</p>
                    <p className="text-sm text-muted-foreground italic">
                      {review.moderator_notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu reseña será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
