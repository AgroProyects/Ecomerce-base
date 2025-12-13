import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { render } from '@react-email/render'
import { sendEmail } from '@/lib/email/send-email'
import EmailVerification from '@/lib/email/templates/email-verification'

const verificationTestSchema = z.object({
  to: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = verificationTestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { to, name } = result.data

    // Generar token de prueba
    const testToken = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${testToken}`

    // Renderizar el template
    const html = await render(
      EmailVerification({
        name,
        verificationUrl,
      })
    )

    await sendEmail({
      to,
      subject: '✓ Confirma tu email - Bienvenido a la tienda',
      html,
    })

    return NextResponse.json(
      {
        message: 'Email de verificación enviado exitosamente',
        details: {
          to,
          name,
          verificationUrl,
          sentAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      {
        error: 'Error al enviar el email de verificación',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
