'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  Calendar,
  Monitor,
  Layers,
  Layout,
  ExternalLink,
  Upload,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils/cn'
import { createBanner, updateBanner } from '@/actions/settings'
import type { Banner } from '@/types/database'

const bannerSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().optional(),
  image_url: z.string().url('URL de imagen inválida').min(1, 'La imagen es requerida'),
  link_url: z.string().url('URL inválida').optional().or(z.literal('')),
  position: z.enum(['hero', 'secondary', 'footer', 'popup']),
  is_active: z.boolean(),
  starts_at: z.string().optional().or(z.literal('')),
  ends_at: z.string().optional().or(z.literal('')),
  sort_order: z.number().int().min(0),
})

type BannerFormData = z.infer<typeof bannerSchema>

interface BannerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: Banner | null
  onSuccess: () => void
}

const positions = [
  { value: 'hero', label: 'Principal', icon: Monitor, description: 'Banner grande en la parte superior' },
  { value: 'secondary', label: 'Secundario', icon: Layers, description: 'Banner de tamaño medio' },
  { value: 'footer', label: 'Pie de página', icon: Layout, description: 'Banner en el footer' },
  { value: 'popup', label: 'Popup', icon: ExternalLink, description: 'Modal emergente' },
]

export function BannerFormDialog({ open, onOpenChange, banner, onSuccess }: BannerFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!banner

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '',
      subtitle: banner?.subtitle || '',
      image_url: banner?.image_url || '',
      link_url: banner?.link_url || '',
      position: (banner?.position as BannerFormData['position']) || 'hero',
      is_active: banner?.is_active ?? true,
      starts_at: banner?.starts_at ? banner.starts_at.split('T')[0] : '',
      ends_at: banner?.ends_at ? banner.ends_at.split('T')[0] : '',
      sort_order: banner?.sort_order || 0,
    },
  })

  const selectedPosition = watch('position')
  const imageUrl = watch('image_url')
  const isActive = watch('is_active')

  const onSubmit = async (data: BannerFormData) => {
    setIsLoading(true)

    try {
      const payload = {
        title: data.title,
        subtitle: data.subtitle || null,
        image_url: data.image_url,
        mobile_image_url: null,
        link_url: data.link_url || null,
        position: data.position,
        is_active: data.is_active,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
        sort_order: data.sort_order,
      }

      const result = isEditing
        ? await updateBanner(banner.id, payload)
        : await createBanner(payload)

      if (result.success) {
        toast.success(isEditing ? 'Banner actualizado' : 'Banner creado')
        reset()
        onSuccess()
      } else {
        toast.error(result.error || 'Error al guardar el banner')
      }
    } catch {
      toast.error('Error al guardar el banner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            {isEditing ? 'Editar banner' : 'Nuevo banner'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los detalles del banner'
              : 'Crea un nuevo banner para tu tienda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Preview */}
          <div className="space-y-2">
            <Label>Vista previa</Label>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = ''
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setValue('image_url', '')}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                  <Upload className="h-10 w-10 mb-2" />
                  <p className="text-sm">Ingresa una URL de imagen</p>
                </div>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image_url">URL de la imagen *</Label>
            <Input
              id="image_url"
              {...register('image_url')}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="h-11"
            />
            {errors.image_url && (
              <p className="text-xs text-red-500">{errors.image_url.message}</p>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Título del banner"
                className="h-11"
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                {...register('subtitle')}
                placeholder="Subtítulo opcional"
                className="h-11"
              />
            </div>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link_url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-zinc-400" />
              URL de destino
            </Label>
            <Input
              id="link_url"
              {...register('link_url')}
              placeholder="https://mitienda.com/productos"
              className="h-11"
            />
            {errors.link_url && (
              <p className="text-xs text-red-500">{errors.link_url.message}</p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-3">
            <Label>Posición</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {positions.map((pos) => {
                const Icon = pos.icon
                const isSelected = selectedPosition === pos.value
                return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setValue('position', pos.value as BannerFormData['position'])}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500 dark:border-violet-400 dark:bg-violet-900/20'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isSelected
                        ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn(
                        'font-medium',
                        isSelected ? 'text-violet-700 dark:text-violet-300' : ''
                      )}>
                        {pos.label}
                      </p>
                      <p className="text-xs text-zinc-500">{pos.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Fecha de inicio
              </Label>
              <Input
                id="starts_at"
                type="date"
                {...register('starts_at')}
                className="h-11"
              />
              <p className="text-xs text-zinc-500">Dejar vacío para mostrar inmediatamente</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Fecha de fin
              </Label>
              <Input
                id="ends_at"
                type="date"
                {...register('ends_at')}
                className="h-11"
              />
              <p className="text-xs text-zinc-500">Dejar vacío para mostrar indefinidamente</p>
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort_order">Orden de visualización</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              {...register('sort_order', { valueAsNumber: true })}
              className="h-11 w-32"
            />
            <p className="text-xs text-zinc-500">Menor número = mayor prioridad</p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div>
              <p className="font-medium">Estado del banner</p>
              <p className="text-sm text-zinc-500">
                {isActive ? 'El banner es visible en la tienda' : 'El banner está oculto'}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                'Guardar cambios'
              ) : (
                'Crear banner'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
