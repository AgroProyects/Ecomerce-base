import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'
import { render } from '@react-email/render'
import { sendEmail } from '@/lib/email/send-email'
import EmailVerification from '@/lib/email/templates/email-verification'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'
import * as Sentry from '@sentry/nextjs'
import { registerSchema } from '@/schemas/auth.schema'

export async function POST(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.auth.limit(identifier)

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

    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data
    const supabase = createAdminClient()

    // Create user in Supabase Auth
    // The trigger 'on_auth_user_created' will automatically create the customer record
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: { name },
    })

    if (authError) {
      // Check for duplicate email
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 400 }
        )
      }
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Error al crear la cuenta' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear la cuenta' },
        { status: 500 }
      )
    }

    // The customer record is automatically created by the database trigger
    // Now generate verification token and send email via SMTP

    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

      // Store token in database
      const { error: tokenError } = await (supabase as any)
        .from('email_verification_tokens')
        .insert({
          user_id: authData.user.id,
          token,
          email: authData.user.email!,
          expires_at: expiresAt.toISOString(),
        })

      if (tokenError) {
        console.error('Error creating verification token:', tokenError)
        // Don't fail the registration, just log the error
      }

      // Send verification email via SMTP
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`

      const html = await render(
        EmailVerification({
          name,
          verificationUrl,
        })
      )

      await sendEmail({
        to: authData.user.email!,
        subject: '✓ Confirma tu email - Bienvenido a la tienda',
        html,
      })

      return NextResponse.json(
        {
          message: 'Cuenta creada exitosamente. Por favor verifica tu email para activar tu cuenta.',
          requiresEmailVerification: true,
          email: authData.user.email,
        },
        { status: 201 }
      )
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)

      // Capturar error de email en Sentry
      Sentry.captureException(emailError, {
        tags: {
          module: 'auth',
          endpoint: '/api/auth/register',
          error_type: 'email_sending',
        },
        extra: {
          userId: authData.user.id,
          // NO incluir el email completo por privacidad
        },
        level: 'warning',
      })

      // User is created but email failed - they can request a new one later
      return NextResponse.json(
        {
          message: 'Cuenta creada pero hubo un error al enviar el email. Por favor contacta soporte.',
          requiresEmailVerification: true,
          email: authData.user.email,
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Register error:', error)

    // Capturar error crítico en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'auth',
        endpoint: '/api/auth/register',
      },
      level: 'error',
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
