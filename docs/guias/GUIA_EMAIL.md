# Guía de Uso del Sistema de Email

## Configuración Inicial

### 1. Configurar Gmail para aplicaciones

Para usar Gmail con aplicaciones externas, necesitas crear una contraseña de aplicación:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en 2 pasos (si no la tienes activa)
3. Ve a "Seguridad" > "Verificación en 2 pasos" > "Contraseñas de aplicaciones"
4. Crea una nueva contraseña de aplicación y cópiala

### 2. Variables de Entorno

Ya están configuradas en tu archivo `.env`:

```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="enzopch2022@gmail.com"
MAIL_PASSWORD="aevu nrnk hqbg fmdj"
MAIL_FROM_NAME="Tu Tienda Virtual"
MAIL_FROM_ADDRESS="enzopch2022@gmail.com"
```

## Estructura de Archivos

```
lib/email/
├── client.ts          # Configuración de Nodemailer
├── utils.ts           # Funciones de utilidad
├── templates.ts       # Plantillas HTML de emails
├── examples.ts        # Ejemplos de uso
├── types.ts           # Tipos TypeScript
├── index.ts           # Exportaciones principales
└── README.md          # Documentación detallada
```

## Uso Rápido

### Ejemplo 1: Enviar email de confirmación de pedido

```typescript
// En tu API route o server action
import { sendOrderConfirmationEmail } from '@/lib/email/examples';

export async function POST(request: Request) {
  const { email, order } = await request.json();

  await sendOrderConfirmationEmail(email, {
    orderNumber: order.id,
    customerName: order.customerName,
    items: order.items,
    total: order.total,
    shippingAddress: order.shippingAddress,
  });

  return Response.json({ success: true });
}
```

### Ejemplo 2: Email de bienvenida al registrarse

```typescript
// En tu función de registro
import { sendWelcomeEmail } from '@/lib/email/examples';

async function registerUser(email: string, name: string) {
  // ... crear usuario en la base de datos

  // Enviar email de bienvenida
  await sendWelcomeEmail(email, name);

  return { success: true };
}
```

### Ejemplo 3: Restablecer contraseña

```typescript
// En tu API de reset password
import { sendPasswordResetEmail } from '@/lib/email/examples';

export async function POST(request: Request) {
  const { email } = await request.json();

  // Buscar usuario y generar token
  const user = await findUserByEmail(email);
  const resetToken = generateSecureToken();

  // Guardar token en DB...

  // Enviar email
  await sendPasswordResetEmail(email, user.name, resetToken);

  return Response.json({ success: true });
}
```

## Probar el Sistema

### Opción 1: Usar el endpoint de prueba

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Ve a: http://localhost:3000/api/email/test

3. Verás la documentación del endpoint con ejemplos.

4. Envía una petición POST con uno de los ejemplos:

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "tu-email@gmail.com",
    "data": {
      "customerName": "Tu Nombre"
    }
  }'
```

### Opción 2: Crear una página de prueba

Puedes crear una página simple en `app/test-email/page.tsx`:

```typescript
'use client';

export default function TestEmailPage() {
  const testEmail = async () => {
    const response = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        email: 'tu-email@gmail.com',
        data: { customerName: 'Test User' },
      }),
    });

    const result = await response.json();
    console.log(result);
    alert(result.success ? 'Email enviado!' : 'Error');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Probar Email</h1>
      <button
        onClick={testEmail}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Enviar Email de Prueba
      </button>
    </div>
  );
}
```

## Plantillas Disponibles

1. **Confirmación de Pedido**: Email con detalles completos del pedido
2. **Bienvenida**: Email para nuevos usuarios
3. **Restablecer Contraseña**: Con enlace seguro para reset
4. **Pedido Enviado**: Notificación con tracking

## Personalizar Plantillas

Puedes modificar las plantillas en [lib/email/templates.ts](lib/email/templates.ts) para:

- Cambiar colores y estilos
- Agregar tu logo
- Modificar el contenido
- Agregar secciones nuevas

## Límites y Consideraciones

- **Límite diario de Gmail**: ~500 emails/día para cuentas gratuitas
- **Para producción**: Considera usar un servicio dedicado como:
  - SendGrid
  - AWS SES
  - Resend
  - Postmark

## Solución de Problemas

### Error de autenticación

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solución**: Asegúrate de usar una contraseña de aplicación, no tu contraseña normal de Gmail.

### Email no llega

1. Revisa la carpeta de spam
2. Verifica que el email de destino sea válido
3. Revisa los logs del servidor para errores

### Error de conexión

```
Error: Connection timeout
```

**Solución**: Verifica tu conexión a internet y que el puerto 587 no esté bloqueado por firewall.

## Integración con tu E-commerce

### Al crear un pedido

```typescript
// En tu función de checkout
import { sendOrderConfirmationEmail } from '@/lib/email/examples';

async function createOrder(orderData: OrderData) {
  // 1. Crear el pedido en la base de datos
  const order = await db.orders.create(orderData);

  // 2. Procesar el pago
  const payment = await processPayment(order);

  // 3. Enviar email de confirmación
  if (payment.success) {
    await sendOrderConfirmationEmail(order.customerEmail, {
      orderNumber: order.id,
      customerName: order.customerName,
      items: order.items,
      total: order.total,
      shippingAddress: order.shippingAddress,
    });
  }

  return order;
}
```

### Al enviar un pedido

```typescript
// En tu función de fulfillment
import { sendOrderShippedEmail } from '@/lib/email/examples';

async function shipOrder(orderId: string, trackingNumber: string) {
  // Actualizar estado del pedido
  const order = await db.orders.update(orderId, {
    status: 'shipped',
    trackingNumber,
  });

  // Enviar notificación
  await sendOrderShippedEmail(order.customerEmail, {
    orderNumber: order.id,
    customerName: order.customerName,
    trackingNumber,
    estimatedDelivery: calculateDeliveryDate(order),
  });
}
```

## Siguientes Pasos

1. Prueba el sistema con tu propio email
2. Personaliza las plantillas según tu marca
3. Integra los emails en tus flujos de negocio
4. Considera migrar a un servicio profesional para producción
5. Implementa tracking de emails abiertos (si es necesario)
