'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createReview } from '@/actions/reviews/mutations'
import { createReviewSchema, type CreateReviewInput } from '@/schemas/review.schema'
import { toast } from 'sonner'
import { uploadFile } from '@/lib/storage/upload'
import { compressImage, validateImageFile } from '@/lib/image-utils'

interface ReviewFormProps {
  productId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      productId,
      rating: 0,
      title: '',
      comment: '',
      images: [],
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (images.length + files.length > 5) {
      toast.error('Máximo 5 imágenes permitidas')
      return
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        // Validar archivo
        const validation = validateImageFile(file, 5)
        if (!validation.valid) {
          toast.error(validation.error || 'Archivo inválido')
          continue
        }

        // Comprimir imagen
        const compressed = await compressImage(file, 1200, 0.85)
        const compressedFile = new File([compressed], file.name, {
          type: compressed.type,
        })

        // Upload a Supabase
        const result = await uploadFile({
          bucket: 'reviews',
          file: compressedFile,
        })
        if (result.success && result.publicUrl) {
          uploadedUrls.push(result.publicUrl)
        } else {
          toast.error(result.error || 'Error al subir imagen')
        }
      }

      setImages((prev) => [...prev, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} imagen(es) subida(s)`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error al procesar imágenes')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreateReviewInput) => {
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación')
      return
    }

    try {
      const result = await createReview({
        ...data,
        rating,
        images,
      })

      if (result.success) {
        toast.success(
          result.data?.status === 'approved'
            ? 'Reseña publicada exitosamente'
            : 'Reseña enviada. Será revisada antes de publicarse.'
        )
        reset()
        setRating(0)
        setImages([])
        onSuccess?.()
      } else {
        toast.error(result.error || 'Error al enviar reseña')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Error al enviar reseña')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Rating selector */}
      <div className="space-y-2">
        <Label>Calificación *</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Malo'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bueno'}
              {rating === 5 && 'Excelente'}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Resume tu experiencia en pocas palabras"
          maxLength={255}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Comentario (opcional)</Label>
        <Textarea
          id="comment"
          {...register('comment')}
          placeholder="Cuéntanos más sobre tu experiencia con este producto..."
          rows={5}
          maxLength={2000}
        />
        {errors.comment && (
          <p className="text-sm text-destructive">{errors.comment.message}</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Imágenes (opcional - máx. 5)</Label>

        {/* Image preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {images.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {images.length < 5 && (
          <div className="flex items-center gap-2">
            <Input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('images')?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir imágenes ({images.length}/5)
                </>
              )}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Formatos: JPG, PNG, WebP. Máximo 5MB por imagen.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Publicar reseña'
          )}
        </Button>
      </div>
    </form>
  )
}
