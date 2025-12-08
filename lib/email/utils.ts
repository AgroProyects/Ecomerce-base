import { transporter } from './client';
import type { SendMailOptions } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const mailOptions: SendMailOptions = {
      from: {
        name: process.env.MAIL_FROM_NAME || 'Tu Tienda Virtual',
        address: process.env.MAIL_FROM_ADDRESS || 'noreply@tutienda.com',
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
}

export async function sendBulkEmails(emails: EmailOptions[]) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    total: emails.length,
    successful,
    failed,
    results,
  };
}
