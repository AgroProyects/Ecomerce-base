import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'

const verifySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.verification.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. Continuar con la lógica normal
    const body = await request.json()
    const result = verifySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token } = result.data
    const supabase = createAdminClient()

    // Find the verification token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .is('verified_at', null) // Not yet verified
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'El token ha expirado. Por favor solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Mark token as verified
    const { error: updateTokenError } = await supabase
      .from('email_verification_tokens')
      .update({
        verified_at: new Date().toISOString(),
      })
      .eq('id', tokenData.id)

    if (updateTokenError) {
      console.error('Error updating token:', updateTokenError)
    }

    // Update user's email confirmation in Supabase Auth
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      {
        email_confirm: true,
      }
    )

    if (confirmError) {
      console.error('Error confirming email:', confirmError)
      return NextResponse.json(
        { error: 'Error al confirmar el email' },
        { status: 500 }
      )
    }

    // Update customer record if exists
    const { error: customerError } = await supabase
      .from('customers')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', tokenData.user_id)

    if (customerError) {
      console.error('Error updating customer:', customerError)
    }

    return NextResponse.json(
      {
        message: 'Email verificado exitosamente',
        email: tokenData.email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
