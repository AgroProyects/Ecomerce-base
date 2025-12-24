/**
 * Email Worker
 * Procesa los jobs de la email queue usando BullMQ Worker
 */

import { Worker, Job } from 'bullmq'
import { redisOptions } from './redis-connection'
import { EmailData, EmailType } from './types'
import { transporter } from '@/lib/email/client'
import * as Sentry from '@sentry/nextjs'
import { emailLogger } from '@/lib/logger/config'
import { logQueueJob } from '@/lib/logger/utils'

/**
 * Templates HTML para cada tipo de email
 */
const emailTemplates = {
  [EmailType.VERIFICATION]: (data: EmailData) => {
    if (data.type !== EmailType.VERIFICATION) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #0070f3;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>¡Hola ${data.data.userName}!</h2>
            <p>Gracias por registrarte en nuestra tienda. Para completar tu registro, verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
            <a href="${data.data.verificationUrl}" class="button">Verificar Email</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${data.data.verificationUrl}</p>
            <p>Este enlace expirará en ${data.data.expiresIn}.</p>
            <div class="footer">
              <p>Si no creaste una cuenta, puedes ignorar este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.PASSWORD_RESET]: (data: EmailData) => {
    if (data.type !== EmailType.PASSWORD_RESET) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #dc2626;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Recupera tu contraseña</h2>
            <p>Hola ${data.data.userName},</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <a href="${data.data.resetUrl}" class="button">Restablecer Contraseña</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${data.data.resetUrl}</p>
            <p>Este enlace expirará en ${data.data.expiresIn}.</p>
            <div class="footer">
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.ORDER_CONFIRMATION]: (data: EmailData) => {
    if (data.type !== EmailType.ORDER_CONFIRMATION) return ''
    const itemsHtml = data.data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>¡Gracias por tu compra, ${data.data.userName}!</h2>
            <p>Tu pedido <strong>#${data.data.orderNumber}</strong> ha sido confirmado.</p>
            <p><strong>Fecha:</strong> ${data.data.orderDate}</p>

            <h3>Detalles del pedido:</h3>
            <table>
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 8px; text-align: left;">Producto</th>
                  <th style="padding: 8px; text-align: center;">Cantidad</th>
                  <th style="padding: 8px; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right;">Subtotal:</td>
                  <td style="padding: 8px; text-align: right;">$${data.data.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right;">Envío:</td>
                  <td style="padding: 8px; text-align: right;">$${data.data.shipping.toFixed(2)}</td>
                </tr>
                ${
                  data.data.discount
                    ? `
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right; color: green;">Descuento:</td>
                  <td style="padding: 8px; text-align: right; color: green;">-$${data.data.discount.toFixed(2)}</td>
                </tr>
                `
                    : ''
                }
                <tr class="total">
                  <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #333;">Total:</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #333;">$${data.data.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            ${data.data.trackingUrl ? `<p><a href="${data.data.trackingUrl}">Rastrear mi pedido</a></p>` : ''}

            <div class="footer">
              <p>Te notificaremos cuando tu pedido sea enviado.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.ORDER_STATUS]: (data: EmailData) => {
    if (data.type !== EmailType.ORDER_STATUS) return ''
    const statusColors = {
      processing: '#f59e0b',
      shipped: '#3b82f6',
      delivered: '#10b981',
      cancelled: '#ef4444',
    }
    const color = statusColors[data.data.status]

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .status {
              padding: 10px 20px;
              background: ${color};
              color: white;
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Actualización de tu pedido</h2>
            <p>Hola ${data.data.userName},</p>
            <p>Tu pedido <strong>#${data.data.orderNumber}</strong> ha sido actualizado:</p>
            <div class="status">${data.data.statusMessage}</div>
            ${data.data.trackingUrl ? `<p><a href="${data.data.trackingUrl}">Rastrear mi pedido</a></p>` : ''}
            <div class="footer">
              <p>Gracias por tu compra.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.PAYMENT_CONFIRMED]: (data: EmailData) => {
    if (data.type !== EmailType.PAYMENT_CONFIRMED) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { background: #10b981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>¡Pago confirmado!</h2>
            <p>Hola ${data.data.userName},</p>
            <div class="success">
              Tu pago de <strong>$${data.data.amount.toFixed(2)}</strong> ha sido procesado exitosamente.
            </div>
            <p><strong>Pedido:</strong> #${data.data.orderNumber}</p>
            <p><strong>Método de pago:</strong> ${data.data.paymentMethod}</p>
            <p><strong>ID de transacción:</strong> ${data.data.transactionId}</p>
            <div class="footer">
              <p>Gracias por tu compra.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.PAYMENT_FAILED]: (data: EmailData) => {
    if (data.type !== EmailType.PAYMENT_FAILED) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .error { background: #ef4444; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #0070f3;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Problema con el pago</h2>
            <p>Hola ${data.data.userName},</p>
            <div class="error">
              No pudimos procesar tu pago de <strong>$${data.data.amount.toFixed(2)}</strong>
            </div>
            <p><strong>Pedido:</strong> #${data.data.orderNumber}</p>
            <p><strong>Motivo:</strong> ${data.data.reason}</p>
            ${data.data.retryUrl ? `<a href="${data.data.retryUrl}" class="button">Reintentar Pago</a>` : ''}
            <div class="footer">
              <p>Si necesitas ayuda, contáctanos.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.WELCOME]: (data: EmailData) => {
    if (data.type !== EmailType.WELCOME) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .discount { background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>¡Bienvenido, ${data.data.userName}!</h2>
            <p>Gracias por unirte a nuestra tienda. Estamos emocionados de tenerte con nosotros.</p>
            ${
              data.data.discountCode
                ? `
            <div class="discount">
              <p>Como bienvenida, te regalamos un ${data.data.discountAmount}% de descuento en tu primera compra:</p>
              <div class="code">${data.data.discountCode}</div>
            </div>
            `
                : ''
            }
            <p>Explora nuestro catálogo y encuentra productos increíbles.</p>
            <div class="footer">
              <p>¡Felices compras!</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.PROMOTIONAL]: (data: EmailData) => {
    if (data.type !== EmailType.PROMOTIONAL) return ''
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #0070f3;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${data.data.campaignName}</h2>
            <p>Hola ${data.data.userName},</p>
            <div>${data.data.content}</div>
            ${data.data.ctaUrl ? `<a href="${data.data.ctaUrl}" class="button">${data.data.ctaText || 'Ver más'}</a>` : ''}
            <div class="footer">
              <p><a href="${data.data.unsubscribeUrl}">Cancelar suscripción</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  [EmailType.SHIPPING_UPDATE]: () => '', // No implementado aún
  [EmailType.NEWSLETTER]: () => '', // No implementado aún
}

/**
 * Procesar un job de email
 */
async function processEmailJob(job: Job<EmailData>) {
  const emailData = job.data
  const startTime = Date.now()

  logQueueJob(emailLogger, {
    jobId: job.id!,
    jobName: emailData.type,
    queueName: 'emails',
    status: 'started',
    data: { to: emailData.to, subject: emailData.subject },
  })

  try {
    // Generar HTML del template
    const html = emailTemplates[emailData.type](emailData)

    if (!html) {
      throw new Error(`Template not found for email type: ${emailData.type}`)
    }

    // Enviar email usando nodemailer
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: emailData.to,
      subject: emailData.subject,
      html,
    })

    const duration = Date.now() - startTime

    logQueueJob(emailLogger, {
      jobId: job.id!,
      jobName: emailData.type,
      queueName: 'emails',
      status: 'completed',
      duration,
      data: { to: emailData.to, messageId: info.messageId },
    })

    return {
      success: true,
      messageId: info.messageId,
      type: emailData.type,
      to: emailData.to,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorObj = error instanceof Error ? error : new Error(String(error))

    logQueueJob(emailLogger, {
      jobId: job.id!,
      jobName: emailData.type,
      queueName: 'emails',
      status: 'failed',
      duration,
      attempt: job.attemptsMade,
      error: errorObj,
      data: { to: emailData.to },
    })

    // Capturar error en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'email-queue',
        email_type: emailData.type,
        priority: emailData.priority,
      },
      extra: {
        to: emailData.to,
        subject: emailData.subject,
        jobId: job.id,
        attemptsMade: job.attemptsMade,
      },
      level: 'error',
    })

    throw error // Re-throw para que BullMQ pueda hacer retry
  }
}

/**
 * Worker que procesa la email queue
 */
export const emailWorker = new Worker('emails', processEmailJob, {
  connection: redisOptions,
  concurrency: 5, // Procesar hasta 5 emails simultáneamente
  limiter: {
    max: 10, // Máximo 10 emails
    duration: 1000, // por segundo (rate limiting)
  },
})

// Event listeners
emailWorker.on('completed', (job) => {
  emailLogger.debug({ jobId: job.id }, 'Job completed')
})

emailWorker.on('failed', (job, err) => {
  if (!job) return

  emailLogger.error(
    {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      error: { message: err.message, name: err.name },
    },
    `Job ${job.id} failed after ${job.attemptsMade} attempts`
  )

  // Si ya se agotaron los intentos, loguear para revisión manual
  if (job.attemptsMade >= (job.opts.attempts || 1)) {
    emailLogger.error(
      {
        jobId: job.id,
        data: job.data,
        error: err.message,
      },
      'Job exhausted all retry attempts - manual review needed'
    )

    Sentry.captureMessage(`Email job ${job.id} failed permanently`, {
      level: 'error',
      tags: {
        module: 'email-queue',
        job_id: job.id!,
      },
      extra: {
        data: job.data,
        error: err.message,
        attemptsMade: job.attemptsMade,
      },
    })
  }
})

emailWorker.on('error', (err) => {
  emailLogger.error({ error: err }, 'Worker error')
  Sentry.captureException(err, {
    tags: { module: 'email-queue', type: 'worker_error' },
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  emailLogger.info('SIGTERM received, closing email worker...')
  await emailWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  emailLogger.info('SIGINT received, closing email worker...')
  await emailWorker.close()
  process.exit(0)
})

emailLogger.info('Email worker started')
