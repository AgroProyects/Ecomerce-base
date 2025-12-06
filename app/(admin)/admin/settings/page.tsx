import { getStoreSettings } from '@/actions/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default async function SettingsPage() {
  const settings = await getStoreSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Configuración
        </h1>
        <p className="text-zinc-500">Configuración general de tu tienda</p>
      </div>

      <div className="grid gap-6">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
            <CardDescription>
              Nombre y descripción de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre de la tienda"
              defaultValue={settings?.store_name || ''}
            />
            <Input
              label="Slug"
              defaultValue={settings?.store_slug || ''}
            />
            <Textarea
              label="Descripción"
              defaultValue={settings?.description || ''}
            />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
            <CardDescription>
              Información de contacto de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email de contacto"
                type="email"
                defaultValue={settings?.contact_email || ''}
              />
              <Input
                label="Teléfono"
                defaultValue={settings?.contact_phone || ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Colores</CardTitle>
            <CardDescription>
              Personaliza los colores de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Color primario
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    defaultValue={settings?.primary_color || '#000000'}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input defaultValue={settings?.primary_color || '#000000'} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Color secundario
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    defaultValue={settings?.secondary_color || '#ffffff'}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input defaultValue={settings?.secondary_color || '#ffffff'} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Color de acento
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    defaultValue={settings?.accent_color || '#3b82f6'}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input defaultValue={settings?.accent_color || '#3b82f6'} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg">Guardar cambios</Button>
        </div>
      </div>
    </div>
  )
}
