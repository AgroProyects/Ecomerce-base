interface OrderDetails {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress?: string;
}

interface PasswordResetDetails {
  customerName: string;
  resetLink: string;
}

interface WelcomeDetails {
  customerName: string;
  email: string;
}

export function getOrderConfirmationTemplate(details: OrderDetails): string {
  const itemsHtml = details.items
    .map(
      item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">¡Gracias por tu compra!</h1>

          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${details.customerName},</p>

          <p style="margin-bottom: 20px;">Tu pedido ha sido confirmado y está siendo procesado.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Detalles del Pedido</h2>
            <p style="margin-bottom: 10px;"><strong>Número de pedido:</strong> ${details.orderNumber}</p>

            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Producto</th>
                  <th style="padding: 10px; text-align: center;">Cantidad</th>
                  <th style="padding: 10px; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #2563eb;">
              <p style="text-align: right; font-size: 18px; font-weight: bold;">
                Total: $${details.total.toFixed(2)}
              </p>
            </div>

            ${
              details.shippingAddress
                ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h3 style="color: #1f2937; margin-bottom: 10px;">Dirección de envío</h3>
                <p style="margin: 0;">${details.shippingAddress}</p>
              </div>
            `
                : ''
            }
          </div>

          <p style="margin-top: 20px;">Te notificaremos cuando tu pedido sea enviado.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Tu Tienda Virtual. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPasswordResetTemplate(details: PasswordResetDetails): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Restablecer Contraseña</h1>

          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${details.customerName},</p>

          <p style="margin-bottom: 20px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin-bottom: 20px;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>

            <a href="${details.resetLink}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Restablecer Contraseña
            </a>

            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              Este enlace expirará en 1 hora.
            </p>
          </div>

          <p style="margin-top: 20px; font-size: 14px;">
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tu Tienda Virtual. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWelcomeTemplate(details: WelcomeDetails): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">¡Bienvenido a Tu Tienda Virtual!</h1>

          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${details.customerName},</p>

          <p style="margin-bottom: 20px;">
            Estamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Detalles de tu cuenta</h2>
            <p style="margin-bottom: 10px;"><strong>Email:</strong> ${details.email}</p>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #065f46;">
              <strong>¡Comienza a explorar!</strong><br>
              Descubre nuestros productos y aprovecha las ofertas especiales para nuevos clientes.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Si tienes alguna pregunta, estamos aquí para ayudarte.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Tu Tienda Virtual. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getOrderShippedTemplate(details: {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">¡Tu pedido está en camino!</h1>

          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${details.customerName},</p>

          <p style="margin-bottom: 20px;">
            Tu pedido #${details.orderNumber} ha sido enviado y está en camino hacia ti.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${
              details.trackingNumber
                ? `<p style="margin-bottom: 10px;"><strong>Número de seguimiento:</strong> ${details.trackingNumber}</p>`
                : ''
            }
            ${
              details.estimatedDelivery
                ? `<p style="margin-bottom: 10px;"><strong>Entrega estimada:</strong> ${details.estimatedDelivery}</p>`
                : ''
            }
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Gracias por tu compra.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Tu Tienda Virtual. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
