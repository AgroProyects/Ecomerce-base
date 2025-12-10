'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'

const emailSchema = z.string().email('Email inválido')

/**
 * Resend verification email to user
 */
export async function resendVerificationEmail(email: string) {
  try {
    // Validate email
    const validatedEmail = emailSchema.parse(email)

    const supabase = await createClient()

    // Resend confirmation email using Supabase Auth
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: validatedEmail,
    })

    if (error) {
      console.error('Error resending verification email:', error)

      // Handle specific errors
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Has alcanzado el límite de emails. Por favor espera unos minutos.',
        }
      }

      return {
        success: false,
        error: 'Error al enviar el email de verificación',
      }
    }

    // Log the attempt
    const session = await auth()
    if (session?.user?.id) {
      await (supabase.schema('public') as any).from('email_verification_attempts').insert({
        customer_id: session.user.id,
        email: validatedEmail,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error in resendVerificationEmail:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    return {
      success: false,
      error: 'Error al procesar la solicitud',
    }
  }
}

/**
 * Check if user's email is verified
 */
export async function checkEmailVerified(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase.schema('public') as any)
      .from('customers')
      .select('email_verified')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows

    // If error and it's not a "no rows" error
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email verification:', error)
      return { success: false, verified: false }
    }

    // If no customer record exists, return unverified
    if (!data) {
      console.warn('No customer record found for user:', userId)
      return { success: true, verified: false }
    }

    return {
      success: true,
      verified: data?.email_verified || false,
    }
  } catch (error) {
    console.error('Error in checkEmailVerified:', error)
    return { success: false, verified: false }
  }
}

/**
 * Verify user email with token
 */
export async function verifyEmailWithToken(token: string) {
  try {
    const supabase = await createClient()

    // Verify the token with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })

    if (error) {
      console.error('Error verifying email token:', error)
      return {
        success: false,
        error: 'Token inválido o expirado',
      }
    }

    // Update customer record
    if (data.user?.id) {
      await (supabase.schema('public') as any)
        .from('customers')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
        })
        .eq('id', data.user.id)

      // Log successful verification
      await (supabase.schema('public') as any).from('email_verification_attempts').insert({
        customer_id: data.user.id,
        email: data.user.email || '',
        verified_at: new Date().toISOString(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error in verifyEmailWithToken:', error)
    return {
      success: false,
      error: 'Error al verificar el email',
    }
  }
}

/**
 * Get email verification status for current user
 */
export async function getEmailVerificationStatus() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        verified: false,
        error: 'No autenticado',
      }
    }

    const result = await checkEmailVerified(session.user.id)

    return {
      success: true,
      verified: result.verified,
      email: session.user.email,
    }
  } catch (error) {
    console.error('Error in getEmailVerificationStatus:', error)
    return {
      success: false,
      verified: false,
      error: 'Error al verificar el estado',
    }
  }
}
