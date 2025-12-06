import { z } from 'zod'

export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(200, 'El slug no puede exceder 200 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(5000, 'La descripción no puede exceder 5000 caracteres').nullable().optional(),
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(99999999.99, 'El precio es demasiado alto'),
  compare_price: z
    .number()
    .min(0, 'El precio de comparación no puede ser negativo')
    .max(99999999.99, 'El precio es demasiado alto')
    .nullable()
    .optional(),
  cost_price: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .max(99999999.99, 'El costo es demasiado alto')
    .nullable()
    .optional(),
  images: z.array(z.string().url('URL de imagen inválida')).default([]),
  category_id: z.string().uuid('ID de categoría inválido').nullable().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  track_inventory: z.boolean().default(true),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  metadata: z.record(z.unknown()).nullable().optional(),
  seo_title: z.string().max(70, 'El título SEO no puede exceder 70 caracteres').nullable().optional(),
  seo_description: z.string().max(160, 'La descripción SEO no puede exceder 160 caracteres').nullable().optional(),
})

export const createProductSchema = productSchema

export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid('ID de producto inválido'),
})

export type ProductFormData = z.infer<typeof productSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
