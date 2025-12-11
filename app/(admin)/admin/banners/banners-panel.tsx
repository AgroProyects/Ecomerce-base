'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  GripVertical,
  Layout,
  Monitor,
  Layers,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils/cn'
import { deleteBanner, updateBanner } from '@/actions/settings'
import { BannerFormDialog } from './banner-form-dialog'
import type { Banner } from '@/types/database'

interface BannersPanelProps {
  initialBanners: Banner[]
}

const positionLabels: Record<string, { label: string; icon: typeof Layout; color: string }> = {
  hero: { label: 'Principal', icon: Monitor, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  secondary: { label: 'Secundario', icon: Layers, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  footer: { label: 'Pie de página', icon: Layout, color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' },
  popup: { label: 'Popup', icon: ExternalLink, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export function BannersPanel({ initialBanners }: BannersPanelProps) {
  const router = useRouter()
  const [banners, setBanners] = useState(initialBanners)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const activeBanners = banners.filter((b) => b.is_active)
  const inactiveBanners = banners.filter((b) => !b.is_active)

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingBanner(null)
    setIsFormOpen(true)
  }

  const handleToggleActive = async (banner: Banner) => {
    const result = await updateBanner(banner.id, { is_active: !banner.is_active })
    if (result.success) {
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      )
      toast.success(banner.is_active ? 'Banner desactivado' : 'Banner activado')
    } else {
      toast.error(result.error || 'Error al actualizar el banner')
    }
  }

  const handleDelete = async () => {
    if (!deletingBanner) return

    setIsDeleting(true)
    const result = await deleteBanner(deletingBanner.id)

    if (result.success) {
      setBanners((prev) => prev.filter((b) => b.id !== deletingBanner.id))
      toast.success('Banner eliminado')
    } else {
      toast.error(result.error || 'Error al eliminar el banner')
    }

    setIsDeleting(false)
    setDeletingBanner(null)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingBanner(null)
    router.refresh()
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const isExpired = (banner: Banner) => {
    if (!banner.ends_at) return false
    return new Date(banner.ends_at) < new Date()
  }

  const isScheduled = (banner: Banner) => {
    if (!banner.starts_at) return false
    return new Date(banner.starts_at) > new Date()
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            Banners
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {activeBanners.length} activos · {inactiveBanners.length} inactivos
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo banner
        </Button>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <ImageIcon className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No hay banners</h3>
            <p className="mt-1 text-center text-zinc-500">
              Crea tu primer banner para promocionar productos o anuncios
            </p>
            <Button onClick={handleCreate} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Crear banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => {
            const position = positionLabels[banner.position] || positionLabels.hero
            const PositionIcon = position.icon
            const expired = isExpired(banner)
            const scheduled = isScheduled(banner)

            return (
              <Card
                key={banner.id}
                className={cn(
                  'group overflow-hidden transition-all hover:shadow-lg',
                  !banner.is_active && 'opacity-60'
                )}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {banner.image_url ? (
                    <Image
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <Badge className={cn('text-xs', position.color)}>
                      <PositionIcon className="mr-1 h-3 w-3" />
                      {position.label}
                    </Badge>
                    {expired && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Expirado
                      </Badge>
                    )}
                    {scheduled && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="mr-1 h-3 w-3" />
                        Programado
                      </Badge>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="absolute right-3 top-3">
                    <Badge
                      variant={banner.is_active ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        banner.is_active
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-zinc-500'
                      )}
                    >
                      {banner.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 gap-2"
                      onClick={() => handleEdit(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 gap-2"
                      onClick={() => handleToggleActive(banner)}
                    >
                      {banner.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                        {banner.title || 'Sin título'}
                      </h3>
                      {banner.subtitle && (
                        <p className="mt-0.5 truncate text-sm text-zinc-500">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(banner)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(banner)}>
                          {banner.is_active ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeletingBanner(banner)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Meta info */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {banner.link_url && (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        Con enlace
                      </span>
                    )}
                    {(banner.starts_at || banner.ends_at) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {banner.starts_at && formatDate(banner.starts_at)}
                        {banner.starts_at && banner.ends_at && ' - '}
                        {banner.ends_at && formatDate(banner.ends_at)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <BannerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        banner={editingBanner}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBanner} onOpenChange={() => setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El banner &quot;{deletingBanner?.title || 'Sin título'}&quot; será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
