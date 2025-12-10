import { z } from 'zod'

// ============================================
// SCHEMA: Crear Review
// ============================================
export const createReviewSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  orderId: z.string().uuid('ID de orden inválido').optional(),
  rating: z
    .number()
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas'),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres')
    .optional(),
  comment: z
    .string()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(2000, 'El comentario no puede exceder 2000 caracteres')
    .optional(),
  images: z
    .array(z.string().url('URL de imagen inválida'))
    .max(5, 'Máximo 5 imágenes permitidas')
    .optional()
    .default([]),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

// ============================================
// SCHEMA: Actualizar Review
// ============================================
export const updateReviewSchema = z.object({
  id: z.string().uuid('ID de review inválido'),
  rating: z
    .number()
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas')
    .optional(),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres')
    .optional(),
  comment: z
    .string()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(2000, 'El comentario no puede exceder 2000 caracteres')
    .optional(),
  images: z
    .array(z.string().url('URL de imagen inválida'))
    .max(5, 'Máximo 5 imágenes permitidas')
    .optional(),
})

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>

// ============================================
// SCHEMA: Moderar Review (Admin)
// ============================================
export const moderateReviewSchema = z.object({
  id: z.string().uuid('ID de review inválido'),
  status: z.enum(['pending', 'approved', 'rejected', 'spam'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
})

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>

// ============================================
// SCHEMA: Votar como útil
// ============================================
export const voteHelpfulSchema = z.object({
  reviewId: z.string().uuid('ID de review inválido'),
})

export type VoteHelpfulInput = z.infer<typeof voteHelpfulSchema>

// ============================================
// SCHEMA: Reportar Review
// ============================================
export const reportReviewSchema = z.object({
  reviewId: z.string().uuid('ID de review inválido'),
  reason: z.enum(['spam', 'inappropriate', 'fake', 'offensive', 'other'], {
    errorMap: () => ({ message: 'Motivo de reporte inválido' }),
  }),
  details: z
    .string()
    .max(500, 'Los detalles no pueden exceder 500 caracteres')
    .optional(),
})

export type ReportReviewInput = z.infer<typeof reportReviewSchema>

// ============================================
// SCHEMA: Obtener Reviews (Query Params)
// ============================================
export const getReviewsSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .or(z.string().transform((val) => parseInt(val, 10)))
    .optional(),
  sortBy: z
    .enum(['recent', 'helpful', 'rating_high', 'rating_low'])
    .optional()
    .default('recent'),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .or(z.string().transform((val) => parseInt(val, 10)))
    .optional()
    .default(1),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .or(z.string().transform((val) => parseInt(val, 10)))
    .optional()
    .default(10),
  status: z.enum(['pending', 'approved', 'rejected', 'spam']).optional(),
  verifiedOnly: z
    .boolean()
    .optional()
    .or(z.string().transform((val) => val === 'true'))
    .optional(),
})

export type GetReviewsInput = z.infer<typeof getReviewsSchema>

// ============================================
// TIPOS de respuesta
// ============================================
export type Review = {
  id: string
  product_id: string
  user_id: string | null
  order_id: string | null
  customer_name: string
  customer_email: string
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  is_verified_purchase: boolean
  helpful_count: number
  report_count: number
  created_at: string
  updated_at: string
  approved_at: string | null
  moderated_at: string | null
  moderated_by: string | null
  moderator_notes: string | null
  // Campos adicionales de joins
  user_name?: string
  user_avatar?: string
  product_name?: string
  product_slug?: string
}

export type ProductRating = {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    '5': number
    '4': number
    '3': number
    '2': number
    '1': number
  }
}

export type ReviewWithUser = Review & {
  user?: {
    name: string
    avatar_url?: string
  }
  has_voted_helpful?: boolean
}
