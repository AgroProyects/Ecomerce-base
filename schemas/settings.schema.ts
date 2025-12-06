import { z } from 'zod'

export const socialLinksSchema = z.object({
  facebook: z.string().url().nullable().optional(),
  instagram: z.string().url().nullable().optional(),
  twitter: z.string().url().nullable().optional(),
  youtube: z.string().url().nullable().optional(),
  tiktok: z.string().url().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
})

export const storeAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('Argentina'),
})

export const seoConfigSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional(),
})

export const homepageConfigSchema = z.object({
  showHeroBanner: z.boolean().default(true),
  showFeaturedProducts: z.boolean().default(true),
  showCategories: z.boolean().default(true),
  showNewArrivals: z.boolean().default(true),
  featuredProductsLimit: z.number().int().min(1).max(20).default(8),
  newArrivalsLimit: z.number().int().min(1).max(20).default(8),
})

export const shippingConfigSchema = z.object({
  freeShippingThreshold: z.number().min(0).nullable().optional(),
  flatRate: z.number().min(0).default(0),
  enableLocalPickup: z.boolean().default(false),
  localPickupAddress: z.string().optional(),
})

export const storeSettingsSchema = z.object({
  store_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  store_slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(50, 'El slug no puede exceder 50 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(500).nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido')
    .default('#000000'),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido')
    .default('#ffffff'),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido')
    .default('#3b82f6'),
  social_links: socialLinksSchema.nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  address: storeAddressSchema.nullable().optional(),
  currency: z.string().default('ARS'),
  currency_symbol: z.string().default('$'),
  timezone: z.string().default('America/Argentina/Buenos_Aires'),
  homepage_config: homepageConfigSchema.nullable().optional(),
  seo_config: seoConfigSchema.nullable().optional(),
  shipping_config: shippingConfigSchema.nullable().optional(),
})

export const updateStoreSettingsSchema = storeSettingsSchema.partial().extend({
  id: z.string().uuid('ID de configuración inválido'),
})

export type SocialLinks = z.infer<typeof socialLinksSchema>
export type StoreAddress = z.infer<typeof storeAddressSchema>
export type SeoConfig = z.infer<typeof seoConfigSchema>
export type HomepageConfig = z.infer<typeof homepageConfigSchema>
export type ShippingConfig = z.infer<typeof shippingConfigSchema>
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>
