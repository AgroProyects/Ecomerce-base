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

export type VariantFormData = z.infer<typeof variantSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type BulkCreateVariantsInput = z.infer<typeof bulkCreateVariantsSchema>
