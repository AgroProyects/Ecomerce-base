import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send-email'
import { z } from 'zod'

const testEmailSchema = z.object({
  to: z.string().email('Email inválido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = testEmailSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { to, subject, message } = result.data

    // HTML simple para el email de prueba
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 8px 8px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 12px;
            }
            .badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📧 Email de Prueba</h1>
            <span class="badge">Sistema funcionando correctamente</span>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Información del envío:</strong><br>
              Fecha: ${new Date().toLocaleString('es-UY')}<br>
              Servidor SMTP: ${process.env.MAIL_HOST || 'No configurado'}<br>
              Puerto: ${process.env.MAIL_PORT || 'No configurado'}
            </p>
          </div>
          <div class="footer">
            <p>Este es un email de prueba enviado desde el panel de administración.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.MAIL_FROM_NAME || 'Tu Tienda'}. Todos los derechos reservados.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail({
      to,
      subject,
      html,
    })

    return NextResponse.json(
      {
        message: 'Email enviado exitosamente',
        details: {
          to,
          subject,
          sentAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        error: 'Error al enviar el email',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
