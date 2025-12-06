import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').nullable().optional(),
  image_url: z.string().url('URL de imagen inválida').nullable().optional(),
  parent_id: z.string().uuid('ID de categoría padre inválido').nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

export const createCategorySchema = categorySchema

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.string().uuid('ID de categoría inválido'),
})

export type CategoryFormData = z.infer<typeof categorySchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
