'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Store,
  Mail,
  Phone,
  Palette,
  Globe,
  MapPin,
  Truck,
  Search,
  Home,
  Share2,
  Save,
  Loader2,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  MessageCircle,
  Image,
  Settings2,
  DollarSign,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  updateStoreSettingsSchema,
  type UpdateStoreSettingsInput,
  type SocialLinks,
  type StoreAddress,
  type HomepageConfig,
  type SeoConfig,
  type ShippingConfig,
} from '@/schemas/settings.schema'
import { updateStoreSettings } from '@/actions/settings'
import type { StoreSettings } from '@/types/database'

interface SettingsFormProps {
  settings: StoreSettings | null
}

// Helper para parsear JSON de forma segura
function parseJsonField<T>(field: unknown, defaultValue: T): T {
  if (!field) return defaultValue
  if (typeof field === 'object' && field !== null) {
    return field as T
  }
  return defaultValue
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Parsear los campos JSON de settings
  const socialLinks = parseJsonField<SocialLinks>(settings?.social_links, {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
  })

  const address = parseJsonField<StoreAddress>(settings?.address, {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Argentina',
  })

  const homepageConfigDefault = parseJsonField<HomepageConfig>(settings?.homepage_config, {
    showHeroBanner: true,
    showFeaturedProducts: true,
    showCategories: true,
    showNewArrivals: true,
    featuredProductsLimit: 8,
    newArrivalsLimit: 8,
  })

  const seoConfig = parseJsonField<SeoConfig>(settings?.seo_config, {
    title: '',
    description: '',
    keywords: [],
    ogImage: '',
  })

  const shippingConfigDefault = parseJsonField<ShippingConfig>(settings?.shipping_config, {
    freeShippingThreshold: null,
    flatRate: 0,
    enableLocalPickup: false,
    localPickupAddress: '',
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateStoreSettingsInput>({
    defaultValues: {
      id: settings?.id || '',
      store_name: settings?.store_name || '',
      store_slug: settings?.store_slug || '',
      description: settings?.description || '',
      logo_url: settings?.logo_url || '',
      favicon_url: settings?.favicon_url || '',
      primary_color: settings?.primary_color || '#000000',
      secondary_color: settings?.secondary_color || '#ffffff',
      accent_color: settings?.accent_color || '#3b82f6',
      contact_email: settings?.contact_email || '',
      contact_phone: settings?.contact_phone || '',
      currency: settings?.currency || 'ARS',
      currency_symbol: settings?.currency_symbol || '$',
      timezone: settings?.timezone || 'America/Argentina/Buenos_Aires',
      social_links: socialLinks,
      address: address,
      homepage_config: homepageConfigDefault,
      seo_config: seoConfig,
      shipping_config: shippingConfigDefault,
    },
  })

  const primaryColor = watch('primary_color')
  const secondaryColor = watch('secondary_color')
  const accentColor = watch('accent_color')

  const homepageConfig = watch('homepage_config')
  const shippingConfig = watch('shipping_config')

  const onSubmit = async (data: UpdateStoreSettingsInput) => {
    setIsLoading(true)
    try {
      const result = await updateStoreSettings(data)
      if (result.success) {
        toast.success('Configuración guardada correctamente')
      } else {
        toast.error(result.error || 'Error al guardar la configuración')
      }
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  if (!settings?.id) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Settings2 className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Configuración no disponible</h3>
          <p className="text-zinc-500">
            No se encontró la configuración de la tienda. Contacta al administrador.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('id')} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Contacto</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Redes</span>
          </TabsTrigger>
          <TabsTrigger
            value="homepage"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </TabsTrigger>
          <TabsTrigger
            value="shipping"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2"
          >
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Envío</span>
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Información de la tienda
              </CardTitle>
              <CardDescription>
                Información básica de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nombre de la tienda *</Label>
                  <Input
                    id="store_name"
                    {...register('store_name')}
                    placeholder="Mi Tienda"
                  />
                  {errors.store_name && (
                    <p className="text-xs text-red-500">{errors.store_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_slug">Slug (URL)</Label>
                  <Input
                    id="store_slug"
                    {...register('store_slug')}
                    placeholder="mi-tienda"
                  />
                  {errors.store_slug && (
                    <p className="text-xs text-red-500">{errors.store_slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe tu tienda..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    {...register('currency')}
                    placeholder="ARS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency_symbol">Símbolo</Label>
                  <Input
                    id="currency_symbol"
                    {...register('currency_symbol')}
                    placeholder="$"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Input
                    id="timezone"
                    {...register('timezone')}
                    placeholder="America/Argentina/Buenos_Aires"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Imágenes
              </CardTitle>
              <CardDescription>
                Logo y favicon de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    {...register('logo_url')}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">URL del Favicon</Label>
                  <Input
                    id="favicon_url"
                    {...register('favicon_url')}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO
              </CardTitle>
              <CardDescription>
                Optimización para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  {...register('seo_config.title')}
                  placeholder="Mi Tienda - Los mejores productos"
                  maxLength={70}
                />
                <p className="text-xs text-zinc-500">Máximo 70 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">Descripción SEO</Label>
                <Textarea
                  id="seo_description"
                  {...register('seo_config.description')}
                  placeholder="Descripción para motores de búsqueda..."
                  rows={2}
                  maxLength={160}
                />
                <p className="text-xs text-zinc-500">Máximo 160 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="og_image">Imagen para compartir (OG Image)</Label>
                <Input
                  id="og_image"
                  {...register('seo_config.ogImage')}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacto */}
        <TabsContent value="contact" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información de contacto
              </CardTitle>
              <CardDescription>
                Cómo pueden contactarte tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contacto</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    placeholder="contacto@mitienda.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Teléfono</Label>
                  <Input
                    id="contact_phone"
                    {...register('contact_phone')}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección
              </CardTitle>
              <CardDescription>
                Ubicación física de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_street">Calle y número</Label>
                <Input
                  id="address_street"
                  {...register('address.street')}
                  placeholder="Av. Corrientes 1234"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Ciudad</Label>
                  <Input
                    id="address_city"
                    {...register('address.city')}
                    placeholder="Buenos Aires"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Provincia</Label>
                  <Input
                    id="address_state"
                    {...register('address.state')}
                    placeholder="CABA"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address_zipCode">Código postal</Label>
                  <Input
                    id="address_zipCode"
                    {...register('address.zipCode')}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_country">País</Label>
                  <Input
                    id="address_country"
                    {...register('address.country')}
                    placeholder="Argentina"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colores
              </CardTitle>
              <CardDescription>
                Personaliza los colores de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-3">
                  <Label>Color primario</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border-2 border-zinc-200 shadow-sm cursor-pointer overflow-hidden"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <input
                        type="color"
                        {...register('primary_color')}
                        className="h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <Input
                      {...register('primary_color')}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Color secundario</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border-2 border-zinc-200 shadow-sm cursor-pointer overflow-hidden"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <input
                        type="color"
                        {...register('secondary_color')}
                        className="h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <Input
                      {...register('secondary_color')}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Color de acento</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border-2 border-zinc-200 shadow-sm cursor-pointer overflow-hidden"
                      style={{ backgroundColor: accentColor }}
                    >
                      <input
                        type="color"
                        {...register('accent_color')}
                        className="h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <Input
                      {...register('accent_color')}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Vista previa</Label>
                <div className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Botón primario
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md text-sm font-medium border-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      Botón outline
                    </button>
                    <span
                      className="px-3 py-1 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: accentColor }}
                    >
                      Badge de acento
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redes sociales */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Redes sociales
              </CardTitle>
              <CardDescription>
                Enlaces a tus perfiles de redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </Label>
                  <Input
                    {...register('social_links.facebook')}
                    placeholder="https://facebook.com/mitienda"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </Label>
                  <Input
                    {...register('social_links.instagram')}
                    placeholder="https://instagram.com/mitienda"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter / X
                  </Label>
                  <Input
                    {...register('social_links.twitter')}
                    placeholder="https://twitter.com/mitienda"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600" />
                    YouTube
                  </Label>
                  <Input
                    {...register('social_links.youtube')}
                    placeholder="https://youtube.com/@mitienda"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </Label>
                  <Input
                    {...register('social_links.tiktok')}
                    placeholder="https://tiktok.com/@mitienda"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    WhatsApp
                  </Label>
                  <Input
                    {...register('social_links.whatsapp')}
                    placeholder="+5491112345678"
                  />
                  <p className="text-xs text-zinc-500">Número con código de país, sin espacios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage */}
        <TabsContent value="homepage" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Configuración de inicio
              </CardTitle>
              <CardDescription>
                Personaliza qué secciones mostrar en la página principal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Banner principal (Hero)</p>
                    <p className="text-sm text-zinc-500">Muestra el banner destacado en la parte superior</p>
                  </div>
                  <Switch
                    checked={homepageConfig?.showHeroBanner ?? true}
                    onCheckedChange={(checked) =>
                      setValue('homepage_config.showHeroBanner', checked, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Productos destacados</p>
                    <p className="text-sm text-zinc-500">Muestra una selección de productos destacados</p>
                  </div>
                  <Switch
                    checked={homepageConfig?.showFeaturedProducts ?? true}
                    onCheckedChange={(checked) =>
                      setValue('homepage_config.showFeaturedProducts', checked, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Categorías</p>
                    <p className="text-sm text-zinc-500">Muestra las categorías de productos</p>
                  </div>
                  <Switch
                    checked={homepageConfig?.showCategories ?? true}
                    onCheckedChange={(checked) =>
                      setValue('homepage_config.showCategories', checked, { shouldDirty: true })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Nuevos productos</p>
                    <p className="text-sm text-zinc-500">Muestra los productos más recientes</p>
                  </div>
                  <Switch
                    checked={homepageConfig?.showNewArrivals ?? true}
                    onCheckedChange={(checked) =>
                      setValue('homepage_config.showNewArrivals', checked, { shouldDirty: true })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="featuredLimit">Cantidad de productos destacados</Label>
                  <Input
                    id="featuredLimit"
                    type="number"
                    min={1}
                    max={20}
                    {...register('homepage_config.featuredProductsLimit', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newArrivalsLimit">Cantidad de nuevos productos</Label>
                  <Input
                    id="newArrivalsLimit"
                    type="number"
                    min={1}
                    max={20}
                    {...register('homepage_config.newArrivalsLimit', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Envío */}
        <TabsContent value="shipping" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Configuración de envío
              </CardTitle>
              <CardDescription>
                Configura las opciones de envío y retiro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flatRate">Tarifa de envío fija</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="flatRate"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register('shipping_config.flatRate', { valueAsNumber: true })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">Envío gratis desde</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register('shipping_config.freeShippingThreshold', { valueAsNumber: true })}
                      placeholder="Sin mínimo"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Dejar en blanco para no ofrecer envío gratis</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Retiro en local</p>
                    <p className="text-sm text-zinc-500">Permitir que los clientes retiren en tu local</p>
                  </div>
                  <Switch
                    checked={shippingConfig?.enableLocalPickup ?? false}
                    onCheckedChange={(checked) =>
                      setValue('shipping_config.enableLocalPickup', checked, { shouldDirty: true })
                    }
                  />
                </div>

                {shippingConfig?.enableLocalPickup && (
                  <div className="space-y-2">
                    <Label htmlFor="pickupAddress">Dirección de retiro</Label>
                    <Textarea
                      id="pickupAddress"
                      {...register('shipping_config.localPickupAddress')}
                      placeholder="Ingresa la dirección donde los clientes pueden retirar sus pedidos"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón guardar flotante */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !isDirty}
          className="shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
