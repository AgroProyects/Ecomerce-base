'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@/lib/auth/config'
import type { ApiResponse } from '@/types/api'
import {
  getReviewsSchema,
  type GetReviewsInput,
  type Review,
  type ReviewWithUser,
  type ProductRating,
} from '@/schemas/review.schema'

/**
 * Obtener reviews de un producto
 */
export async function getProductReviews(
  input: GetReviewsInput
): Promise<ApiResponse<{ reviews: ReviewWithUser[]; rating?: ProductRating; hasMore: boolean }>> {
  try {
    // Validar input
    const validationResult = getReviewsSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    const supabase = createAdminClient()
    const session = await auth()

    // Construir query base
    let query = supabase
      .from('product_reviews')
      .select(
        `
        *,
        user:users(name, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('product_id', data.productId)

    // Filtro por estado (por defecto solo aprobados para usuarios públicos)
    if (data.status) {
      query = query.eq('status', data.status)
    } else {
      // Para admins mostrar todos, para usuarios solo aprobados
      const userRole = session?.user?.role as string
      if (!['admin', 'super_admin'].includes(userRole)) {
        query = query.eq('status', 'approved')
      }
    }

    // Filtro por rating
    if (data.rating) {
      query = query.eq('rating', data.rating)
    }

    // Filtro por verified purchase
    if (data.verifiedOnly) {
      query = query.eq('is_verified_purchase', true)
    }

    // Ordenamiento
    switch (data.sortBy) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false })
        break
      case 'rating_high':
        query = query.order('rating', { ascending: false })
        break
      case 'rating_low':
        query = query.order('rating', { ascending: true })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Paginación
    const from = (data.page - 1) * data.limit
    const to = from + data.limit - 1
    query = query.range(from, to)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return {
        success: false,
        error: 'Error al obtener reviews',
      }
    }

    // Si hay usuario logueado, verificar qué reviews ha votado como útil
    let reviewsWithVotes: ReviewWithUser[] = reviews || []

    if (session?.user) {
      const reviewIds = reviews?.map((r) => r.id) || []

      const { data: votes } = await supabase
        .from('review_helpful_votes')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('user_id', session.user.id)

      const votedIds = new Set(votes?.map((v) => v.review_id) || [])

      reviewsWithVotes = (reviews || []).map((review) => ({
        ...review,
        has_voted_helpful: votedIds.has(review.id),
      }))
    }

    // Calcular si hay más páginas
    const hasMore = count ? count > (data.page * data.limit) : false

    return {
      success: true,
      data: {
        reviews: reviewsWithVotes as ReviewWithUser[],
        hasMore,
      },
    }
  } catch (error) {
    console.error('Error in getProductReviews:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Obtener rating promedio y distribución de un producto
 */
export async function getProductRating(
  productId: string
): Promise<ApiResponse<ProductRating>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
      }
    }

    const supabase = createAdminClient()

    // Usar función SQL para calcular rating
    const { data, error } = await supabase.rpc('calculate_product_rating', {
      p_product_id: productId,
    })

    if (error) {
      console.error('Error calculating rating:', error)
      return {
        success: false,
        error: 'Error al calcular rating',
      }
    }

    // La función devuelve un array con un solo objeto
    const rating = data?.[0] || {
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    }

    return {
      success: true,
      data: rating as ProductRating,
    }
  } catch (error) {
    console.error('Error in getProductRating:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Verificar si el usuario puede dejar review para un producto
 */
export async function canUserReviewProduct(
  productId: string
): Promise<ApiResponse<boolean>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
      }
    }

    const session = await auth()
    if (!session?.user) {
      return {
        success: true,
        data: false, // No autenticado, no puede dejar review
      }
    }

    const supabase = createAdminClient()

    // Usar función SQL para verificar
    const { data, error } = await supabase.rpc('can_user_review_product', {
      p_user_id: session.user.id,
      p_product_id: productId,
    })

    if (error) {
      console.error('Error checking review eligibility:', error)
      return {
        success: false,
        error: 'Error al verificar elegibilidad',
      }
    }

    return {
      success: true,
      data: data || false,
    }
  } catch (error) {
    console.error('Error in canUserReviewProduct:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Obtener review del usuario para un producto específico
 */
export async function getUserReviewForProduct(
  productId: string
): Promise<ApiResponse<Review | null>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
      }
    }

    const session = await auth()
    if (!session?.user) {
      return {
        success: true,
        data: null,
      }
    }

    const supabase = createAdminClient()

    const { data: review, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      // No error si no hay review
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: null,
        }
      }

      console.error('Error fetching user review:', error)
      return {
        success: false,
        error: 'Error al obtener review',
      }
    }

    return {
      success: true,
      data: review as Review,
    }
  } catch (error) {
    console.error('Error in getUserReviewForProduct:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Obtener reviews pendientes de moderación (Admin)
 */
export async function getPendingReviews(params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'spam'
  sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'reports'
}): Promise<
  ApiResponse<{
    reviews: Review[]
    stats?: {
      pending: number
      approved: number
      rejected: number
      spam: number
      reported: number
    }
  }>
> {
  try {
    // Verificar permisos de admin
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'No autorizado',
      }
    }

    const userRole = session.user.role as string
    if (!['admin', 'super_admin'].includes(userRole)) {
      return {
        success: false,
        error: 'No tienes permisos para ver reviews pendientes',
      }
    }

    const supabase = createAdminClient()

    // Obtener estadísticas
    const { data: statsData } = await supabase
      .from('product_reviews')
      .select('status, report_count')

    const stats = {
      pending: statsData?.filter(r => r.status === 'pending').length || 0,
      approved: statsData?.filter(r => r.status === 'approved').length || 0,
      rejected: statsData?.filter(r => r.status === 'rejected').length || 0,
      spam: statsData?.filter(r => r.status === 'spam').length || 0,
      reported: statsData?.filter(r => (r.report_count || 0) > 0).length || 0,
    }

    // Construir query
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products!inner(name, slug)
      `)

    // Filtrar por estado si se especifica
    if (params?.status) {
      query = query.eq('status', params.status)
    }

    // Ordenamiento
    switch (params?.sortBy) {
      case 'rating_high':
        query = query.order('rating', { ascending: false })
        break
      case 'rating_low':
        query = query.order('rating', { ascending: true })
        break
      case 'reports':
        query = query.order('report_count', { ascending: false, nullsFirst: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching pending reviews:', error)
      return {
        success: false,
        error: 'Error al obtener reviews pendientes',
      }
    }

    // Formatear data
    const formattedReviews = (reviews || []).map(review => ({
      ...review,
      product_name: review.products?.name,
      product_slug: review.products?.slug,
    }))

    return {
      success: true,
      data: {
        reviews: formattedReviews as Review[],
        stats,
      },
    }
  } catch (error) {
    console.error('Error in getPendingReviews:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Obtener todas las reviews del usuario
 */
export async function getUserReviews(userId: string): Promise<ApiResponse<Review[]>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ID de usuario requerido',
      }
    }

    const session = await auth()
    if (!session?.user || session.user.id !== userId) {
      return {
        success: false,
        error: 'No autorizado',
      }
    }

    const supabase = createAdminClient()

    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        products!inner(name, slug)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user reviews:', error)
      return {
        success: false,
        error: 'Error al obtener tus reviews',
      }
    }

    // Formatear data
    const formattedReviews = (reviews || []).map(review => ({
      ...review,
      product_name: review.products?.name,
      product_slug: review.products?.slug,
    }))

    return {
      success: true,
      data: formattedReviews as Review[],
    }
  } catch (error) {
    console.error('Error in getUserReviews:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
