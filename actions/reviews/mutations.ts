/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth/config'
import { checkEmailVerified } from '@/actions/auth/verification'
import type { ApiResponse } from '@/types/api'
import {
  createReviewSchema,
  type CreateReviewInput,
  updateReviewSchema,
  type UpdateReviewInput,
  moderateReviewSchema,
  type ModerateReviewInput,
  voteHelpfulSchema,
  type VoteHelpfulInput,
  reportReviewSchema,
  type ReportReviewInput,
  type Review,
} from '@/schemas/review.schema'

// Helper para tablas sin tipos generados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

/**
 * Crear un nuevo review
 */
export async function createReview(
  input: CreateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // Validar input
    const validationResult = createReviewSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    // Obtener sesión
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para dejar un review',
      }
    }

    // Verificar que el email esté verificado
    const verificationResult = await checkEmailVerified(session.user.id)
    if (!verificationResult.verified) {
      return {
        success: false,
        error: 'Debes verificar tu email antes de dejar un review. Revisa tu bandeja de entrada.',
      }
    }

    const supabase = createAdminClient()

    // Verificar que el producto existe
    const { data: product } = await (supabase as any)
      .from('products')
      .select('id')
      .eq('id', data.productId)
      .single()

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    // Verificar que el usuario no haya dejado ya un review
    const { data: existingReview } = await (supabase as any)
      .from('product_reviews')
      .select('id')
      .eq('product_id', data.productId)
      .eq('user_id', session.user.id)
      .single()

    if (existingReview) {
      return {
        success: false,
        error: 'Ya has dejado un review para este producto',
      }
    }

    // Crear review
    const { data: review, error: createError } = await (supabase as any)
      .from('product_reviews')
      .insert({
        product_id: data.productId,
        user_id: session.user.id,
        order_id: data.orderId || null,
        customer_name: session.user.name || 'Usuario',
        customer_email: session.user.email!,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
        images: data.images || [],
        status: 'pending', // Requiere moderación
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating review:', createError)
      return {
        success: false,
        error: 'Error al crear el review',
      }
    }

    // Revalidar páginas
    revalidatePath(`/products/[slug]`)
    revalidatePath(`/mi-cuenta/pedidos`)

    return {
      success: true,
      data: review as Review,
      message: 'Review enviado correctamente. Será visible una vez aprobado.',
    }
  } catch (error) {
    console.error('Error in createReview:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Actualizar review propio (solo si está pending)
 */
export async function updateReview(
  input: UpdateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // Validar input
    const validationResult = updateReviewSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    // Obtener sesión
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'No autorizado',
      }
    }

    const supabase = createAdminClient()

    // Verificar que el review existe y pertenece al usuario
    const { data: existingReview } = await (supabase as any)
      .from('product_reviews')
      .select('*')
      .eq('id', data.id)
      .eq('user_id', session.user.id)
      .single()

    if (!existingReview) {
      return {
        success: false,
        error: 'Review no encontrado',
      }
    }

    // Solo permitir edición si está pending
    if (existingReview.status !== 'pending') {
      return {
        success: false,
        error: 'Solo puedes editar reviews pendientes de aprobación',
      }
    }

    // Actualizar review
    const updateData: any = {}
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.title !== undefined) updateData.title = data.title
    if (data.comment !== undefined) updateData.comment = data.comment
    if (data.images !== undefined) updateData.images = data.images

    const { data: updatedReview, error: updateError } = await (supabase as any)
      .from('product_reviews')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating review:', updateError)
      return {
        success: false,
        error: 'Error al actualizar el review',
      }
    }

    revalidatePath(`/products/[slug]`)
    revalidatePath(`/mi-cuenta/pedidos`)

    return {
      success: true,
      data: updatedReview as Review,
      message: 'Review actualizado correctamente',
    }
  } catch (error) {
    console.error('Error in updateReview:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Eliminar review propio
 */
export async function deleteReview(reviewId: string): Promise<ApiResponse<void>> {
  try {
    if (!reviewId) {
      return {
        success: false,
        error: 'ID de review requerido',
      }
    }

    // Obtener sesión
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'No autorizado',
      }
    }

    const supabase = createAdminClient()

    // Verificar que el review existe y pertenece al usuario
    const { data: existingReview } = await (supabase as any)
      .from('product_reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single()

    if (!existingReview) {
      return {
        success: false,
        error: 'Review no encontrado',
      }
    }

    if (existingReview.user_id !== session.user.id) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este review',
      }
    }

    // Eliminar review
    const { error: deleteError } = await (supabase as any)
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      console.error('Error deleting review:', deleteError)
      return {
        success: false,
        error: 'Error al eliminar el review',
      }
    }

    revalidatePath(`/products/[slug]`)

    return {
      success: true,
      message: 'Review eliminado correctamente',
    }
  } catch (error) {
    console.error('Error in deleteReview:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Moderar review (Admin)
 */
export async function moderateReview(
  input: ModerateReviewInput
): Promise<ApiResponse<Review>> {
  try {
    // Validar input
    const validationResult = moderateReviewSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

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
        error: 'No tienes permisos para moderar reviews',
      }
    }

    const supabase = createAdminClient()

    // Actualizar estado
    const updateData: any = {
      status: data.status,
    }

    // Si se aprueba, guardar fecha de aprobación
    if (data.status === 'approved') {
      updateData.approved_at = new Date().toISOString()
    }

    const { data: moderatedReview, error: moderateError } = await (supabase as any)
      .from('product_reviews')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (moderateError) {
      console.error('Error moderating review:', moderateError)
      return {
        success: false,
        error: 'Error al moderar el review',
      }
    }

    revalidatePath(`/admin/reviews`)
    revalidatePath(`/products/[slug]`)

    return {
      success: true,
      data: moderatedReview as Review,
      message: `Review ${data.status === 'approved' ? 'aprobado' : 'rechazado'} correctamente`,
    }
  } catch (error) {
    console.error('Error in moderateReview:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Votar review como útil
 */
export async function voteHelpful(
  input: VoteHelpfulInput
): Promise<ApiResponse<void>> {
  try {
    // Validar input
    const validationResult = voteHelpfulSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    // Obtener sesión
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para votar',
      }
    }

    const supabase = createAdminClient()

    // Verificar si ya votó
    const { data: existingVote } = await (supabase as any)
      .from('review_helpful_votes')
      .select('id')
      .eq('review_id', data.reviewId)
      .eq('user_id', session.user.id)
      .single()

    if (existingVote) {
      // Si ya votó, quitar voto
      const { error: deleteError } = await (supabase as any)
        .from('review_helpful_votes')
        .delete()
        .eq('id', existingVote.id)

      if (deleteError) {
        console.error('Error removing vote:', deleteError)
        return {
          success: false,
          error: 'Error al quitar voto',
        }
      }

      revalidatePath(`/products/[slug]`)

      return {
        success: true,
        message: 'Voto eliminado',
      }
    }

    // Agregar voto
    const { error: voteError } = await (supabase as any)
      .from('review_helpful_votes')
      .insert({
        review_id: data.reviewId,
        user_id: session.user.id,
      })

    if (voteError) {
      console.error('Error voting helpful:', voteError)
      return {
        success: false,
        error: 'Error al votar',
      }
    }

    revalidatePath(`/products/[slug]`)

    return {
      success: true,
      message: 'Voto registrado',
    }
  } catch (error) {
    console.error('Error in voteHelpful:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

/**
 * Reportar review
 */
export async function reportReview(
  input: ReportReviewInput
): Promise<ApiResponse<void>> {
  try {
    // Validar input
    const validationResult = reportReviewSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    // Obtener sesión
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para reportar',
      }
    }

    const supabase = createAdminClient()

    // Crear reporte
    const { error: reportError } = await (supabase as any)
      .from('review_reports')
      .insert({
        review_id: data.reviewId,
        user_id: session.user.id,
        reason: data.reason,
        details: data.details || null,
      })

    if (reportError) {
      console.error('Error reporting review:', reportError)
      return {
        success: false,
        error: 'Error al reportar review',
      }
    }

    return {
      success: true,
      message: 'Reporte enviado. Lo revisaremos pronto.',
    }
  } catch (error) {
    console.error('Error in reportReview:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
