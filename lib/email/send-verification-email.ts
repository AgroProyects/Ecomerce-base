import { queueVerificationEmail } from '@/lib/queue/email-queue'

interface SendVerificationEmailParams {
  to: string
  name: string
  token: string
}

/**
 * Envía email de verificación usando queue (asíncrono)
 * @deprecated - Migrado a email queue para mejor manejo de errores y reintentos
 */
export async function sendVerificationEmail({ to, name, token }: SendVerificationEmailParams) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`

  // Agregar a queue en lugar de enviar directamente
  return queueVerificationEmail({
    to,
    userName: name,
    verificationUrl,
  })
}
