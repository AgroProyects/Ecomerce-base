'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  Star,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  Sparkles,
  Filter,
  SortAsc,
  User,
  Package,
  ImageIcon,
  ChevronDown,
  Search,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RatingStars } from '@/components/product/rating-stars'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { getPendingReviews } from '@/actions/reviews/queries'
import { moderateReview } from '@/actions/reviews/mutations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { Review } from '@/schemas/review.schema'

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'spam'
type SortBy = 'recent' | 'rating_high' | 'rating_low' | 'reports'

const statusTabs = [
  { value: 'pending', label: 'Pendientes', icon: Clock, color: 'text-amber-500' },
  { value: 'approved', label: 'Aprobadas', icon: CheckCircle, color: 'text-emerald-500' },
  { value: 'rejected', label: 'Rechazadas', icon: XCircle, color: 'text-red-500' },
  { value: 'spam', label: 'Spam', icon: AlertTriangle, color: 'text-yellow-500' },
]

export function ReviewsModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

  const loadReviews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

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
      setRefreshing(false)
    }
  }

  const handleModerate = async (reviewId: string, action: 'approve' | 'reject' | 'spam') => {
    try {
      const newStatus: ReviewStatus =
        action === 'approve' ? 'approved' :
        action === 'reject' ? 'rejected' : 'spam'

      const result = await moderateReview({
        id: reviewId,
        status: newStatus,
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

  const totalReviews = stats.pending + stats.approved + stats.rejected + stats.spam

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            Moderación de Reseñas
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {totalReviews} reseñas en total · {stats.pending} pendientes de revisión
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadReviews(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pendientes</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.pending}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Aprobadas</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.approved}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Rechazadas</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.rejected}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Spam</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.spam}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-yellow-500 to-amber-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm col-span-2 lg:col-span-1">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Flag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Reportadas</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.reported}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = status === tab.value
                const count = stats[tab.value as keyof typeof stats]

                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatus(tab.value as ReviewStatus)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "" : tab.color)} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 text-xs",
                        isActive
                          ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    >
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <SortAsc className="h-4 w-4 text-zinc-400" />
              <SelectRoot value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="rating_high">Mayor calificación</SelectItem>
                  <SelectItem value="rating_low">Menor calificación</SelectItem>
                  <SelectItem value="reports">Más reportadas</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
              <p className="mt-4 text-zinc-500">Cargando reseñas...</p>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <MessageSquare className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                No hay reseñas {status === 'pending' ? 'pendientes' : status === 'approved' ? 'aprobadas' : status === 'rejected' ? 'rechazadas' : 'de spam'}
              </h3>
              <p className="mt-1 text-center text-zinc-500">
                Las reseñas aparecerán aquí cuando haya contenido para revisar
              </p>
            </CardContent>
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
  const [moderating, setModerating] = useState<string | null>(null)

  const handleAction = async (action: 'approve' | 'reject' | 'spam') => {
    setModerating(action)
    await onModerate(review.id, action)
    setModerating(null)
  }

  const statusConfig = {
    pending: {
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      icon: Clock,
      label: 'Pendiente'
    },
    approved: {
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: CheckCircle,
      label: 'Aprobada'
    },
    rejected: {
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
      label: 'Rechazada'
    },
    spam: {
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: AlertTriangle,
      label: 'Spam'
    },
  }

  const currentStatus = statusConfig[review.status as ReviewStatus]
  const StatusIcon = currentStatus?.icon || Clock

  // Generate initials from user name
  const initials = (review.user_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        {/* Top colored bar based on status */}
        <div className={cn(
          "h-1",
          review.status === 'pending' && "bg-gradient-to-r from-amber-500 to-orange-500",
          review.status === 'approved' && "bg-gradient-to-r from-emerald-500 to-green-500",
          review.status === 'rejected' && "bg-gradient-to-r from-red-500 to-rose-500",
          review.status === 'spam' && "bg-gradient-to-r from-yellow-500 to-amber-500"
        )} />

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* User Avatar */}
            <div className="hidden lg:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
              <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                {initials}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  {/* User Info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex lg:hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        {initials}
                      </span>
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {review.user_name || 'Usuario Anónimo'}
                    </h3>
                    <Badge className={cn("text-xs gap-1", currentStatus?.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {currentStatus?.label}
                    </Badge>
                    {review.is_verified_purchase && (
                      <Badge variant="secondary" className="gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span className="hidden sm:inline">Compra verificada</span>
                        <span className="sm:hidden">Verificada</span>
                      </Badge>
                    )}
                    {review.report_count && review.report_count > 0 && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <Flag className="h-3 w-3" />
                        {review.report_count} {review.report_count === 1 ? 'reporte' : 'reportes'}
                      </Badge>
                    )}
                  </div>

                  {/* Product & Time */}
                  <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
                    <Package className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{review.product_name}</span>
                    <span>·</span>
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} size="sm" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {review.rating}/5
                    </span>
                  </div>
                </div>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="gap-2 shrink-0"
                >
                  {expanded ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver más</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Review Content */}
              <div className="space-y-2">
                {review.title && (
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    &ldquo;{review.title}&rdquo;
                  </h4>
                )}
                {review.comment && (
                  <p className={cn(
                    "text-zinc-600 dark:text-zinc-400 leading-relaxed",
                    !expanded && "line-clamp-2"
                  )}>
                    {review.comment}
                  </p>
                )}
              </div>

              {/* Images */}
              {expanded && review.images && review.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <ImageIcon className="h-4 w-4" />
                    <span>{review.images.length} {review.images.length === 1 ? 'imagen' : 'imágenes'} adjuntas</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {review.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group"
                      >
                        <OptimizedImage
                          src={image}
                          alt={`Review image ${index + 1}`}
                          layout="gallery"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions for pending reviews */}
              {review.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={moderating !== null}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                  >
                    {moderating === 'approve' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={moderating !== null}
                    className="gap-2"
                    size="sm"
                  >
                    {moderating === 'reject' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Rechazar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('spam')}
                    disabled={moderating !== null}
                    className="gap-2"
                    size="sm"
                  >
                    {moderating === 'spam' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    Marcar Spam
                  </Button>
                </div>
              )}

              {/* Info for non-pending reviews */}
              {review.status !== 'pending' && review.moderated_at && (
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    Moderado {formatDistanceToNow(new Date(review.moderated_at), { addSuffix: true, locale: es })}
                  </span>
                  {review.moderator_notes && (
                    <>
                      <span>·</span>
                      <span className="italic">&ldquo;{review.moderator_notes}&rdquo;</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
