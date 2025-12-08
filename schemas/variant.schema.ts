import { z } from 'zod'

export const variantAttributeSchema = z.object({
  name: z.string().min(1, 'El nombre del atributo es requerido'),
  value: z.string().min(1, 'El valor del atributo es requerido'),
})

export const variantSchema = z.object({
  product_id: z.string().uuid('ID de producto inválido'),
  name: z
    .string()
    .min(1, 'El nombre de la variante es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  sku: z
    .string()
    .max(50, 'El SKU no puede exceder 50 caracteres')
    .nullable()
    .optional(),
  price_override: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(99999999.99, 'El precio es demasiado alto')
    .nullable()
    .optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  attributes: z.array(variantAttributeSchema).default([]),
  image_url: z.string().url('URL de imagen inválida').nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

export const createVariantSchema = variantSchema

export const updateVariantSchema = variantSchema.partial().extend({
  id: z.string().uuid('ID de variante inválido'),
})

export const bulkCreateVariantsSchema = z.object({
  product_id: z.string().uuid('ID de producto inválido'),
  variants: z.array(variantSchema.omit({ product_id: true })),
})

// Schema para actualizar stock de variante
export const updateVariantStockSchema = z.object({
  id: z.string().uuid('ID de variante inválido'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
})

// Schema para ajustar stock (incrementar/decrementar)
export const adjustVariantStockSchema = z.object({
  id: z.string().uuid('ID de variante inválido'),
  adjustment: z.number().int(),
  reason: z.string().optional(),
})

// Schema para generación masiva de variantes
export const generateVariantsSchema = z.object({
  product_id: z.string().uuid('ID de producto inválido'),
  attributes: z.array(
    z.object({
      name: z.string().min(1),
      values: z.array(z.string().min(1)).min(1, 'Debe tener al menos un valor'),
    })
  ).min(1, 'Debe tener al menos un tipo de atributo'),
  base_price: z.number().min(0).optional().nullable(),
  base_stock: z.number().int().min(0).default(0),
})

// Tipos inferidos
export type VariantFormData = z.infer<typeof variantSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type BulkCreateVariantsInput = z.infer<typeof bulkCreateVariantsSchema>
export type UpdateVariantStockInput = z.infer<typeof updateVariantStockSchema>
export type AdjustVariantStockInput = z.infer<typeof adjustVariantStockSchema>
export type GenerateVariantsInput = z.infer<typeof generateVariantsSchema>
