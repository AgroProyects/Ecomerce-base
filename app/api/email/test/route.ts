import { NextResponse } from 'next/server';
import {
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderShippedEmail,
} from '@/lib/email/examples';

export async function POST(request: Request) {
  try {
    const { type, email, data } = await request.json();

    let result;

    switch (type) {
      case 'order-confirmation':
        result = await sendOrderConfirmationEmail(email, data);
        break;

      case 'welcome':
        result = await sendWelcomeEmail(email, data.customerName);
        break;

      case 'password-reset':
        result = await sendPasswordResetEmail(
          email,
          data.customerName,
          data.resetToken
        );
        break;

      case 'order-shipped':
        result = await sendOrderShippedEmail(email, data);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de email no válido' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email enviado exitosamente',
    });
  } catch (error) {
    console.error('Error al enviar email:', error);
    return NextResponse.json(
      {
        error: 'Error al enviar email',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para probar la configuración
export async function GET() {
  return NextResponse.json({
    message: 'API de email funcionando',
    endpoints: {
      'POST /api/email/test': {
        description: 'Enviar email de prueba',
        body: {
          type: 'order-confirmation | welcome | password-reset | order-shipped',
          email: 'destinatario@example.com',
          data: 'Datos específicos según el tipo de email',
        },
      },
    },
    examples: {
      'order-confirmation': {
        type: 'order-confirmation',
        email: 'cliente@example.com',
        data: {
          orderNumber: 'ORD-12345',
          customerName: 'Juan Pérez',
          items: [
            { name: 'Producto A', quantity: 2, price: 29.99 },
            { name: 'Producto B', quantity: 1, price: 49.99 },
          ],
          total: 109.97,
          shippingAddress: 'Calle Principal 123, Ciudad',
        },
      },
      welcome: {
        type: 'welcome',
        email: 'nuevo@example.com',
        data: {
          customerName: 'María García',
        },
      },
      'password-reset': {
        type: 'password-reset',
        email: 'usuario@example.com',
        data: {
          customerName: 'Carlos López',
          resetToken: 'ejemplo-token-seguro',
        },
      },
      'order-shipped': {
        type: 'order-shipped',
        email: 'cliente@example.com',
        data: {
          orderNumber: 'ORD-12345',
          customerName: 'Ana Martínez',
          trackingNumber: 'TRK-987654',
          estimatedDelivery: '15 de Enero, 2025',
        },
      },
    },
  });
}
