# Sistema de Email con Gmail

Este módulo proporciona funcionalidades completas para enviar emails usando Gmail a través de Nodemailer.

## Configuración

Las siguientes variables de entorno deben estar configuradas en tu archivo `.env`:

```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="enzopch2022@gmail.com"
MAIL_PASSWORD="aevu nrnk hqbg fmdj"
MAIL_FROM_NAME="Tu Tienda Virtual"
MAIL_FROM_ADDRESS="enzopch2022@gmail.com"
```

## Uso Básico

### Importar funciones

```typescript
import { sendEmail, getOrderConfirmationTemplate } from '@/lib/email';
```

### Enviar un email simple

```typescript
await sendEmail({
  to: 'cliente@example.com',
  subject: 'Asunto del email',
  html: '<h1>Contenido HTML</h1>',
  text: 'Contenido en texto plano',
});
```

### Usar plantillas predefinidas

#### 1. Email de confirmación de pedido

```typescript
import { sendOrderConfirmationEmail } from '@/lib/email/examples';

await sendOrderConfirmationEmail('cliente@example.com', {
  orderNumber: 'ORD-12345',
  customerName: 'Juan Pérez',
  items: [
    { name: 'Producto A', quantity: 2, price: 29.99 },
    { name: 'Producto B', quantity: 1, price: 49.99 },
  ],
  total: 109.97,
  shippingAddress: 'Calle Principal 123, Ciudad, País',
});
```

#### 2. Email de bienvenida

```typescript
import { sendWelcomeEmail } from '@/lib/email/examples';

await sendWelcomeEmail('nuevo@example.com', 'María García');
```

#### 3. Email de restablecimiento de contraseña

```typescript
import { sendPasswordResetEmail } from '@/lib/email/examples';

await sendPasswordResetEmail(
  'usuario@example.com',
  'Carlos López',
  'token-seguro-aqui'
);
```

#### 4. Email de pedido enviado

```typescript
import { sendOrderShippedEmail } from '@/lib/email/examples';

await sendOrderShippedEmail('cliente@example.com', {
  orderNumber: 'ORD-12345',
  customerName: 'Ana Martínez',
  trackingNumber: 'TRK-987654',
  estimatedDelivery: '15 de Enero, 2025',
});
```

## Plantillas Disponibles

- `getOrderConfirmationTemplate()` - Confirmación de pedido con detalles completos
- `getWelcomeTemplate()` - Email de bienvenida para nuevos usuarios
- `getPasswordResetTemplate()` - Restablecimiento de contraseña
- `getOrderShippedTemplate()` - Notificación de envío

## Envío Masivo

```typescript
import { sendBulkEmails } from '@/lib/email';

const results = await sendBulkEmails([
  {
    to: 'cliente1@example.com',
    subject: 'Promoción especial',
    html: '<p>Contenido...</p>',
  },
  {
    to: 'cliente2@example.com',
    subject: 'Promoción especial',
    html: '<p>Contenido...</p>',
  },
]);

console.log(`Enviados: ${results.successful}, Fallidos: ${results.failed}`);
```

## Adjuntar archivos

```typescript
await sendEmail({
  to: 'cliente@example.com',
  subject: 'Factura adjunta',
  html: '<p>Adjunto encontrarás tu factura</p>',
  attachments: [
    {
      filename: 'factura.pdf',
      path: '/ruta/a/factura.pdf',
    },
  ],
});
```

## Uso en API Routes

```typescript
// app/api/send-confirmation/route.ts
import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email/examples';

export async function POST(request: Request) {
  try {
    const { email, orderData } = await request.json();

    await sendOrderConfirmationEmail(email, orderData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al enviar email' },
      { status: 500 }
    );
  }
}
```

## Notas Importantes

1. **Contraseña de aplicación**: Asegúrate de usar una contraseña de aplicación de Gmail, no tu contraseña normal.
2. **Límites de Gmail**: Gmail tiene límites de envío (500 emails/día para cuentas gratuitas).
3. **Verificación**: En desarrollo, el sistema verificará la conexión automáticamente.
4. **Seguridad**: Nunca compartas las credenciales de email en el código fuente.

## Troubleshooting

### Error de autenticación

Si recibes errores de autenticación:

1. Verifica que estés usando una contraseña de aplicación de Gmail
2. Asegúrate de que la verificación en 2 pasos esté habilitada
3. Genera una nueva contraseña de aplicación en: https://myaccount.google.com/apppasswords

### Emails no se envían

1. Verifica las variables de entorno
2. Revisa los logs de la consola para errores específicos
3. Confirma que tu cuenta de Gmail no esté bloqueada
