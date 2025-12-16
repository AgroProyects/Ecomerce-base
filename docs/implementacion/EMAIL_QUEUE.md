# Email Queue con BullMQ - Implementación Completa

## 📋 Tabla de Contenidos

1. [Resumen](#resumen)
2. [Arquitectura](#arquitectura)
3. [Tipos de Emails](#tipos-de-emails)
4. [Configuración](#configuración)
5. [Uso](#uso)
6. [Worker](#worker)
7. [Monitoreo](#monitoreo)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## Resumen

Email Queue está completamente implementado usando **BullMQ** con **Upstash Redis** para envío asíncrono de emails con retry automático y priorización.

### ✅ Estado de Implementación

- ✅ **BullMQ + ioredis**: Instalado y configurado
- ✅ **Conexión Redis**: Configurada para Upstash con TLS
- ✅ **Tipos y Schemas**: 8 tipos de emails con validación Zod
- ✅ **Email Queue**: Sistema de cola con prioridades y retry
- ✅ **Email Worker**: Procesador de emails con templates HTML
- ✅ **Migración Completa**: Emails de verificación y pedidos migrados a queue
- ✅ **API de Monitoreo**: Endpoints para stats, pause/resume, clean
- ✅ **Scripts**: npm run worker:email para iniciar worker

### 🎯 Beneficios Clave

1. **Envío Asíncrono**: Los emails no bloquean requests HTTP
2. **Retry Automático**: Hasta 5 intentos con backoff exponencial
3. **Priorización**: Emails críticos (verificación) se procesan primero
4. **Fail-Safe**: Errores capturados en Sentry para revisión
5. **Rate Limiting**: Máximo 10 emails por segundo
6. **Monitoreo**: Dashboard para ver stats de la queue

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION                            │
│  (Next.js API Routes, Server Actions)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   queueVerificationEmail()    │
        │   queueOrderConfirmationEmail()│
        │   queuePaymentConfirmedEmail() │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌─────────────────────────────────┐
        │      Email Queue (BullMQ)        │
        │  - Priority: CRITICAL → LOW      │
        │  - Delay: 0s → 30s               │
        │  - Retry: 2-5 attempts           │
        └───────────┬─────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │    Upstash Redis          │
        │  - Jobs storage           │
        │  - Queue management       │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │    Email Worker              │
        │  - Concurrency: 5            │
        │  - Rate limit: 10/sec        │
        │  - HTML templates            │
        └───────────┬─────────────────┘
                    │
                    ▼
        ┌──────────────────────────────┐
        │    Nodemailer (SMTP)         │
        │  - Gmail/Custom SMTP         │
        │  - Actual email sending      │
        └──────────────────────────────┘
```

### Flujo de un Email

```
1. Application → queueVerificationEmail({ to, userName, url })
2. Queue → Validar con Zod schema
3. Queue → Crear job con prioridad CRITICAL (1)
4. Queue → Guardar en Redis con delay 0ms
5. Worker → Leer job de Redis
6. Worker → Generar HTML del template
7. Worker → Enviar con Nodemailer
8. Worker → Marcar job como completed
   ❌ Si falla → Retry automático (hasta 5 veces)
```

---

## Tipos de Emails

### [lib/queue/types.ts](../../lib/queue/types.ts)

#### 1. VERIFICATION (Prioridad: CRITICAL)

```typescript
await queueVerificationEmail({
  to: 'user@example.com',
  userName: 'Juan',
  verificationUrl: 'https://app.com/auth/confirm?token=xxx',
  expiresIn: '24 horas', // opcional, default: 24 horas
})
```

**Retry**: 5 intentos, exponencial (2s, 4s, 8s, 16s, 32s)
**Delay**: 0ms (inmediato)

---

#### 2. PASSWORD_RESET (Prioridad: CRITICAL)

```typescript
await queuePasswordResetEmail({
  to: 'user@example.com',
  userName: 'Juan',
  resetUrl: 'https://app.com/reset-password?token=xxx',
  expiresIn: '1 hora', // opcional, default: 1 hora
})
```

**Retry**: 5 intentos, exponencial
**Delay**: 0ms

---

#### 3. ORDER_CONFIRMATION (Prioridad: HIGH)

```typescript
await queueOrderConfirmationEmail({
  to: 'user@example.com',
  userName: 'Juan',
  orderNumber: 'ORD-12345',
  orderDate: '15/12/2025',
  items: [
    { name: 'Producto 1', quantity: 2, price: 100 },
    { name: 'Producto 2', quantity: 1, price: 50 },
  ],
  subtotal: 250,
  shipping: 20,
  discount: 10, // opcional
  total: 260,
  trackingUrl: 'https://app.com/track/xxx', // opcional
})
```

**Retry**: 4 intentos, exponencial (3s, 6s, 12s, 24s)
**Delay**: 1s

---

#### 4. ORDER_STATUS (Prioridad: NORMAL)

```typescript
await queueOrderStatusEmail({
  to: 'user@example.com',
  userName: 'Juan',
  orderNumber: 'ORD-12345',
  status: 'shipped', // 'processing' | 'shipped' | 'delivered' | 'cancelled'
  statusMessage: 'Tu pedido está en camino',
  trackingUrl: 'https://app.com/track/xxx', // opcional
})
```

**Retry**: 3 intentos, exponencial (5s, 10s, 20s)
**Delay**: 5s

---

#### 5. PAYMENT_CONFIRMED (Prioridad: HIGH)

```typescript
await queuePaymentConfirmedEmail({
  to: 'user@example.com',
  userName: 'Juan',
  orderNumber: 'ORD-12345',
  amount: 260.0,
  paymentMethod: 'Mercado Pago',
  transactionId: 'MP-123456',
})
```

**Retry**: 4 intentos
**Delay**: 1s

---

#### 6. PAYMENT_FAILED (Prioridad: HIGH)

```typescript
await queuePaymentFailedEmail({
  to: 'user@example.com',
  userName: 'Juan',
  orderNumber: 'ORD-12345',
  amount: 260.0,
  reason: 'Fondos insuficientes',
  retryUrl: 'https://app.com/retry-payment/xxx', // opcional
})
```

**Retry**: 4 intentos
**Delay**: 1s

---

#### 7. WELCOME (Prioridad: NORMAL)

```typescript
await queueWelcomeEmail({
  to: 'user@example.com',
  userName: 'Juan',
  discountCode: 'BIENVENIDO10', // opcional
  discountAmount: 10, // opcional
})
```

**Retry**: 3 intentos
**Delay**: 5s

---

#### 8. PROMOTIONAL (Prioridad: LOW)

```typescript
await addEmailToQueue({
  type: EmailType.PROMOTIONAL,
  to: 'user@example.com',
  subject: 'Oferta especial',
  priority: EmailPriority.LOW,
  data: {
    userName: 'Juan',
    campaignName: 'Black Friday 2025',
    content: '<p>50% de descuento en toda la tienda</p>',
    ctaText: 'Ver ofertas',
    ctaUrl: 'https://app.com/black-friday',
    unsubscribeUrl: 'https://app.com/unsubscribe/xxx',
  },
})
```

**Retry**: 2 intentos, fixed (10s, 10s)
**Delay**: 30s

---

## Configuración

### 1. Variables de Entorno

```env
# Redis (Upstash) - Ya configurado para rate limiting
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Email (Gmail/SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com

# App URL (para links en emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Conexión Redis

[lib/queue/redis-connection.ts](../../lib/queue/redis-connection.ts)

```typescript
import { Redis } from 'ioredis'

export const redisConnection = new Redis({
  host: upstashConfig.host,
  port: upstashConfig.port,
  password: upstashConfig.password,
  maxRetriesPerRequest: null, // Requerido por BullMQ
  enableReadyCheck: false,
  tls: { rejectUnauthorized: false }, // Upstash usa TLS
})
```

⚠️ **Importante**: BullMQ requiere `ioredis`, no `@upstash/redis`

---

## Uso

### En Server Actions

[actions/checkout/process.ts](../../actions/checkout/process.ts)

```typescript
import { queueOrderConfirmationEmail } from '@/lib/queue/email-queue'

export async function processCheckout(data) {
  // ... crear orden

  // Enviar email de confirmación (asíncrono)
  await queueOrderConfirmationEmail({
    to: order.customer_email,
    userName: order.customer_name,
    orderNumber: order.order_number,
    orderDate: new Date().toLocaleDateString('es-AR'),
    items: items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.unit_price,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping_cost,
    discount: order.discount_amount,
    total: order.total,
  })

  return { success: true, order }
}
```

### En API Routes

[app/api/auth/register/route.ts](../../app/api/auth/register/route.ts)

```typescript
import { queueVerificationEmail } from '@/lib/queue/email-queue'

export async function POST(request: Request) {
  // ... crear usuario

  // Enviar email de verificación
  await queueVerificationEmail({
    to: user.email,
    userName: user.name,
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`,
  })

  return NextResponse.json({ success: true })
}
```

---

## Worker

### Iniciar Worker

```bash
# Desarrollo (con auto-reload)
npm run worker:email

# Producción (con PM2)
pm2 start "npm run worker:email" --name email-worker
pm2 save
pm2 startup
```

### Worker Code

[lib/queue/email-worker.ts](../../lib/queue/email-worker.ts)

```typescript
import { Worker } from 'bullmq'
import { redisOptions } from './redis-connection'

export const emailWorker = new Worker('emails', processEmailJob, {
  connection: redisOptions,
  concurrency: 5, // Procesar hasta 5 emails simultáneamente
  limiter: {
    max: 10, // Máximo 10 emails
    duration: 1000, // por segundo (rate limiting)
  },
})
```

### Templates HTML

Cada tipo de email tiene su template HTML en [lib/queue/email-worker.ts:emailTemplates](../../lib/queue/email-worker.ts)

Ejemplo de template de verificación:

```typescript
[EmailType.VERIFICATION]: (data) => `
  <!DOCTYPE html>
  <html>
    <body>
      <h2>¡Hola ${data.data.userName}!</h2>
      <p>Verifica tu email:</p>
      <a href="${data.data.verificationUrl}">Verificar Email</a>
      <p>Expira en ${data.data.expiresIn}</p>
    </body>
  </html>
`
```

---

## Monitoreo

### API Endpoints (Solo Admin)

#### 1. GET /api/admin/queue/stats

Obtiene estadísticas de la queue.

```bash
curl http://localhost:3000/api/admin/queue/stats \
  -H "Cookie: next-auth.session-token=xxx"
```

**Response:**

```json
{
  "queue": "emails",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 123,
    "failed": 3,
    "delayed": 1,
    "total": 134
  },
  "timestamp": "2025-12-15T10:30:00.000Z"
}
```

---

#### 2. POST /api/admin/queue/pause

Pausa la queue (útil para mantenimiento).

```bash
curl -X POST http://localhost:3000/api/admin/queue/pause \
  -H "Cookie: next-auth.session-token=xxx"
```

---

#### 3. DELETE /api/admin/queue/pause

Resume la queue.

```bash
curl -X DELETE http://localhost:3000/api/admin/queue/pause \
  -H "Cookie: next-auth.session-token=xxx"
```

---

#### 4. POST /api/admin/queue/clean

Limpia jobs viejos (completados >24h, fallidos >7d).

```bash
curl -X POST http://localhost:3000/api/admin/queue/clean \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### Logs del Worker

```bash
# Logs en desarrollo
npm run worker:email

# Logs esperados:
✓ BullMQ Redis: Connected
✓ Email worker started
📧 Email queued: verification to user@example.com (Job ID: 1)
⏳ Job 1 is waiting
🔄 Job 1 is active
📧 Processing email: verification to user@example.com
✅ Email sent: verification to user@example.com (Message ID: <xxx@gmail.com>)
✅ Job 1 completed

# En producción (PM2):
pm2 logs email-worker
```

---

### Métricas en Upstash Dashboard

1. **Total Commands**: Ver requests por segundo
2. **Memory Usage**: Uso de memoria Redis
3. **Keys**: Número de jobs en queue
4. **Latency**: Tiempo de respuesta

**Comandos útiles en Redis CLI** (Upstash dashboard):

```bash
# Ver todos los jobs
KEYS bull:emails:*

# Ver jobs waiting
LRANGE bull:emails:wait 0 -1

# Ver jobs active
LRANGE bull:emails:active 0 -1

# Ver jobs failed
LRANGE bull:emails:failed 0 -1

# Ver detalles de un job
GET bull:emails:1
```

---

## Mejores Prácticas

### ✅ DO - Qué Hacer

#### 1. Usar Helpers de Queue

```typescript
// ✅ BIEN - Usar helper
await queueVerificationEmail({
  to: user.email,
  userName: user.name,
  verificationUrl: url,
})

// ❌ MAL - Llamar addEmailToQueue directamente
await addEmailToQueue({
  type: EmailType.VERIFICATION,
  to: user.email,
  subject: '...',
  priority: 1,
  data: { ... }
})
```

#### 2. Manejar Errores de Queue

```typescript
// ✅ BIEN - Catch errors
try {
  await queueOrderConfirmationEmail({ ... })
} catch (error) {
  console.error('Failed to queue email:', error)
  // No bloquear el request por un error de email
  Sentry.captureException(error)
}

// ❌ MAL - Dejar error sin manejar
await queueOrderConfirmationEmail({ ... }) // Puede fallar sin avisar
```

#### 3. Validar Datos Antes de Queue

```typescript
// ✅ BIEN - Validar email
if (!isValidEmail(email)) {
  throw new Error('Email inválido')
}
await queueVerificationEmail({ to: email, ... })

// ❌ MAL - Queue sin validar
await queueVerificationEmail({ to: invalidEmail, ... }) // Fallará en worker
```

#### 4. Usar Prioridades Correctamente

```typescript
// ✅ BIEN - Verificación = CRITICAL
queueVerificationEmail() // Priority: CRITICAL (1)

// ✅ BIEN - Newsletter = LOW
addEmailToQueue({ type: PROMOTIONAL, priority: LOW }) // Priority: 4

// ❌ MAL - Newsletter con prioridad CRITICAL
addEmailToQueue({ type: PROMOTIONAL, priority: CRITICAL })
```

---

### ❌ DON'T - Qué NO Hacer

#### 1. NO Enviar Emails Directamente

```typescript
// ❌ MAL - Envío síncrono (bloquea request)
await transporter.sendMail({ ... })

// ✅ BIEN - Usar queue
await queueVerificationEmail({ ... })
```

#### 2. NO Ignorar Fallas del Worker

```typescript
// ❌ MAL - Worker crashea y no se reinicia
npm run worker:email
// Si crashea → emails no se envían

// ✅ BIEN - Usar PM2 para auto-restart
pm2 start "npm run worker:email" --name email-worker --max-restarts 10
```

#### 3. NO Cachear Emails

```typescript
// ❌ MAL - Cachear emails
await getCachedData('email:verification', () => queueVerificationEmail(...))

// ✅ BIEN - Siempre queue directo
await queueVerificationEmail(...)
```

#### 4. NO Duplicar Jobs

```typescript
// ❌ MAL - Múltiples queues del mismo email
await queueVerificationEmail({ to: 'user@example.com', ... })
await queueVerificationEmail({ to: 'user@example.com', ... }) // Duplicado!

// ✅ BIEN - Verificar si ya existe
const existingJob = await checkIfEmailAlreadyQueued(email)
if (!existingJob) {
  await queueVerificationEmail({ ... })
}
```

---

## Troubleshooting

### Problema: Worker no procesa emails

**Síntomas**: Stats muestra `waiting: 10` pero `active: 0`

**Soluciones**:

```bash
# 1. Verificar que worker esté corriendo
pm2 status
pm2 restart email-worker

# 2. Verificar conexión Redis
curl https://your-instance.upstash.io/ping
# Debe retornar: "PONG"

# 3. Verificar logs del worker
pm2 logs email-worker
# Buscar errores de conexión o autenticación
```

---

### Problema: Emails se envían pero no llegan

**Síntomas**: `✅ Email sent` en logs pero usuario no recibe email

**Soluciones**:

```bash
# 1. Verificar carpeta de spam del usuario

# 2. Verificar credenciales SMTP
# En .env:
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # NO la contraseña normal

# 3. Verificar logs de nodemailer
# Agregar debug en lib/email/client.ts:
transporter: nodemailer.createTransport({
  debug: true,
  logger: true,
})

# 4. Test manual
npm run worker:email
# Luego enviar test email:
curl -X POST http://localhost:3000/api/admin/queue/test-email
```

---

### Problema: Jobs se quedan en "failed"

**Síntomas**: `failed: 20` en stats y creciendo

**Soluciones**:

```bash
# 1. Ver detalles de jobs fallidos
# En Upstash Redis CLI:
LRANGE bull:emails:failed 0 -1

# 2. Ver motivo del error
GET bull:emails:{job-id}
# Buscar campo "stacktrace"

# 3. Limpiar jobs fallidos viejos
curl -X POST http://localhost:3000/api/admin/queue/clean

# 4. Reintentar jobs fallidos manualmente
# (Implementar endpoint custom si es necesario)
```

---

### Problema: Worker consume mucha memoria

**Síntomas**: Worker usa >500MB RAM

**Soluciones**:

```typescript
// 1. Reducir concurrency en email-worker.ts
export const emailWorker = new Worker('emails', processEmailJob, {
  concurrency: 2, // ← Reducir de 5 a 2
})

// 2. Aumentar frecuencia de limpieza
// Ejecutar clean cada hora:
setInterval(cleanEmailQueue, 60 * 60 * 1000)

// 3. Reducir removeOnComplete
defaultJobOptions: {
  removeOnComplete: {
    count: 100, // ← Reducir de 1000 a 100
  }
}
```

---

## Resumen de Archivos

### Core (4 archivos)

- ✅ [lib/queue/redis-connection.ts](../../lib/queue/redis-connection.ts) - Conexión Redis para BullMQ
- ✅ [lib/queue/types.ts](../../lib/queue/types.ts) - Tipos y schemas de emails
- ✅ [lib/queue/email-queue.ts](../../lib/queue/email-queue.ts) - Queue y helpers
- ✅ [lib/queue/email-worker.ts](../../lib/queue/email-worker.ts) - Worker y templates

### Migración (2 archivos)

- ✅ [lib/email/send-verification-email.ts](../../lib/email/send-verification-email.ts) - Migrado a queue
- ✅ [lib/email/send-order-emails.ts](../../lib/email/send-order-emails.ts) - Migrado a queue

### API Monitoreo (3 archivos)

- ✅ [app/api/admin/queue/stats/route.ts](../../app/api/admin/queue/stats/route.ts)
- ✅ [app/api/admin/queue/pause/route.ts](../../app/api/admin/queue/pause/route.ts)
- ✅ [app/api/admin/queue/clean/route.ts](../../app/api/admin/queue/clean/route.ts)

### Scripts (1 archivo)

- ✅ [scripts/start-email-worker.ts](../../scripts/start-email-worker.ts)

---

## Deployment en Producción

### 1. Configurar PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar worker
pm2 start "npm run worker:email" --name email-worker

# Auto-restart en crashes
pm2 save
pm2 startup

# Ver logs
pm2 logs email-worker

# Monitoreo
pm2 monit
```

### 2. Variables de Entorno

Asegurar que todas las variables estén configuradas:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=xxx
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
SENTRY_DSN=https://... # Para capturar errores
```

### 3. Healthcheck

Crear endpoint para verificar que worker esté corriendo:

```typescript
// app/api/health/email-worker/route.ts
export async function GET() {
  const stats = await getEmailQueueStats()
  const isHealthy = stats.active >= 0 && stats.failed < 100
  return NextResponse.json({ healthy: isHealthy, stats })
}
```

---

## Próximos Pasos Recomendados

1. **Dashboard Visual** (Opcional)
   - Instalar Bull Board para UI visual
   - Ver jobs en tiempo real con interfaz gráfica

2. **Scheduled Emails** (Futuro)
   - Emails programados (ej: "enviar mañana a las 9am")
   - Usar delayed jobs con timestamp específico

3. **Email Analytics** (Futuro)
   - Track opens y clicks
   - Integrar con SendGrid/Mailgun para analytics

4. **A/B Testing** (Futuro)
   - Probar diferentes subject lines
   - Medir conversion rates

---

**Implementado**: ✅ 100% Completo
**Producción**: ✅ Listo para deploy
**Performance**: ✅ Rate limiting 10/sec, retry automático

