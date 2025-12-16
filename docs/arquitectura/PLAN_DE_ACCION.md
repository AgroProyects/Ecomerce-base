# PLAN DE ACCIÓN - E-COMMERCE BASE

**Generado:** 15 de Diciembre, 2025
**Basado en:** [REPORTE_ARQUITECTURA_BACKEND.md](REPORTE_ARQUITECTURA_BACKEND.md)
**Objetivo:** Guía ejecutable paso a paso para implementar las correcciones críticas y mejoras del sistema

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Prioridad P0 - CRÍTICO (Semana 1)](#2-prioridad-p0---crítico-semana-1)
3. [Prioridad P1 - ALTO (Semana 2-3)](#3-prioridad-p1---alto-semana-2-3)
4. [Prioridad P2 - MEDIO (Mes 1)](#4-prioridad-p2---medio-mes-1)
5. [Prioridad P3 - BAJO (Backlog)](#5-prioridad-p3---bajo-backlog)
6. [Checklist de Validación](#6-checklist-de-validación)

---

## 1. RESUMEN EJECUTIVO

### Estado Actual
- **Calificación:** 7/10 (Producción con reservas)
- **Blockers:** 4 issues críticos que impiden producción segura
- **Riesgos de seguridad:** 14 vulnerabilidades detectadas
- **Performance:** Problemas de N+1 queries y falta de caching

### Priorización de Tareas

| Prioridad | Tareas | Tiempo Estimado | Impacto |
|-----------|--------|-----------------|---------|
| **P0 - CRÍTICO** | 4 tareas | 1 semana | Blocker para producción |
| **P1 - ALTO** | 6 tareas | 2-3 semanas | Alta seguridad y performance |
| **P2 - MEDIO** | 5 tareas | 1 mes | Mejoras operativas |
| **P3 - BAJO** | 5 tareas | Backlog | Nice to have |

### Roadmap General

```
Semana 1 (P0)     Semana 2-3 (P1)    Mes 1 (P2)         Backlog (P3)
├─ Rate Limiting  ├─ Redis Cache     ├─ DB Optimization ├─ Testing
├─ Webhook Verify ├─ Email Queue     ├─ Logging         ├─ CI/CD
├─ Error Monitor  ├─ Stock Reserve   ├─ OpenAPI Docs    ├─ Load Test
└─ CSRF Token     └─ Transactions    └─ Password Policy └─ DR Plan
```

---

## 2. PRIORIDAD P0 - CRÍTICO (Semana 1)

### TAREA 1: Implementar Rate Limiting

**BLOCKER:** Sin protección contra fuerza bruta, DDoS y spam
**Tiempo estimado:** 4-6 horas
**Archivos afectados:** 6+ API routes

#### Paso 1: Instalar Dependencias

```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Paso 2: Crear Cuenta en Upstash

1. Ir a [https://upstash.com](https://upstash.com)
2. Crear cuenta gratuita
3. Crear Redis database
4. Copiar credenciales:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

#### Paso 3: Agregar Variables de Entorno

Archivo: `.env.local`

```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxx
```

#### Paso 4: Crear Utilitario de Rate Limit

Archivo: `lib/middleware/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = {
  // Rutas de autenticación: 5 requests cada 10 segundos
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 s'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // APIs generales: 20 requests cada 10 segundos
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 s'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Checkout: 3 requests cada 60 segundos (evitar múltiples compras)
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 s'),
    analytics: true,
    prefix: 'ratelimit:checkout',
  }),

  // Validación de cupones: 10 requests cada 60 segundos
  coupon: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:coupon',
  }),

  // Envío de emails: 2 requests cada 60 segundos
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '60 s'),
    analytics: true,
    prefix: 'ratelimit:email',
  }),
}

// Helper para obtener identificador único (IP o user ID)
export function getIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `ip:${ip}`
}
```

#### Paso 5: Aplicar Rate Limiting en Rutas Críticas

**Archivo: `app/api/auth/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // 1. Aplicar rate limiting
  const identifier = getIdentifier(request)
  const { success, limit, reset, remaining } = await ratelimit.auth.limit(identifier)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }

  // 2. Continuar con la lógica normal
  const body = await request.json()
  // ... resto del código
}
```

**Aplicar en estos archivos:**

1. ✅ `app/api/auth/register/route.ts` → `ratelimit.auth`
2. ✅ `app/api/auth/[...nextauth]/route.ts` → `ratelimit.auth`
3. ✅ `app/api/checkout/process-payment/route.ts` → `ratelimit.checkout`
4. ✅ `app/api/coupons/validate/route.ts` → `ratelimit.coupon`
5. ✅ `app/api/email/send-test/route.ts` → `ratelimit.email`
6. ✅ `app/api/email/send-verification-test/route.ts` → `ratelimit.email`

#### Paso 6: Testing

```bash
# Test manual con curl
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123456"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Deberías ver:
# 1-5: Status 200 o 400 (normal)
# 6+: Status 429 (rate limited)
```

#### Criterios de Éxito
- [ ] Rate limiting activo en todas las rutas críticas
- [ ] Respuestas 429 con headers correctos
- [ ] Dashboard de Upstash muestra analytics
- [ ] No afecta a usuarios legítimos

---

### TAREA 2: Verificar Firma de Webhooks de Mercado Pago

**BLOCKER:** Cualquiera puede enviar webhooks falsos y modificar órdenes
**Tiempo estimado:** 3-4 horas
**Archivos afectados:** 2 archivos

#### Paso 1: Obtener Secret de Mercado Pago

1. Ir a [https://www.mercadopago.com.uy/developers](https://www.mercadopago.com.uy/developers)
2. Tu aplicación → Webhooks
3. Copiar el **Secret** que aparece en la configuración

#### Paso 2: Agregar Secret a Variables de Entorno

Archivo: `.env.local`

```env
MP_WEBHOOK_SECRET=tu_secret_aqui
```

#### Paso 3: Crear Función de Verificación

Archivo: `lib/mercadopago/verify-webhook.ts`

```typescript
import crypto from 'crypto'

export interface WebhookHeaders {
  xSignature: string | null
  xRequestId: string | null
}

export function verifyMercadoPagoWebhook(
  request: Request,
  dataId: string
): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  // Validar que existan headers requeridos
  if (!xSignature || !xRequestId) {
    console.error('Missing required webhook headers', {
      hasXSignature: !!xSignature,
      hasXRequestId: !!xRequestId
    })
    return false
  }

  // Parsear x-signature header
  // Formato: ts=1234567890,v1=hash_value
  const parts = xSignature.split(',')
  let ts: string | undefined
  let hash: string | undefined

  parts.forEach(part => {
    const [key, value] = part.split('=')
    if (key && value) {
      if (key.trim() === 'ts') ts = value.trim()
      if (key.trim() === 'v1') hash = value.trim()
    }
  })

  if (!ts || !hash) {
    console.error('Invalid x-signature format', { xSignature })
    return false
  }

  // Validar timestamp (no más de 5 minutos de diferencia)
  const requestTime = parseInt(ts, 10)
  const currentTime = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTime - requestTime)

  if (timeDiff > 300) { // 5 minutos
    console.error('Webhook timestamp too old', {
      requestTime,
      currentTime,
      diffSeconds: timeDiff
    })
    return false
  }

  // Crear manifest string según documentación de MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // Calcular HMAC SHA256
  const secret = process.env.MP_WEBHOOK_SECRET

  if (!secret) {
    console.error('MP_WEBHOOK_SECRET not configured')
    return false
  }

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const calculatedHash = hmac.digest('hex')

  // Comparar hashes
  const isValid = calculatedHash === hash

  if (!isValid) {
    console.error('Webhook signature verification failed', {
      expected: calculatedHash,
      received: hash,
      manifest
    })
  }

  return isValid
}
```

#### Paso 4: Aplicar Verificación en Webhook Route

Archivo: `app/api/webhooks/mercadopago/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyMercadoPagoWebhook } from '@/lib/mercadopago/verify-webhook'
import { processPaymentWebhook } from '@/lib/mercadopago/webhooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. VERIFICAR FIRMA (CRÍTICO)
    const dataId = body.data?.id

    if (!dataId) {
      console.error('Missing data.id in webhook payload')
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const isValid = verifyMercadoPagoWebhook(request, dataId)

    if (!isValid) {
      console.error('Webhook signature verification failed', {
        dataId,
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id')
      })

      // IMPORTANTE: Retornar 401 pero no revelar detalles
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Validar tipo de notificación
    if (body.type !== 'payment') {
      console.log('Received non-payment webhook', { type: body.type })
      return NextResponse.json({ received: true })
    }

    // 3. Procesar webhook
    const paymentId = body.data.id
    console.log('Processing payment webhook', { paymentId })

    const result = await processPaymentWebhook(paymentId)

    // 4. Siempre retornar 200 (MP reintenta si no es 200)
    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      status: result.status,
    })

  } catch (error) {
    console.error('Error processing webhook:', error)

    // Retornar 200 para evitar reintentos infinitos de MP
    return NextResponse.json({
      received: true,
      error: 'Internal error'
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Mercado Pago webhook endpoint is active'
  })
}
```

#### Paso 5: Testing

**Test con webhook real de Mercado Pago:**

1. Crear test payment en MP Dashboard
2. Verificar logs en tu aplicación
3. Confirmar que la firma se valida correctamente

**Test de seguridad (intentar enviar webhook falso):**

```bash
# Sin headers de firma (debería fallar)
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'

# Debería retornar: 401 Unauthorized
```

#### Criterios de Éxito
- [ ] Webhooks sin firma son rechazados (401)
- [ ] Webhooks con firma inválida son rechazados
- [ ] Webhooks válidos de MP son procesados correctamente
- [ ] Logs muestran detalles de verificación

---

### TAREA 3: Implementar Error Monitoring con Sentry

**BLOCKER:** Errores en producción no detectados hasta que usuarios reportan
**Tiempo estimado:** 2-3 horas
**Archivos afectados:** 3 archivos de configuración

#### Paso 1: Crear Cuenta en Sentry

1. Ir a [https://sentry.io](https://sentry.io)
2. Crear cuenta gratuita
3. Crear nuevo proyecto Next.js
4. Copiar DSN

#### Paso 2: Instalar Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

El wizard automáticamente:
- Instala `@sentry/nextjs`
- Crea archivos de configuración
- Agrega variable `SENTRY_DSN` a `.env.local`

#### Paso 3: Configurar Sentry para Server

Archivo: `sentry.server.config.ts` (creado por wizard)

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Sampling de trazas (10% de requests)
  tracesSampleRate: 0.1,

  // Entorno
  environment: process.env.NODE_ENV,

  // Ignorar errores esperados
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
  ],

  // Configuración adicional
  beforeSend(event, hint) {
    // No enviar errores locales
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Sanitizar datos sensibles
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }

    return event
  },
})
```

#### Paso 4: Configurar Sentry para Client

Archivo: `sentry.client.config.ts` (creado por wizard)

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sampling
  tracesSampleRate: 0.1,

  // Session Replay (para debugging visual)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay error

  // Integraciones
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

#### Paso 5: Usar Sentry en API Routes

**Ejemplo en `app/api/checkout/process-payment/route.ts`:**

```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    // ... lógica de checkout

  } catch (error) {
    // Capturar error en Sentry con contexto
    Sentry.captureException(error, {
      tags: {
        module: 'checkout',
        endpoint: '/api/checkout/process-payment'
      },
      extra: {
        // Agregar contexto relevante (sin datos sensibles)
        hasBody: !!body,
        // No incluir detalles de tarjetas o datos personales
      },
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : undefined
    })

    return NextResponse.json(
      { error: 'Error procesando el pago' },
      { status: 500 }
    )
  }
}
```

#### Paso 6: Usar Sentry en Server Actions

**Ejemplo en `actions/orders/mutations.ts`:**

```typescript
'use server'

import * as Sentry from '@sentry/nextjs'

export async function createOrder(input: CreateOrderInput) {
  try {
    // ... lógica de crear orden

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        module: 'orders',
        action: 'createOrder'
      },
      extra: {
        orderItemsCount: input.items.length,
        totalAmount: input.total
      }
    })

    throw error
  }
}
```

#### Paso 7: Variables de Entorno

Archivo: `.env.local`

```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=tu_auth_token_aqui
```

Archivo: `.env.production`

```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Paso 8: Testing

**Test manual:**

```typescript
// En cualquier API route
import * as Sentry from '@sentry/nextjs'

// Forzar un error de prueba
Sentry.captureMessage('Test error from API', 'error')

// O capturar exception
try {
  throw new Error('Test exception')
} catch (e) {
  Sentry.captureException(e)
}
```

Verificar en Sentry Dashboard que el error aparece.

#### Criterios de Éxito
- [ ] Errores aparecen en Sentry Dashboard
- [ ] Contexto útil (tags, extra data) está presente
- [ ] No se envían datos sensibles (tarjetas, passwords)
- [ ] Alertas configuradas para errores críticos

---

### TAREA 4: Implementar CSRF Protection

**BLOCKER:** APIs vulnerables a ataques cross-site
**Tiempo estimado:** 2-3 horas
**Archivos afectados:** Middleware + API routes con mutaciones

#### Paso 1: NextAuth CSRF Token (Ya Incluido)

NextAuth v5 incluye protección CSRF automática. Verificar que esté configurado:

Archivo: `lib/auth/config.ts`

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  // CSRF protection está activo por defecto
  // No es necesario configuración adicional

  providers: [/* ... */],
  callbacks: {/* ... */}
})
```

#### Paso 2: Proteger API Routes con Session Validation

Para APIs que modifican datos, validar sesión:

**Archivo: `app/api/admin/products/route.ts`**

```typescript
import { auth } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  // Validar sesión
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Validar rol admin
  if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // ... continuar con lógica
}
```

#### Paso 3: Verificar Origin Header en Webhooks

Archivo: `app/api/webhooks/mercadopago/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // Verificar que viene de Mercado Pago
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  // MP no envía origin, pero user-agent debe contener "MercadoPago"
  if (userAgent && !userAgent.includes('MercadoPago')) {
    console.warn('Suspicious webhook attempt', { userAgent, origin })
    // Continuar pero loggear (MP puede cambiar user-agent)
  }

  // Verificación de firma es más importante
  // ... resto del código
}
```

#### Paso 4: SameSite Cookie Configuration

Archivo: `lib/auth/config.ts`

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [/* ... */],

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Protege contra CSRF
        path: '/',
        secure: process.env.NODE_ENV === 'production' // HTTPS en prod
      }
    }
  },

  callbacks: {/* ... */}
})
```

#### Criterios de Éxito
- [ ] Todas las rutas de mutación validan sesión
- [ ] Cookies configuradas con SameSite
- [ ] NextAuth CSRF protection activo
- [ ] Webhooks verifican origen cuando sea posible

---

## 3. PRIORIDAD P1 - ALTO (Semana 2-3)

### TAREA 5: Implementar Caching con Redis

**PROBLEMA:** Queries repetitivos sin caché causan latencia
**Tiempo estimado:** 6-8 horas

#### Paso 1: Configurar Redis (usar misma instancia de Upstash)

Ya tienes Upstash configurado para rate limiting, usar la misma instancia para cache.

#### Paso 2: Crear Utilidad de Cache

Archivo: `lib/cache/redis.ts`

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutos default
): Promise<T> {
  try {
    // Intentar obtener de cache
    const cached = await redis.get<T>(key)

    if (cached !== null) {
      console.log(`Cache HIT: ${key}`)
      return cached
    }

    console.log(`Cache MISS: ${key}`)

    // Si no existe, ejecutar fetcher
    const fresh = await fetcher()

    // Guardar en cache
    await redis.setex(key, ttl, JSON.stringify(fresh))

    return fresh
  } catch (error) {
    console.error('Cache error:', error)
    // Si falla el cache, ejecutar fetcher directamente
    return fetcher()
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`)
    }
  } catch (error) {
    console.error('Error invalidating cache:', error)
  }
}

export async function invalidateCacheKey(key: string) {
  try {
    await redis.del(key)
    console.log(`Invalidated cache key: ${key}`)
  } catch (error) {
    console.error('Error invalidating cache key:', error)
  }
}
```

#### Paso 3: Aplicar Cache a Queries de Productos

Archivo: `actions/products/queries.ts`

```typescript
'use server'

import { getCachedData, invalidateCache } from '@/lib/cache/redis'

export async function getProducts(params: ProductsQueryParams) {
  // Crear cache key único basado en parámetros
  const cacheKey = `products:${JSON.stringify(params)}`

  return getCachedData(
    cacheKey,
    async () => {
      // Lógica original de query
      const supabase = await createClient()

      let query = supabase
        .from('products')
        .select('*, categories(name, slug)', { count: 'exact' })

      // Aplicar filtros
      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive)
      }

      if (params.categoryId) {
        query = query.eq('category_id', params.categoryId)
      }

      if (params.search) {
        query = query.or(
          `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
        )
      }

      // Paginación
      const from = (params.page - 1) * params.pageSize
      const to = from + params.pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data,
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / params.pageSize)
        }
      }
    },
    300 // 5 minutos
  )
}
```

#### Paso 4: Invalidar Cache al Modificar Productos

Archivo: `actions/products/create.ts`

```typescript
'use server'

import { invalidateCache } from '@/lib/cache/redis'

export async function createProduct(input: CreateProductInput) {
  // ... crear producto

  const result = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()

  // Invalidar cache de productos
  await invalidateCache('products:*')

  return { success: true, data: result.data }
}
```

Aplicar lo mismo en:
- `actions/products/update.ts`
- `actions/products/delete.ts`
- `actions/products/status.ts`

#### Paso 5: Aplicar Cache a Categorías

Archivo: `actions/categories/queries.ts`

```typescript
'use server'

import { getCachedData } from '@/lib/cache/redis'

export async function getCategories() {
  return getCachedData(
    'categories:all',
    async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return data
    },
    900 // 15 minutos (categorías cambian poco)
  )
}
```

#### Paso 6: Aplicar Cache a Store Settings

Archivo: `actions/settings/queries.ts`

```typescript
'use server'

import { getCachedData } from '@/lib/cache/redis'

export async function getStoreSettings() {
  return getCachedData(
    'store:settings',
    async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single()

      if (error) throw error

      return data
    },
    1800 // 30 minutos (settings cambian raramente)
  )
}
```

#### Criterios de Éxito
- [ ] Productos, categorías y settings cacheados
- [ ] Cache se invalida correctamente al modificar
- [ ] Logs muestran HIT/MISS de cache
- [ ] Latencia reducida en 50-70%

---

### TAREA 6: Implementar Email Queue

**PROBLEMA:** Emails sincrónicos bloquean respuesta al usuario
**Tiempo estimado:** 4-6 horas

#### Paso 1: Instalar Inngest

```bash
npm install inngest
```

#### Paso 2: Configurar Inngest

Archivo: `lib/email/queue.ts`

```typescript
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  name: 'E-commerce',
  eventKey: process.env.INNGEST_EVENT_KEY
})

// Tipo de eventos de email
export interface EmailEvent {
  name: 'email/send'
  data: {
    to: string
    subject: string
    html: string
    type?: 'verification' | 'order-confirmation' | 'password-reset'
  }
}
```

#### Paso 3: Crear Función de Email

Archivo: `lib/email/functions.ts`

```typescript
import { inngest } from './queue'
import { sendEmail } from './send-email'

export const sendEmailJob = inngest.createFunction(
  {
    name: 'Send Email',
    retries: 3 // Reintentar hasta 3 veces si falla
  },
  { event: 'email/send' },
  async ({ event, step }) => {
    return await step.run('send-email', async () => {
      console.log('Sending email', {
        to: event.data.to,
        subject: event.data.subject,
        type: event.data.type
      })

      const result = await sendEmail({
        to: event.data.to,
        subject: event.data.subject,
        html: event.data.html,
      })

      console.log('Email sent successfully', {
        to: event.data.to,
        messageId: result.messageId
      })

      return result
    })
  }
)
```

#### Paso 4: Crear API Route para Inngest

Archivo: `app/api/inngest/route.ts`

```typescript
import { serve } from 'inngest/next'
import { inngest } from '@/lib/email/queue'
import { sendEmailJob } from '@/lib/email/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailJob,
  ],
})
```

#### Paso 5: Usar Queue en Registro

Archivo: `app/api/auth/register/route.ts`

```typescript
import { inngest } from '@/lib/email/queue'
import { render } from '@react-email/render'
import EmailVerification from '@/lib/email/templates/email-verification'

export async function POST(request: NextRequest) {
  // ... crear usuario y token

  // Preparar email
  const verificationUrl = `${baseUrl}/auth/confirm?token=${token}`
  const html = await render(
    EmailVerification({
      name: userData.name,
      verificationUrl
    })
  )

  // Enviar a queue (NO BLOQUEANTE)
  await inngest.send({
    name: 'email/send',
    data: {
      to: userData.email,
      subject: 'Confirma tu email - E-commerce',
      html,
      type: 'verification'
    },
  })

  // Retornar inmediatamente al usuario
  return NextResponse.json({
    success: true,
    message: 'Cuenta creada. Revisa tu email para verificar.',
    userId: authData.user.id
  })
}
```

#### Paso 6: Aplicar en Confirmación de Orden

Archivo: `lib/mercadopago/webhooks.ts`

```typescript
import { inngest } from '@/lib/email/queue'
import { render } from '@react-email/render'
import OrderConfirmation from '@/lib/email/templates/order-confirmation'

export async function processPaymentWebhook(paymentId: string) {
  // ... actualizar orden

  if (payment.status === 'approved') {
    // Obtener datos de la orden
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    // Enviar email de confirmación (asíncrono)
    const html = await render(
      OrderConfirmation({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        items: order.order_items,
        total: order.total
      })
    )

    await inngest.send({
      name: 'email/send',
      data: {
        to: order.customer_email,
        subject: `Orden #${order.order_number} confirmada`,
        html,
        type: 'order-confirmation'
      },
    })
  }

  return { orderId, status: payment.status }
}
```

#### Paso 7: Configurar Variables de Entorno

Archivo: `.env.local`

```env
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=tu_signing_key_dev
```

Archivo: `.env.production`

```env
INNGEST_EVENT_KEY=prod_xxxxx
INNGEST_SIGNING_KEY=tu_signing_key_prod
```

#### Paso 8: Deploy Inngest (Producción)

1. Crear cuenta en [https://inngest.com](https://inngest.com)
2. Crear app
3. Copiar Event Key y Signing Key
4. Agregar a variables de entorno de Vercel

#### Criterios de Éxito
- [ ] Emails se envían en background
- [ ] Respuestas API son inmediatas (no bloquean)
- [ ] Reintentos automáticos funcionan
- [ ] Dashboard de Inngest muestra jobs ejecutados

---

### TAREA 7: Activar Sistema de Reservas de Stock

**PROBLEMA:** Race conditions causan sobreventa
**Tiempo estimado:** 4-6 horas

#### Paso 1: Verificar Función SQL Existe

Archivo: `supabase/migrations/xxx_stock_reservations.sql`

Verificar que existe la función `reserve_stock`. Si no existe, crearla:

```sql
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER,
  p_cart_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock INTEGER;
  v_current_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  -- Obtener stock actual
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_current_stock
    FROM product_variants
    WHERE id = p_variant_id;
  ELSE
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id;
  END IF;

  -- Calcular stock reservado activo
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND status = 'active'
    AND expires_at > NOW();

  -- Calcular stock disponible
  v_available_stock := v_current_stock - v_reserved_stock;

  -- Verificar si hay suficiente stock
  IF v_available_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Crear reserva
  INSERT INTO stock_reservations (
    product_id,
    variant_id,
    quantity,
    cart_id,
    session_id,
    expires_at,
    status
  ) VALUES (
    p_product_id,
    p_variant_id,
    p_quantity,
    p_cart_id,
    p_session_id,
    NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
    'active'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### Paso 2: Modificar Proceso de Checkout

Archivo: `actions/checkout/process.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function processCheckout(input: ProcessCheckoutInput) {
  const supabase = await createClient()

  // 1. Validar input con Zod
  const validationResult = processCheckoutSchema.safeParse(input)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0].message
    }
  }

  const { items, customer, shipping, paymentMethod, couponCode } = validationResult.data

  // 2. RESERVAR STOCK ANTES DE CREAR ORDEN (CRÍTICO)
  const reservations: Array<{productId: string, variantId?: string}> = []

  for (const item of items) {
    const { data: reserved, error } = await supabase.rpc('reserve_stock', {
      p_product_id: item.productId,
      p_variant_id: item.variantId || null,
      p_quantity: item.quantity,
      p_session_id: input.sessionId,
      p_duration_minutes: 15 // Expira en 15 minutos
    })

    if (error || !reserved) {
      // Si falla alguna reserva, liberar las anteriores
      await releaseReservations(reservations, input.sessionId)

      return {
        success: false,
        error: `Stock insuficiente para ${item.product.name}`
      }
    }

    reservations.push({
      productId: item.productId,
      variantId: item.variantId
    })
  }

  // 3. Calcular totales
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

  // 4. Validar y aplicar cupón
  let discount = 0
  let couponId: string | undefined

  if (couponCode) {
    const { data: couponValidation } = await supabase.rpc('validate_coupon', {
      p_code: couponCode,
      p_email: customer.email,
      p_subtotal: subtotal
    })

    if (couponValidation) {
      couponId = couponValidation.coupon_id
      discount = couponValidation.discount_amount
    }
  }

  // 5. Calcular shipping
  const { data: shippingData } = await supabase
    .from('shipping_costs')
    .select('cost')
    .eq('department', shipping.department)
    .eq('is_active', true)
    .single()

  const shippingCost = shippingData?.cost || 0

  const total = subtotal - discount + shippingCost

  // 6. Generar order number
  const { data: orderNumber } = await supabase.rpc('generate_order_number')

  // 7. Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      shipping_address: shipping,
      subtotal,
      discount,
      shipping_cost: shippingCost,
      total,
      coupon_id: couponId,
      status: 'pending',
      payment_method: paymentMethod
    })
    .select()
    .single()

  if (orderError) {
    await releaseReservations(reservations, input.sessionId)
    return { success: false, error: 'Error creando la orden' }
  }

  // 8. Crear order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    product_name: item.product.name,
    variant_name: item.variant?.name
  }))

  await supabase.from('order_items').insert(orderItems)

  // 9. ASOCIAR RESERVAS A LA ORDEN
  await supabase
    .from('stock_reservations')
    .update({ order_id: order.id })
    .eq('session_id', input.sessionId)
    .eq('status', 'active')

  // 10. Procesar según método de pago
  if (paymentMethod === 'mercadopago') {
    const preference = await createPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      items,
      customer,
      shippingCost,
      total
    })

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        preferenceId: preference.id,
        initPoint: preference.initPoint
      }
    }
  }

  // Para otros métodos, marcar como pending_payment
  return {
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.order_number
    }
  }
}

// Helper para liberar reservas si algo falla
async function releaseReservations(
  reservations: Array<{productId: string, variantId?: string}>,
  sessionId: string
) {
  const supabase = await createClient()

  await supabase
    .from('stock_reservations')
    .update({ status: 'released' })
    .eq('session_id', sessionId)
    .eq('status', 'active')
}
```

#### Paso 3: Convertir Reservas al Confirmar Pago

Archivo: `lib/mercadopago/webhooks.ts`

```typescript
export async function processPaymentWebhook(paymentId: string) {
  // ... obtener pago de MP

  if (payment.status === 'approved') {
    // Convertir reservas a ventas confirmadas
    await supabase
      .from('stock_reservations')
      .update({ status: 'converted' })
      .eq('order_id', orderId)
      .eq('status', 'active')

    // Decrementar stock real
    const { data: order } = await supabase
      .from('orders')
      .select('order_items(*)')
      .eq('id', orderId)
      .single()

    for (const item of order.order_items) {
      if (item.variant_id) {
        await supabase.rpc('decrement_variant_stock', {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity
        })
      } else {
        await supabase.rpc('decrement_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        })
      }
    }
  }

  // ... resto del código
}
```

#### Paso 4: Cleanup de Reservas Expiradas (Cron Job)

Archivo: `app/api/cron/cleanup-reservations/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Liberar reservas expiradas
  const { data, error } = await supabase
    .from('stock_reservations')
    .update({ status: 'released' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select()

  if (error) {
    console.error('Error releasing expired reservations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`Released ${data.length} expired reservations`)

  return NextResponse.json({
    success: true,
    released: data.length
  })
}
```

Configurar en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-reservations",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Criterios de Éxito
- [ ] Stock se reserva antes de crear orden
- [ ] Reservas se convierten al confirmar pago
- [ ] Reservas expiradas se liberan automáticamente
- [ ] No hay sobreventa en pruebas de concurrencia

---

## 4. PRIORIDAD P2 - MEDIO (Mes 1)

### TAREA 8: Optimización de Base de Datos

**Tiempo estimado:** 3-4 horas

#### Crear Índices Faltantes

Archivo: `supabase/migrations/xxx_add_missing_indexes.sql`

```sql
-- Índice compuesto para órdenes por cliente y estado
CREATE INDEX IF NOT EXISTS idx_orders_customer_status_date
  ON orders(customer_email, status, created_at DESC);

-- Índice para productos por categoría y precio
CREATE INDEX IF NOT EXISTS idx_products_category_price_active
  ON products(category_id, price)
  WHERE is_active = true;

-- Índice para reviews aprobados por producto
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON product_reviews(product_id, rating, created_at DESC)
  WHERE status = 'approved';

-- Índice para cupones activos
CREATE INDEX IF NOT EXISTS idx_coupons_active_expires
  ON coupons(code, is_active, expires_at)
  WHERE is_active = true;

-- Índice para búsqueda de usuarios por email
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- Índice para order_items por producto
CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON order_items(product_id);

-- Analyze tables para actualizar estadísticas
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE product_reviews;
ANALYZE coupons;
```

#### Criterios de Éxito
- [ ] Índices creados correctamente
- [ ] Queries lentos mejoran en velocidad
- [ ] EXPLAIN ANALYZE muestra uso de índices

---

### TAREA 9: Logging Estructurado con Pino

**Tiempo estimado:** 2-3 horas

#### Paso 1: Instalar Pino

```bash
npm install pino pino-pretty
```

#### Paso 2: Configurar Logger

Archivo: `lib/logger/index.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  formatters: {
    level: (label) => {
      return { level: label }
    },
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
})
```

#### Paso 3: Usar en APIs

```typescript
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  logger.info({
    module: 'checkout',
    endpoint: '/api/checkout/process'
  }, 'Processing checkout request')

  try {
    // ... lógica

    logger.info({
      module: 'checkout',
      orderId,
      total,
      items: items.length
    }, 'Order created successfully')

  } catch (error) {
    logger.error({
      module: 'checkout',
      error: error.message,
      stack: error.stack
    }, 'Failed to process checkout')
  }
}
```

---

### TAREA 10: Mejorar Password Policy

**Tiempo estimado:** 1-2 horas

#### Actualizar Validación

Archivo: `lib/validations/auth.ts`

```typescript
import { z } from 'zod'

export const passwordSchema = z.string()
  .min(10, 'La contraseña debe tener mínimo 10 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo especial (!@#$%^&*)')

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})
```

---

## 5. PRIORIDAD P3 - BAJO (Backlog)

### Tareas para Backlog

1. **Tests Automatizados**
   - Unit tests con Jest
   - Integration tests con Testing Library
   - E2E tests con Playwright

2. **CI/CD Pipeline**
   - GitHub Actions
   - Automated testing
   - Deployment automation

3. **Load Testing**
   - k6 scripts
   - Performance benchmarks
   - Stress testing

4. **Documentación OpenAPI**
   - API docs completos
   - Swagger UI
   - SDK generation

5. **Disaster Recovery**
   - Backup automatizado
   - Recovery procedures
   - Runbooks

---

## 6. CHECKLIST DE VALIDACIÓN

### P0 - CRÍTICO ✅

- [ ] **Rate Limiting**
  - [ ] Upstash configurado
  - [ ] 6+ API routes protegidos
  - [ ] Tests manuales pasados
  - [ ] Dashboard muestra analytics

- [ ] **Webhook Verification**
  - [ ] MP_WEBHOOK_SECRET configurado
  - [ ] Firma se verifica correctamente
  - [ ] Webhooks falsos rechazados
  - [ ] Logs detallados

- [ ] **Error Monitoring**
  - [ ] Sentry configurado
  - [ ] Errores capturados
  - [ ] Contexto útil agregado
  - [ ] Alertas configuradas

- [ ] **CSRF Protection**
  - [ ] NextAuth CSRF activo
  - [ ] APIs validan sesión
  - [ ] Cookies con SameSite

### P1 - ALTO ✅

- [ ] **Redis Cache**
  - [ ] Cache implementado
  - [ ] Invalidación funciona
  - [ ] HIT/MISS loggeado
  - [ ] Latencia reducida

- [ ] **Email Queue**
  - [ ] Inngest configurado
  - [ ] Emails asíncronos
  - [ ] Reintentos funcionan
  - [ ] Dashboard activo

- [ ] **Stock Reservations**
  - [ ] Reservas antes de orden
  - [ ] Conversión al pagar
  - [ ] Cleanup automático
  - [ ] Sin sobreventa

### P2 - MEDIO ✅

- [ ] **DB Optimization**
  - [ ] Índices creados
  - [ ] Queries optimizados
  - [ ] ANALYZE ejecutado

- [ ] **Logging**
  - [ ] Pino configurado
  - [ ] Logs estructurados
  - [ ] Consultables

- [ ] **Password Policy**
  - [ ] Validación mejorada
  - [ ] Min 10 caracteres
  - [ ] Complejidad requerida

---

## CONCLUSIÓN

Este plan de acción prioriza las tareas críticas que bloquean el deploy a producción segura, seguidas de mejoras de alto impacto en performance y seguridad.

**Tiempo total estimado:**
- **P0 (Semana 1):** 11-16 horas
- **P1 (Semana 2-3):** 14-20 horas
- **P2 (Mes 1):** 6-9 horas
- **Total:** 31-45 horas de desarrollo

Seguir este plan asegura que el e-commerce esté listo para producción con seguridad y performance adecuados.

---

**Generado:** 15 de Diciembre, 2025
**Autor:** Claude Sonnet 4.5
**Versión:** 1.0
