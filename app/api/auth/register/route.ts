import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import crypto from 'crypto'
import { render } from '@react-email/render'
import { sendEmail } from '@/lib/email/send-email'
import EmailVerification from '@/lib/email/templates/email-verification'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
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
      const { error: tokenError } = await supabase
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
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
