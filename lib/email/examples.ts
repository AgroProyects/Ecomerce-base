import {
  sendEmail,
  getOrderConfirmationTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getOrderShippedTemplate,
} from './index';

// Ejemplo 1: Enviar email de confirmación de pedido
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress?: string;
  }
) {
  const html = getOrderConfirmationTemplate(orderData);

  return sendEmail({
    to: customerEmail,
    subject: `Confirmación de Pedido #${orderData.orderNumber}`,
    html,
    text: `Gracias por tu compra ${orderData.customerName}. Tu pedido #${orderData.orderNumber} ha sido confirmado.`,
  });
}

// Ejemplo 2: Enviar email de bienvenida
export async function sendWelcomeEmail(
  customerEmail: string,
  customerName: string
) {
  const html = getWelcomeTemplate({
    customerName,
    email: customerEmail,
  });

  return sendEmail({
    to: customerEmail,
    subject: '¡Bienvenido a Tu Tienda Virtual!',
    html,
    text: `Hola ${customerName}, bienvenido a Tu Tienda Virtual. Estamos emocionados de tenerte con nosotros.`,
  });
}

// Ejemplo 3: Enviar email de restablecimiento de contraseña
export async function sendPasswordResetEmail(
  customerEmail: string,
  customerName: string,
  resetToken: string
) {
  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  const html = getPasswordResetTemplate({
    customerName,
    resetLink,
  });

  return sendEmail({
    to: customerEmail,
    subject: 'Restablecer tu contraseña',
    html,
    text: `Hola ${customerName}, haz clic en este enlace para restablecer tu contraseña: ${resetLink}`,
  });
}

// Ejemplo 4: Enviar email de pedido enviado
export async function sendOrderShippedEmail(
  customerEmail: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }
) {
  const html = getOrderShippedTemplate(orderData);

  return sendEmail({
    to: customerEmail,
    subject: `Tu pedido #${orderData.orderNumber} está en camino`,
    html,
    text: `Hola ${orderData.customerName}, tu pedido #${orderData.orderNumber} ha sido enviado.`,
  });
}

// Ejemplo 5: Enviar email simple personalizado
export async function sendCustomEmail(
  to: string,
  subject: string,
  message: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            ${message}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tu Tienda Virtual. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: message.replace(/<[^>]*>/g, ''), // Eliminar tags HTML para versión texto
  });
}
