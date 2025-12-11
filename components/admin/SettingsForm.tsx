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
  ChevronRight,
  Sparkles,
  Eye,
  Package,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
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

// Configuración de las secciones
const sections = [
  { id: 'general', label: 'General', icon: Store, description: 'Información básica' },
  { id: 'contact', label: 'Contacto', icon: Mail, description: 'Datos de contacto' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, description: 'Colores y estilo' },
  { id: 'social', label: 'Redes', icon: Share2, description: 'Redes sociales' },
  { id: 'homepage', label: 'Inicio', icon: Home, description: 'Página principal' },
  { id: 'shipping', label: 'Envío', icon: Truck, description: 'Opciones de envío' },
]

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

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
    country: 'Uruguay',
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
      currency: settings?.currency || 'UYU',
      currency_symbol: settings?.currency_symbol || '$',
      timezone: settings?.timezone || 'America/Montevideo',
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
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  if (!settings?.id) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Settings2 className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Configuración no disponible</h3>
        <p className="mt-2 text-center text-sm text-zinc-500">
          No se encontró la configuración de la tienda.<br />
          Contacta al administrador.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register('id')} />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar de navegación */}
        <div className="lg:w-64 lg:shrink-0">
          <div className="sticky top-4 space-y-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-current' : 'text-zinc-400')} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className={cn(
                      'text-xs',
                      isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'
                    )}>
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 transition-transform',
                    isActive ? 'rotate-90' : ''
                  )} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 space-y-6">
          {/* General */}
          {activeSection === 'general' && (
            <>
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>Información de la tienda</CardTitle>
                      <CardDescription>Datos básicos de tu negocio</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="store_name">Nombre de la tienda *</Label>
                        <Input
                          id="store_name"
                          {...register('store_name')}
                          placeholder="Mi Tienda"
                          className="h-11"
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
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Describe tu tienda en pocas palabras..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-zinc-400" />
                          Moneda
                        </Label>
                        <Input
                          id="currency"
                          {...register('currency')}
                          placeholder="UYU"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency_symbol">Símbolo</Label>
                        <Input
                          id="currency_symbol"
                          {...register('currency_symbol')}
                          placeholder="$"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-400" />
                          Zona horaria
                        </Label>
                        <Input
                          id="timezone"
                          {...register('timezone')}
                          placeholder="America/Montevideo"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle>Imágenes de marca</CardTitle>
                      <CardDescription>Logo y favicon de tu tienda</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL del Logo</Label>
                      <Input
                        id="logo_url"
                        {...register('logo_url')}
                        placeholder="https://..."
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon_url">URL del Favicon</Label>
                      <Input
                        id="favicon_url"
                        {...register('favicon_url')}
                        placeholder="https://..."
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle>SEO</CardTitle>
                      <CardDescription>Optimización para buscadores</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="seo_title">Título SEO</Label>
                      <Input
                        id="seo_title"
                        {...register('seo_config.title')}
                        placeholder="Mi Tienda - Los mejores productos"
                        maxLength={70}
                        className="h-11"
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
                        className="resize-none"
                      />
                      <p className="text-xs text-zinc-500">Máximo 160 caracteres</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_image">Imagen para compartir (OG Image)</Label>
                      <Input
                        id="og_image"
                        {...register('seo_config.ogImage')}
                        placeholder="https://..."
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Contacto */}
          {activeSection === 'contact' && (
            <>
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle>Información de contacto</CardTitle>
                      <CardDescription>Cómo pueden contactarte tus clientes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-zinc-400" />
                        Email de contacto
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        {...register('contact_email')}
                        placeholder="contacto@mitienda.com"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-zinc-400" />
                        Teléfono
                      </Label>
                      <Input
                        id="contact_phone"
                        {...register('contact_phone')}
                        placeholder="+598 99 123 456"
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                      <MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <CardTitle>Dirección</CardTitle>
                      <CardDescription>Ubicación física de tu tienda</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="address_street">Calle y número</Label>
                      <Input
                        id="address_street"
                        {...register('address.street')}
                        placeholder="Av. 18 de Julio 1234"
                        className="h-11"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="address_city">Ciudad</Label>
                        <Input
                          id="address_city"
                          {...register('address.city')}
                          placeholder="Montevideo"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_state">Departamento</Label>
                        <Input
                          id="address_state"
                          {...register('address.state')}
                          placeholder="Montevideo"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="address_zipCode">Código postal</Label>
                        <Input
                          id="address_zipCode"
                          {...register('address.zipCode')}
                          placeholder="11000"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_country">País</Label>
                        <Input
                          id="address_country"
                          {...register('address.country')}
                          placeholder="Uruguay"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Apariencia */}
          {activeSection === 'appearance' && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-violet-500">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Paleta de colores</CardTitle>
                    <CardDescription>Personaliza los colores de tu tienda</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-3">
                    {/* Color primario */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Color primario</Label>
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-zinc-200 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <input
                            type="color"
                            {...register('primary_color')}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>
                        <Input
                          {...register('primary_color')}
                          className="h-11 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Color secundario */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Color secundario</Label>
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-zinc-200 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          <input
                            type="color"
                            {...register('secondary_color')}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>
                        <Input
                          {...register('secondary_color')}
                          className="h-11 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Color de acento */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Color de acento</Label>
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-zinc-200 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700"
                          style={{ backgroundColor: accentColor }}
                        >
                          <input
                            type="color"
                            {...register('accent_color')}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>
                        <Input
                          {...register('accent_color')}
                          className="h-11 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vista previa mejorada */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Vista previa</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Botón primario
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border-2 bg-transparent px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        Botón outline
                      </button>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Badge
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: primaryColor }}
                      >
                        Enlace de texto
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Redes sociales */}
          {activeSection === 'social' && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Share2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Redes sociales</CardTitle>
                    <CardDescription>Enlaces a tus perfiles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Facebook className="h-4 w-4 text-blue-600" />
                      </div>
                      Facebook
                    </Label>
                    <Input
                      {...register('social_links.facebook')}
                      placeholder="https://facebook.com/mitienda"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Instagram className="h-4 w-4 text-white" />
                      </div>
                      Instagram
                    </Label>
                    <Input
                      {...register('social_links.instagram')}
                      placeholder="https://instagram.com/mitienda"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                        <Twitter className="h-4 w-4 text-white dark:text-zinc-900" />
                      </div>
                      Twitter / X
                    </Label>
                    <Input
                      {...register('social_links.twitter')}
                      placeholder="https://twitter.com/mitienda"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                        <Youtube className="h-4 w-4 text-red-600" />
                      </div>
                      YouTube
                    </Label>
                    <Input
                      {...register('social_links.youtube')}
                      placeholder="https://youtube.com/@mitienda"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                        <svg className="h-4 w-4 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </div>
                      TikTok
                    </Label>
                    <Input
                      {...register('social_links.tiktok')}
                      placeholder="https://tiktok.com/@mitienda"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </div>
                      WhatsApp
                    </Label>
                    <Input
                      {...register('social_links.whatsapp')}
                      placeholder="+59899123456"
                      className="h-11"
                    />
                    <p className="text-xs text-zinc-500">Número con código de país, sin espacios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Homepage */}
          {activeSection === 'homepage' && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <Home className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle>Configuración de inicio</CardTitle>
                    <CardDescription>Personaliza qué secciones mostrar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      key: 'showHeroBanner',
                      title: 'Banner principal (Hero)',
                      description: 'Muestra el banner destacado en la parte superior',
                      icon: Image,
                      color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
                    },
                    {
                      key: 'showFeaturedProducts',
                      title: 'Productos destacados',
                      description: 'Muestra una selección de productos destacados',
                      icon: Sparkles,
                      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                    },
                    {
                      key: 'showCategories',
                      title: 'Categorías',
                      description: 'Muestra las categorías de productos',
                      icon: Package,
                      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    },
                    {
                      key: 'showNewArrivals',
                      title: 'Nuevos productos',
                      description: 'Muestra los productos más recientes',
                      icon: Globe,
                      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const isChecked = homepageConfig?.[item.key as keyof HomepageConfig] ?? true
                    return (
                      <div
                        key={item.key}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-4 transition-colors',
                          isChecked
                            ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
                            : 'border-zinc-100 bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900/50'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', item.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-zinc-500">{item.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isChecked as boolean}
                          onCheckedChange={(checked) =>
                            setValue(`homepage_config.${item.key}` as any, checked, { shouldDirty: true })
                          }
                        />
                      </div>
                    )
                  })}

                  <div className="mt-6 grid gap-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="featuredLimit">Cantidad de productos destacados</Label>
                      <Input
                        id="featuredLimit"
                        type="number"
                        min={1}
                        max={20}
                        {...register('homepage_config.featuredProductsLimit', { valueAsNumber: true })}
                        className="h-11"
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
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Envío */}
          {activeSection === 'shipping' && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle>Configuración de envío</CardTitle>
                    <CardDescription>Opciones de envío y retiro</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="flatRate">Tarifa de envío fija</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="flatRate"
                          type="number"
                          min={0}
                          step="0.01"
                          {...register('shipping_config.flatRate', { valueAsNumber: true })}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeShippingThreshold">Envío gratis desde</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="freeShippingThreshold"
                          type="number"
                          min={0}
                          step="0.01"
                          {...register('shipping_config.freeShippingThreshold', { valueAsNumber: true })}
                          placeholder="Sin mínimo"
                          className="h-11 pl-10"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">Dejar en blanco para no ofrecer envío gratis</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">Retiro en local</p>
                          <p className="text-sm text-zinc-500">Permitir que los clientes retiren en tu local</p>
                        </div>
                      </div>
                      <Switch
                        checked={shippingConfig?.enableLocalPickup ?? false}
                        onCheckedChange={(checked) =>
                          setValue('shipping_config.enableLocalPickup', checked, { shouldDirty: true })
                        }
                      />
                    </div>

                    {shippingConfig?.enableLocalPickup && (
                      <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <Label htmlFor="pickupAddress">Dirección de retiro</Label>
                        <Textarea
                          id="pickupAddress"
                          {...register('shipping_config.localPickupAddress')}
                          placeholder="Ingresa la dirección donde los clientes pueden retirar sus pedidos"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Botón guardar flotante */}
      <div className="sticky bottom-6 mt-6 flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || !isDirty}
          className={cn(
            'h-12 min-w-[180px] rounded-xl shadow-lg transition-all',
            isDirty
              ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900'
              : ''
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
