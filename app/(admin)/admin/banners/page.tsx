import { Plus, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getBanners } from '@/actions/settings'

export default async function BannersPage() {
  const banners = await getBanners()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Banners
          </h1>
          <p className="text-zinc-500">{banners.length} banners activos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-lg font-medium">No hay banners</p>
            <p className="text-zinc-500">Crea un banner para promocionar tus productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="aspect-[3/1] bg-zinc-100 dark:bg-zinc-800">
                {banner.image_url && (
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Banner'}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{banner.title || 'Sin título'}</p>
                    <p className="text-sm text-zinc-500 capitalize">{banner.position}</p>
                  </div>
                  <Badge variant={banner.is_active ? 'success' : 'secondary'}>
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
