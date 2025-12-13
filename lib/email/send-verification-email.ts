import { render } from '@react-email/render'
import { sendEmail } from './send-email'
import EmailVerification from './templates/email-verification'

interface SendVerificationEmailParams {
  to: string
  name: string
  token: string
}

export async function sendVerificationEmail({ to, name, token }: SendVerificationEmailParams) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`

  const html = render(
    EmailVerification({
      name,
      verificationUrl,
    })
  )

  return sendEmail({
    to,
    subject: '✓ Confirma tu email - Bienvenido a la tienda',
    html,
  })
}
