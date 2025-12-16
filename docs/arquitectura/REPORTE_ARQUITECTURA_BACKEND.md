# REPORTE COMPLETO: ARQUITECTURA BACKEND E-COMMERCE

**Fecha de Analisis:** 13 de Diciembre, 2025
**Proyecto:** E-commerce Base con Next.js 16, Supabase y Mercado Pago
**Stack:** Next.js 16, TypeScript, Supabase, PostgreSQL, Mercado Pago

---

## INDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura de Base de Datos](#2-arquitectura-de-base-de-datos)
3. [APIs y Rutas](#3-apis-y-rutas)
4. [Server Actions](#4-server-actions)
5. [Integraciones Externas](#5-integraciones-externas)
6. [Seguridad y Autenticacion](#6-seguridad-y-autenticacion)
7. [Analisis de Performance](#7-analisis-de-performance)
8. [Puntos Debiles y Riesgos](#8-puntos-debiles-y-riesgos)
9. [Mejoras Recomendadas](#9-mejoras-recomendadas)
10. [Diagrama de Arquitectura](#10-diagrama-de-arquitectura)

---

## 1. RESUMEN EJECUTIVO

### Stack Tecnologico

```
Frontend:  Next.js 16 (React 19) + TypeScript
Backend:   Next.js API Routes + Server Actions
Database:  Supabase (PostgreSQL)
Auth:      NextAuth v5 + Supabase Auth
Payments:  Mercado Pago API
Email:     Nodemailer (SMTP) + React Email
State:     Zustand + React Query
```

### Metricas del Proyecto

- **APIs REST:** 24 endpoints
- **Migraciones SQL:** 11 archivos (2,796 lineas)
- **Server Actions:** 60+ funciones
- **Tablas:** 21 tablas principales
- **Funciones SQL:** 25+ stored procedures
- **RLS Policies:** 80+ politicas de seguridad

### Estado General

**ESTADO: PRODUCCION PARCIAL**

- ✅ **Fortalezas:** Arquitectura modular, RLS bien implementado, migraciones organizadas
- ⚠️ **Advertencias:** Falta manejo de errores robusto, no hay caching, vulnerabilidad a N+1
- ❌ **Critico:** Sin rate limiting, webhooks sin verificacion de firma, sin monitoreo

---

## 2. ARQUITECTURA DE BASE DE DATOS

### 2.1 Esquema de Tablas

#### CORE TABLES (Schema Principal)

```sql
-- Usuarios y Autenticacion
users                          -- Usuarios admin y customers
email_verification_tokens      -- Tokens de verificacion de email
password_reset_tokens          -- Tokens de recuperacion de password
two_factor_auth               -- 2FA para admins
security_audit_log            -- Logs de eventos de seguridad
login_attempts                -- Intentos de login (rate limiting)
admin_whitelist               -- Lista blanca de admins

-- Catalogo de Productos
categories                    -- Categorias (con soporte jerarquico)
products                      -- Productos principales
product_variants              -- Variantes (tallas, colores)
product_reviews               -- Reviews y calificaciones
review_helpful_votes          -- Votos de utilidad en reviews
review_reports                -- Reportes de reviews

-- E-commerce
orders                        -- Ordenes de compra
order_items                   -- Items de cada orden
coupons                       -- Cupones de descuento
coupon_usages                 -- Rastreo de uso de cupones
shopping_carts                -- Carritos persistentes
stock_reservations            -- Reservas temporales de stock
cart_recovery_emails          -- Emails de carritos abandonados

-- Shipping
shipping_costs                -- Costos por departamento (Uruguay)

-- Cliente
customer_addresses            -- Direcciones de envio
customer_payment_methods      -- Metodos de pago guardados

-- Configuracion
store_settings                -- Configuracion global
banners                       -- Banners promocionales
```

### 2.2 Relaciones Clave

```
users (1) ----< (N) customer_addresses
users (1) ----< (N) customer_payment_methods
users (1) ----< (N) product_reviews
users (1) ----< (N) shopping_carts

categories (1) ----< (N) products
products (1) ----< (N) product_variants
products (1) ----< (N) product_reviews
products (1) ----< (N) order_items

orders (1) ----< (N) order_items
orders (1) ----o (1) coupons

coupons (1) ----< (N) coupon_usages

shopping_carts (1) ----< (N) stock_reservations
orders (1) ----< (N) stock_reservations
```

### 2.3 Indices Estrategicos

#### Performance Criticos

```sql
-- Busqueda de productos (Full-Text Search)
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('spanish', name || ' ' || description));

-- Productos con stock bajo
CREATE INDEX idx_low_stock ON products(stock)
  WHERE track_inventory = true AND stock <= low_stock_threshold;

-- Carritos activos por usuario/sesion
CREATE UNIQUE INDEX idx_carts_active_user ON shopping_carts(user_id)
  WHERE status = 'active' AND user_id IS NOT NULL;

-- Reservas activas de stock
CREATE INDEX idx_reservations_expires_at ON stock_reservations(expires_at)
  WHERE status = 'active';

-- Reviews aprobados por producto
CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status)
  WHERE status = 'approved';
```

#### Missing Indices (PROBLEMA)

```sql
-- FALTA: Indice compuesto para queries complejas de ordenes
-- CREATE INDEX idx_orders_customer_status_date ON orders(customer_email, status, created_at DESC);

-- FALTA: Indice para productos por categoria y precio
-- CREATE INDEX idx_products_category_price ON products(category_id, price) WHERE is_active = true;

-- FALTA: Indice para busqueda de cupones activos
-- CREATE INDEX idx_coupons_active_expires ON coupons(code, is_active, expires_at);
```

### 2.4 Stored Procedures (Funciones SQL)

#### Funciones Criticas de Negocio

```sql
-- Stock Management
decrement_product_stock(product_id, quantity)
decrement_variant_stock(variant_id, quantity)
reserve_stock(product_id, variant_id, quantity, ...)
get_available_stock(product_id, variant_id)

-- Cart Management
upsert_cart(user_id, session_id, items, ...)
merge_carts(user_id, session_id)
cleanup_expired_carts()
mark_abandoned_carts()

-- Coupon Validation
validate_coupon(code, email, subtotal, ...)
use_coupon(coupon_id, user_id, order_id, ...)

-- Reviews
calculate_product_rating(product_id)
can_user_review_product(user_id, product_id)

-- Security
create_password_reset_token(email, ip, user_agent)
validate_password_reset_token(token)
log_login_attempt(email, success, ip, user_agent)
is_account_locked(email)

-- Utilities
generate_order_number()
generate_secure_token()
update_updated_at_column()
```

### 2.5 Row Level Security (RLS)

#### ESTADO: ✅ BIEN IMPLEMENTADO

**Politicas Activas:** 80+

#### Ejemplos de Politicas

```sql
-- Productos publicos
CREATE POLICY "Productos activos son publicos"
  ON products FOR SELECT
  USING (is_active = true);

-- Usuarios pueden ver su carrito
CREATE POLICY "Users can view their own cart"
  ON shopping_carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden moderar reviews
CREATE POLICY "Admins can moderate reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );
```

#### PROBLEMA: Service Role Bypass

```sql
-- RIESGO: Service role bypasea RLS completamente
CREATE POLICY "Service role full access carts"
  ON shopping_carts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

**Recomendacion:** Usar service role solo en operaciones backend criticas.

---

## 3. APIS Y RUTAS

### 3.1 Mapa de APIs

```
Total Endpoints: 24
Metodos: GET (8), POST (12), PUT (2), DELETE (2)
```

#### Autenticacion

```
POST   /api/auth/register              -- Registro de usuarios
POST   /api/auth/[...nextauth]         -- NextAuth handlers
GET    /api/auth/verify-email          -- Verificacion de email
```

#### Productos

```
GET    /api/products                   -- Listado con filtros/paginacion
GET    /api/categories                 -- Categorias activas
GET    /api/search                     -- Busqueda de productos
```

#### Ordenes

```
GET    /api/orders/track               -- Rastreo de orden
```

#### Pagos (Mercado Pago)

```
POST   /api/mercadopago/process-payment    -- Checkout API (tarjetas)
POST   /api/webhooks/mercadopago           -- Webhook de notificaciones
GET    /api/webhooks/mercadopago           -- Health check
```

#### Admin

```
GET    /api/admin/coupons              -- Listar cupones
POST   /api/admin/coupons              -- Crear cupon
PUT    /api/admin/coupons/[id]         -- Actualizar cupon
DELETE /api/admin/coupons/[id]         -- Eliminar cupon
```

#### Storage

```
POST   /api/storage/upload             -- Subir archivos a Supabase
DELETE /api/storage/delete             -- Eliminar archivos
GET    /api/storage/list               -- Listar archivos
```

#### Shipping

```
POST   /api/shipping/calculate         -- Calcular costo de envio
```

#### Email

```
POST   /api/email/test                 -- Test de SMTP
POST   /api/email/send-test            -- Test de email generico
POST   /api/email/send-verification-test -- Test de verificacion
```

#### Analytics

```
GET    /api/analytics/export           -- Exportar datos
```

#### Clientes

```
GET    /api/customer/profile           -- Perfil del cliente
PUT    /api/customer/profile           -- Actualizar perfil
GET    /api/customer/addresses         -- Listar direcciones
POST   /api/customer/addresses         -- Crear direccion
PUT    /api/customer/addresses/[id]    -- Actualizar direccion
DELETE /api/customer/addresses/[id]    -- Eliminar direccion
GET    /api/customer/payment-methods/[id]    -- Metodos de pago
DELETE /api/customer/payment-methods/[id]    -- Eliminar metodo
```

#### Cupones

```
POST   /api/coupons/validate           -- Validar cupon
```

### 3.2 Analisis de Seguridad por Endpoint

#### CRITICO: Sin Rate Limiting

```typescript
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  // ❌ Sin rate limiting
  // ❌ Sin captcha
  // ❌ Sin verificacion de IP

  const body = await request.json()
  // ... registro de usuario
}
```

**RIESGO:** Vulnerable a ataques de fuerza bruta y spam de registros.

#### BUENO: Validacion con Zod

```typescript
// Validacion de entrada
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const result = registerSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json(
    { error: result.error.issues[0].message },
    { status: 400 }
  )
}
```

#### PROBLEMA: Manejo de Errores Generico

```typescript
// app/api/products/route.ts
catch (error) {
  console.error('Error in /api/products:', error)
  return NextResponse.json(
    { error: 'Error al obtener productos' }, // ❌ Mensaje generico
    { status: 500 }
  )
}
```

**Mejora:** Diferenciar tipos de error y dar respuestas especificas.

### 3.3 Webhook de Mercado Pago

#### Implementacion Actual

```typescript
// app/api/webhooks/mercadopago/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json() as WebhookNotification

  // ⚠️ FALTA: Verificacion de firma
  // ⚠️ FALTA: Validacion de origen
  // ⚠️ FALTA: Rate limiting

  if (body.type !== 'payment') {
    return NextResponse.json({ received: true })
  }

  const result = await processPaymentWebhook(paymentId)

  // ✅ BUENO: Siempre retorna 200 para evitar reintentos
  return NextResponse.json({
    received: true,
    orderId: result.orderId,
    status: result.status,
  })
}
```

#### VULNERABILIDAD CRITICA

```typescript
// lib/mercadopago/webhooks.ts
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // ❌ NO IMPLEMENTADO
  if (process.env.MP_WEBHOOK_SECRET) {
    return secret === process.env.MP_WEBHOOK_SECRET
  }
  return true // ⚠️ Siempre retorna true!
}
```

**RIESGO:** Cualquiera puede enviar webhooks falsos y modificar ordenes.

---

## 4. SERVER ACTIONS

### 4.1 Organizacion

```
actions/
├── auth/
│   ├── stats.ts              -- Estadisticas de usuarios
│   └── verification.ts       -- Verificacion de email
├── cart/
│   └── mutations.ts          -- Operaciones de carrito
├── checkout/
│   ├── index.ts
│   └── process.ts            -- Proceso de checkout
├── products/
│   ├── create.ts             -- Crear producto
│   ├── update.ts             -- Actualizar producto
│   ├── delete.ts             -- Eliminar producto
│   ├── queries.ts            -- Consultas de productos
│   ├── stock.ts              -- Gestion de stock
│   └── status.ts             -- Cambiar estado
├── orders/
│   ├── mutations.ts          -- Crear/actualizar ordenes
│   └── queries.ts            -- Consultar ordenes
├── categories/
│   ├── mutations.ts
│   └── queries.ts
├── reviews/
│   ├── mutations.ts
│   └── queries.ts
├── variants/
│   ├── generate.ts
│   ├── mutations.ts
│   └── queries.ts
├── shipping/
│   ├── mutations.ts
│   └── queries.ts
└── analytics/
    └── queries.ts
```

### 4.2 Patrones de Implementacion

#### BUENO: Separacion de Concerns

```typescript
// actions/products/queries.ts
'use server'

export async function getProducts(params: ProductsQueryParams) {
  const supabase = await createClient()

  // Construccion de query con filtros
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)', { count: 'exact' })

  if (isActive !== undefined) query = query.eq('is_active', isActive)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)

  // Paginacion
  query = query.range(from, to)

  const { data, error, count } = await query

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages }
  }
}
```

#### EXCELENTE: Validacion con Schemas

```typescript
// actions/checkout/process.ts
export async function processCheckout(input: ProcessCheckoutInput) {
  // 1. Validar con Zod
  const validationResult = processCheckoutSchema.safeParse(input)
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.issues[0].message }
  }

  // 2. Validar stock
  for (const item of items) {
    if (variant.stock < item.quantity) {
      return { success: false, error: `Stock insuficiente` }
    }
  }

  // 3. Crear orden
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ ... })
    .select()
    .single()

  // 4. Procesar pago segun metodo
  if (paymentMethod === 'mercadopago') {
    const preference = await createPreference({ ... })
    return { success: true, data: { preferenceId, initPoint } }
  }
}
```

#### PROBLEMA: Transacciones No Atomicas

```typescript
// actions/orders/mutations.ts
export async function createOrder(input: CreateOrderInput) {
  // 1. Crear orden
  const { data: order } = await supabase.from('orders').insert({ ... })

  // 2. Crear items
  await supabase.from('order_items').insert(orderItems)

  // ❌ PROBLEMA: Si falla aqui, queda orden sin items

  // 3. Decrementar stock
  for (const item of items) {
    await supabase.rpc('decrement_product_stock', { ... })
  }

  // ❌ PROBLEMA: Si falla aqui, stock no se decrementa
}
```

**Solucion:** Usar transacciones SQL o implement compensating transactions.

### 4.3 Manejo de Stock

#### Flujo Actual

```typescript
// 1. Validar disponibilidad
if (product.track_inventory && product.stock < item.quantity) {
  return { success: false, error: 'Stock insuficiente' }
}

// 2. Crear orden (sin decrementar todavia)
const order = await createOrder({ ... })

// 3. Decrementar stock SOLO cuando se confirma pago
// (en webhook de Mercado Pago)
if (paymentStatus === 'approved') {
  await updateStock(orderId)
}
```

#### PROBLEMA: Race Condition

```
Usuario A: Ve stock = 1
Usuario B: Ve stock = 1
Usuario A: Crea orden (stock = 1)
Usuario B: Crea orden (stock = 1) ✅ Ambos pasan validacion
MP Webhook A: Decrementa stock (stock = 0)
MP Webhook B: Decrementa stock (stock = -1) ❌ Sobreventa!
```

#### SOLUCION IMPLEMENTADA: Stock Reservations

```sql
-- Tabla de reservas temporales
CREATE TABLE stock_reservations (
  product_id UUID,
  quantity INTEGER,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  status VARCHAR CHECK (status IN ('active', 'released', 'converted'))
);

-- Funcion para calcular stock disponible
CREATE FUNCTION get_available_stock(product_id UUID)
RETURNS INTEGER AS $$
  SELECT
    products.stock - COALESCE(SUM(reservations.quantity), 0)
  FROM products
  LEFT JOIN stock_reservations ON ...
  WHERE reservations.status = 'active'
    AND reservations.expires_at > NOW()
$$;
```

**Estado:** ✅ Implementado pero NO usado en checkout actual.

---

## 5. INTEGRACIONES EXTERNAS

### 5.1 Mercado Pago

#### Configuracion

```typescript
// lib/mercadopago/client.ts
import { MercadoPagoConfig } from 'mercadopago'

export function getMercadoPagoClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no configurado')
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: crypto.randomUUID() // ✅ Previene duplicados
    }
  })
}
```

#### Flujo de Pago: Checkout Pro

```
1. Cliente completa checkout
   ↓
2. Server crea preferencia en MP
   POST /api/checkout/create-preference
   {
     items: [...],
     payer: { email, name },
     back_urls: { success, failure, pending },
     external_reference: orderId,
     notification_url: /api/webhooks/mercadopago
   }
   ↓
3. MP retorna init_point
   ↓
4. Cliente es redirigido a MP
   ↓
5. Cliente paga en MP
   ↓
6. MP envia webhook a /api/webhooks/mercadopago
   ↓
7. Server actualiza orden y stock
   ↓
8. Cliente redirigido a /checkout/success
```

#### Implementacion de Preferencia

```typescript
// lib/mercadopago/checkout.ts
export async function createPreference(params: CreatePreferenceParams) {
  // ✅ Validaciones robustas
  if (!params.orderId || !params.orderNumber) {
    throw new Error('orderId y orderNumber requeridos')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(customer.email)) {
    throw new Error('Email invalido')
  }

  // ✅ Limitar titulo a 256 caracteres (limite de MP)
  const title = item.variant
    ? `${product.name} - ${variant.name}`
    : product.name
  const truncatedTitle = title.length > 256
    ? title.substring(0, 253) + '...'
    : title

  // Crear items
  const preferenceItems = items.map(item => ({
    id: variant?.id || product.id,
    title: truncatedTitle,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: 'UYU', // ⚠️ Hardcoded
    picture_url: product.images[0] || undefined,
  }))

  // Agregar shipping
  if (shippingCost > 0) {
    preferenceItems.push({
      id: 'shipping',
      title: 'Costo de envio',
      quantity: 1,
      unit_price: shippingCost,
      currency_id: 'UYU',
    })
  }

  // ✅ Configuracion completa
  const preference = await client.create({
    body: {
      items: preferenceItems,
      payer: { ... },
      back_urls: { ... },
      external_reference: orderId, // ✅ Critico para webhook
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: { order_id: orderId, order_number: orderNumber }
    }
  })

  return {
    id: preference.id,
    initPoint: preference.init_point
  }
}
```

#### Procesamiento de Webhook

```typescript
// lib/mercadopago/webhooks.ts
export async function processPaymentWebhook(paymentId: string) {
  // 1. Obtener datos del pago desde MP
  const payment = await paymentClient.get({ id: paymentId })

  // 2. Extraer orderId
  const orderId = payment.external_reference

  // 3. Mapear status de MP a status interno
  const statusMap = {
    approved: 'paid',
    pending: 'pending',
    in_process: 'pending',
    rejected: 'cancelled',
    refunded: 'refunded',
  }

  // 4. Actualizar orden
  await supabase
    .from('orders')
    .update({
      mp_payment_id: payment.id,
      mp_status: payment.status,
      status: statusMap[payment.status],
      paid_at: payment.status === 'approved' ? NOW() : null
    })
    .eq('id', orderId)

  // 5. Decrementar stock si aprobado
  if (payment.status === 'approved') {
    await updateStock(orderId)
  }
}
```

#### PROBLEMAS DETECTADOS

1. **Sin verificacion de firma:**
   ```typescript
   // ❌ Webhook acepta cualquier request
   export async function POST(request: NextRequest) {
     const body = await request.json()
     // Sin validacion de origen
     await processPaymentWebhook(body.data.id)
   }
   ```

2. **Currency hardcoded:**
   ```typescript
   currency_id: 'UYU', // ⚠️ No configurable
   ```

3. **Sin retry mechanism:**
   Si el webhook falla, no hay reintentos automaticos.

4. **Sin idempotencia en webhook:**
   MP puede enviar el mismo webhook multiples veces.

### 5.2 Sistema de Email (SMTP)

#### Configuracion

```typescript
// lib/email/client.ts
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,     // smtp.gmail.com
  port: Number(process.env.MAIL_PORT), // 587
  secure: false, // TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD, // App Password
  },
})
```

#### Envio de Email

```typescript
// lib/email/send-email.ts
export async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    html,
  }

  return transporter.sendMail(mailOptions)
}
```

#### Templates con React Email

```typescript
// lib/email/templates/email-verification.tsx
import { Html, Head, Body, Container, Button } from '@react-email/components'

export default function EmailVerification({ name, verificationUrl }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <h1>Hola {name}!</h1>
          <p>Verifica tu email haciendo click en el boton:</p>
          <Button href={verificationUrl}>Verificar Email</Button>
        </Container>
      </Body>
    </Html>
  )
}
```

#### Uso en Registro

```typescript
// app/api/auth/register/route.ts
const token = crypto.randomBytes(32).toString('hex')

await supabase.from('email_verification_tokens').insert({
  user_id: authData.user.id,
  token,
  email: authData.user.email,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
})

const verificationUrl = `${baseUrl}/auth/confirm?token=${token}`
const html = await render(EmailVerification({ name, verificationUrl }))

await sendEmail({
  to: authData.user.email,
  subject: 'Confirma tu email',
  html,
})
```

#### PROBLEMAS

1. **Sin retry en fallo:**
   ```typescript
   try {
     await sendEmail({ ... })
   } catch (emailError) {
     // ❌ Solo logea, no reintenta
     console.error('Error sending email:', emailError)
   }
   ```

2. **Sin queue:**
   Emails se envian sincronicamente, bloqueando la request.

3. **Sin rate limiting:**
   Vulnerable a spam de emails.

### 5.3 Supabase Auth

#### Configuracion

```typescript
// lib/supabase/admin.ts
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Solo server-side
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

#### Flujo de Autenticacion

```
1. Usuario se registra
   POST /api/auth/register
   ↓
2. Se crea usuario en Supabase Auth
   supabase.auth.admin.createUser({
     email,
     password,
     email_confirm: false,
     user_metadata: { name }
   })
   ↓
3. Trigger 'on_auth_user_created' crea registro en tabla 'users'
   ↓
4. Se genera token de verificacion
   ↓
5. Se envia email con link
   ↓
6. Usuario hace click en link
   GET /auth/confirm?token=xxx
   ↓
7. Se marca email_verified = true
```

#### Trigger de Sincronizacion

```sql
-- supabase/migrations/008_sync_auth_users.sql
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    determine_initial_role(NEW.email),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user();
```

#### BUENO: Determinacion de Rol

```sql
CREATE FUNCTION determine_initial_role(p_email VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_whitelist_role VARCHAR;
  v_super_admin_count INTEGER;
BEGIN
  -- 1. Verificar whitelist
  SELECT allowed_role INTO v_whitelist_role
  FROM admin_whitelist
  WHERE email = p_email AND is_active = TRUE;

  IF v_whitelist_role IS NOT NULL THEN
    RETURN v_whitelist_role;
  END IF;

  -- 2. Si no hay super_admin, el primero lo sera
  SELECT COUNT(*) INTO v_super_admin_count
  FROM users WHERE role = 'super_admin';

  IF v_super_admin_count = 0 THEN
    RETURN 'super_admin';
  END IF;

  -- 3. Por defecto, customer
  RETURN 'customer';
END;
$$ LANGUAGE plpgsql;
```

---

## 6. SEGURIDAD Y AUTENTICACION

### 6.1 Autenticacion con NextAuth v5

#### Configuracion

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@/lib/supabase/server'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const supabase = await createClient()

        // Login con Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) return null

        // Obtener datos adicionales de la tabla users
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, role, email_verified')
          .eq('id', data.user.id)
          .single()

        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    }
  }
})
```

### 6.2 Middleware de Proteccion

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (isAdminRoute && session) {
    const role = session.user?.role
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Customer protected routes
  const isCustomerProtectedRoute = pathname.startsWith('/mi-cuenta')
    || pathname.startsWith('/checkout')

  if (isCustomerProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/mi-cuenta/:path*',
    '/checkout/:path*',
  ],
}
```

### 6.3 Seguridad de Passwords

#### Reset de Password

```sql
-- Funcion para crear token de reset
CREATE FUNCTION create_password_reset_token(
  p_email VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE (token VARCHAR, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_user_id UUID;
  v_token VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar usuario
  SELECT id INTO v_user_id FROM users WHERE email = p_email AND is_active = TRUE;

  IF v_user_id IS NULL THEN
    -- No revelar si el email existe (seguridad)
    RETURN;
  END IF;

  -- Generar token seguro
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '1 hour';

  -- Invalidar tokens anteriores
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE user_id = v_user_id AND used_at IS NULL;

  -- Crear nuevo token
  INSERT INTO password_reset_tokens (user_id, email, token, expires_at, ip_address, user_agent)
  VALUES (v_user_id, p_email, v_token, v_expires_at, p_ip_address, p_user_agent);

  -- Audit log
  INSERT INTO security_audit_log (user_id, email, event_type, ip_address, severity)
  VALUES (v_user_id, p_email, 'password_reset_requested', p_ip_address, 'warning');

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Login Attempts Tracking

```sql
CREATE FUNCTION log_login_attempt(
  p_email VARCHAR,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_failed_attempts INTEGER;
BEGIN
  -- Registrar intento
  INSERT INTO login_attempts (email, success, ip_address, user_agent)
  VALUES (p_email, p_success, p_ip_address, p_user_agent);

  SELECT id INTO v_user_id FROM users WHERE email = p_email;

  IF v_user_id IS NULL THEN RETURN; END IF;

  IF p_success THEN
    -- Resetear contador
    UPDATE users
    SET
      failed_login_attempts = 0,
      last_login_at = NOW(),
      last_login_ip = p_ip_address,
      account_locked_until = NULL
    WHERE id = v_user_id;
  ELSE
    -- Incrementar contador
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = v_user_id
    RETURNING failed_login_attempts INTO v_failed_attempts;

    -- Bloquear cuenta despues de 5 intentos
    IF v_failed_attempts >= 5 THEN
      UPDATE users
      SET account_locked_until = NOW() + INTERVAL '30 minutes'
      WHERE id = v_user_id;

      -- Audit log critico
      INSERT INTO security_audit_log (user_id, email, event_type, severity)
      VALUES (v_user_id, p_email, 'account_locked', 'critical');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.4 Verificacion de Email

#### Generacion de Token

```typescript
// app/api/auth/register/route.ts
const token = crypto.randomBytes(32).toString('hex')
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

await supabase.from('email_verification_tokens').insert({
  user_id: authData.user.id,
  token,
  email: authData.user.email,
  expires_at: expiresAt.toISOString(),
})
```

#### Verificacion

```typescript
// actions/auth/verification.ts
export async function verifyEmail(token: string) {
  const supabase = createAdminClient()

  // Buscar token
  const { data: tokenData } = await supabase
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!tokenData) {
    return { success: false, error: 'Token invalido o expirado' }
  }

  // Marcar como verificado
  await supabase
    .from('email_verification_tokens')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', tokenData.id)

  // Actualizar usuario
  await supabase
    .from('users')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString()
    })
    .eq('id', tokenData.user_id)

  return { success: true }
}
```

### 6.5 VULNERABILIDADES DETECTADAS

#### CRITICO

1. **Sin Rate Limiting:**
   - APIs de registro, login, reset password sin limites
   - Vulnerable a ataques de fuerza bruta
   - Vulnerable a spam de emails

2. **Webhook sin Verificacion:**
   - Mercado Pago webhook acepta cualquier request
   - No verifica firma ni origen
   - Permite modificacion de ordenes por terceros

3. **Sin CSRF Protection:**
   - APIs no validan tokens CSRF
   - Vulnerable a ataques cross-site

#### ALTO

4. **Service Role Key en ENV:**
   - Service role key con acceso total a DB
   - Si se expone, bypasea todo RLS
   - No hay rotacion de keys

5. **Password Min Length = 6:**
   - Deberia ser minimo 8-10 caracteres
   - No valida complejidad (mayusculas, numeros, simbolos)

6. **Tokens sin Rotacion:**
   - Email verification tokens permanecen en DB
   - No hay limpieza de tokens expirados

#### MEDIO

7. **Error Messages Reveladores:**
   - Mensajes de error pueden revelar informacion del sistema
   - No hay obfuscacion de stack traces en produccion

8. **Sin Two-Factor Auth:**
   - 2FA implementado en DB pero no en flujo de login
   - Solo para admins

---

## 7. ANALISIS DE PERFORMANCE

### 7.1 N+1 Query Problems

#### PROBLEMA DETECTADO: Productos con Reviews

```typescript
// actions/products/queries.ts
export async function getProducts(params) {
  const { data: products } = await supabase
    .from('products')
    .select('*')

  // ❌ Para cada producto, query adicional
  for (const product of products) {
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)

    product.reviews = reviews
  }

  return products
}
```

**Solucion:**

```typescript
// ✅ Un solo query con join
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_reviews (
      id,
      rating,
      comment,
      created_at
    )
  `)
```

#### PROBLEMA DETECTADO: Orders con Items

```typescript
// Orden individual
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single()

// ❌ Query separado para items
const { data: items } = await supabase
  .from('order_items')
  .select('*')
  .eq('order_id', orderId)
```

**Solucion:**

```typescript
// ✅ Join en un query
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      *,
      products (name, images),
      product_variants (name)
    )
  `)
  .eq('id', orderId)
  .single()
```

### 7.2 Caching

#### ESTADO: ❌ NO IMPLEMENTADO

No hay caching en:
- Listado de productos
- Categorias
- Store settings
- Shipping costs

**Implementacion Recomendada:**

```typescript
// lib/cache/redis.ts (NO EXISTE)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return cached as T

  const fresh = await fetcher()
  await redis.setex(key, ttl, fresh)
  return fresh
}

// Uso
export async function getProducts(params) {
  return getCached(
    `products:${JSON.stringify(params)}`,
    () => fetchProductsFromDB(params),
    600 // 10 minutos
  )
}
```

### 7.3 Database Queries

#### Queries Lentos Detectados

```sql
-- ❌ Busqueda de productos sin limite
SELECT * FROM products
WHERE name ILIKE '%search%'
  OR description ILIKE '%search%';

-- ✅ Con full-text search e indices
SELECT * FROM products
WHERE to_tsvector('spanish', name || ' ' || description)
  @@ to_tsquery('spanish', 'search:*')
LIMIT 20;
```

```sql
-- ❌ Ordenes sin paginacion
SELECT * FROM orders
WHERE customer_email = 'user@example.com'
ORDER BY created_at DESC;

-- ✅ Con paginacion
SELECT * FROM orders
WHERE customer_email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### 7.4 Indice de Performance

#### Metricas Estimadas

| Operacion | Tiempo | Optimizacion |
|-----------|--------|--------------|
| Listado productos (sin cache) | ~150ms | ⚠️ Medio |
| Busqueda full-text | ~80ms | ✅ Bueno |
| Checkout completo | ~800ms | ⚠️ Medio |
| Webhook processing | ~200ms | ✅ Bueno |
| Orden con items (N+1) | ~300ms | ❌ Malo |
| Validacion de cupon | ~50ms | ✅ Bueno |

#### Bottlenecks

1. **Emails sincronicos:** Bloquean response hasta enviar email
2. **Preferencias de MP:** Request externa puede tardar 500ms+
3. **Queries N+1:** Multiplica tiempo por numero de items
4. **Sin connection pooling:** Cada request abre nueva conexion

### 7.5 Optimizaciones Pendientes

#### Criticas

1. **Implementar Redis/Upstash para caching:**
   - Productos populares
   - Categorias
   - Store settings
   - TTL: 5-15 minutos

2. **Queue para emails:**
   - Usar BullMQ o similar
   - Procesar asincrónicamente
   - Retry automatico

3. **CDN para imagenes:**
   - Supabase Storage + Cloudflare CDN
   - Image optimization
   - Lazy loading

#### Importantes

4. **Database indexing:**
   - Crear indices compuestos
   - Analizar query plans
   - Optimize slow queries

5. **Connection pooling:**
   - Implementar Prisma Accelerate o PgBouncer
   - Reutilizar conexiones
   - Reducir latencia

6. **Pagination everywhere:**
   - Limitar results por defecto
   - Cursor-based pagination para grandes datasets

---

## 8. PUNTOS DEBILES Y RIESGOS

### 8.1 CRITICOS (P0 - Accion Inmediata)

#### 1. Webhook Sin Verificacion

**Riesgo:** Cualquiera puede enviar webhooks falsos y modificar ordenes.

**Ubicacion:**
- `app/api/webhooks/mercadopago/route.ts`
- `lib/mercadopago/webhooks.ts`

**Impacto:**
- Modificacion de estados de orden
- Decremento de stock sin pago real
- Perdidas economicas directas

**Solucion:**
```typescript
// Implementar verificacion de firma
import crypto from 'crypto'

function verifyMPSignature(request: Request) {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  const dataID = new URLSearchParams(request.url.split('?')[1]).get('data.id')

  const parts = xSignature.split(',')
  const ts = parts[0].split('=')[1]
  const hash = parts[1].split('=')[1]

  const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`
  const secret = process.env.MP_WEBHOOK_SECRET

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const sha = hmac.digest('hex')

  return sha === hash
}
```

#### 2. Sin Rate Limiting

**Riesgo:** Ataques de fuerza bruta, spam de registros, DDoS.

**APIs Vulnerables:**
- `/api/auth/register`
- `/api/auth/login`
- `/api/coupons/validate`
- `/api/email/send-*`

**Solucion:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
  return { success, limit, reset, remaining }
}

// Uso en API
const ip = request.headers.get('x-forwarded-for') || 'unknown'
const { success } = await checkRateLimit(ip)

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  )
}
```

#### 3. Service Role Key Exposure

**Riesgo:** Si se expone, bypasea todo RLS y da acceso total a DB.

**Problemas:**
- Key en archivo .env sin rotacion
- No hay alertas de uso inusual
- Usado en cliente admin (riesgo si se bundlea)

**Solucion:**
- Rotar key cada 90 dias
- Monitorear uso en Supabase dashboard
- Usar API keys con permisos limitados
- Never log o exponer en errores

### 8.2 ALTOS (P1 - Accion en 1-2 semanas)

#### 4. Race Condition en Stock

**Riesgo:** Sobreventa cuando multiples usuarios compran simultaneamente.

**Escenario:**
```
Stock actual: 1 unidad
Usuario A: Valida stock ✅ (stock = 1)
Usuario B: Valida stock ✅ (stock = 1)
Usuario A: Crea orden
Usuario B: Crea orden
MP Webhook A: Decrementa stock (stock = 0)
MP Webhook B: Decrementa stock (stock = -1) ❌
```

**Solucion:**
- Usar sistema de reservas implementado
- Lock optimista con versioning
- Transaction isolation level

#### 5. Transacciones No Atomicas

**Riesgo:** Inconsistencias si falla en medio de operacion.

**Problema:**
```typescript
// Si falla despues de crear orden pero antes de crear items:
await createOrder()    // ✅ Creado
await createItems()    // ❌ Falla
// Resultado: Orden sin items en DB
```

**Solucion:**
```typescript
// Usar transacciones SQL
await supabase.rpc('create_order_transaction', {
  order_data: { ... },
  items_data: [ ... ]
})
```

#### 6. Sin Monitoreo de Errores

**Riesgo:** Errores en produccion no detectados hasta que usuarios reportan.

**Problemas:**
- Solo console.log()
- No hay alertas
- No hay tracking de errores

**Solucion:**
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
})

// Uso
try {
  await processCheckout()
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'checkout' },
    extra: { orderId, userId }
  })
  throw error
}
```

### 8.3 MEDIOS (P2 - Accion en 1 mes)

#### 7. Password Policy Debil

**Problema:** Min 6 caracteres, sin validacion de complejidad.

**Solucion:**
```typescript
const passwordSchema = z.string()
  .min(10, 'Minimo 10 caracteres')
  .regex(/[A-Z]/, 'Debe contener mayuscula')
  .regex(/[a-z]/, 'Debe contener minuscula')
  .regex(/[0-9]/, 'Debe contener numero')
  .regex(/[^A-Za-z0-9]/, 'Debe contener simbolo')
```

#### 8. Emails Sincronicos

**Problema:** Bloquean response del usuario hasta enviar email.

**Impacto:** Experiencia de usuario lenta, timeouts.

**Solucion:** Queue (BullMQ, Inngest)

#### 9. Sin Logging Estructurado

**Problema:** Logs no consultables, dificil debugging.

**Solucion:**
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty'
  }
})

logger.info({ orderId, userId, amount }, 'Order created')
```

### 8.4 BAJOS (P3 - Backlog)

10. Sin tests automatizados
11. Currency hardcoded
12. Sin backup strategy documentada
13. Sin disaster recovery plan
14. Sin documentacion de APIs (OpenAPI)

---

## 9. MEJORAS RECOMENDADAS

### 9.1 Prioridad CRITICA (Implementar Ya)

#### 1. Rate Limiting

**Implementacion:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 s'),
    analytics: true,
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 s'),
  }),
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 s'),
  }),
}

// Uso en API route
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await ratelimit.auth.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta en unos minutos.' },
      { status: 429 }
    )
  }

  // ... rest of logic
}
```

**Endpoints a proteger:**
- `/api/auth/register` - 5 req/10s por IP
- `/api/auth/login` - 5 req/10s por IP
- `/api/checkout/*` - 3 req/60s por usuario
- `/api/coupons/validate` - 10 req/60s por usuario
- `/api/email/*` - 2 req/60s por IP

#### 2. Webhook Signature Verification

```typescript
// lib/mercadopago/verify-webhook.ts
import crypto from 'crypto'

export function verifyMercadoPagoWebhook(request: Request): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) {
    return false
  }

  const url = new URL(request.url)
  const dataID = url.searchParams.get('data.id')

  const parts = xSignature.split(',')
  let ts: string | undefined
  let hash: string | undefined

  parts.forEach(part => {
    const [key, value] = part.split('=')
    if (key === 'ts') ts = value
    if (key === 'v1') hash = value
  })

  if (!ts || !hash || !dataID) {
    return false
  }

  // Crear manifest
  const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`

  // Calcular HMAC
  const secret = process.env.MP_WEBHOOK_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const calculatedHash = hmac.digest('hex')

  return calculatedHash === hash
}

// Uso en webhook route
export async function POST(request: NextRequest) {
  // Verificar firma
  if (!verifyMercadoPagoWebhook(request)) {
    console.error('Invalid webhook signature')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // ... procesar webhook
}
```

#### 3. Error Monitoring con Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Postgres(),
  ],
})

// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### 9.2 Prioridad ALTA (Semana 1-2)

#### 4. Caching con Upstash Redis

```typescript
// lib/cache/index.ts
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
  // Intentar obtener de cache
  const cached = await redis.get<T>(key)
  if (cached) {
    return cached
  }

  // Si no existe, ejecutar fetcher
  const fresh = await fetcher()

  // Guardar en cache
  await redis.setex(key, ttl, JSON.stringify(fresh))

  return fresh
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

// Uso en queries
export async function getProducts(params: ProductsQueryParams) {
  const cacheKey = `products:${JSON.stringify(params)}`

  return getCachedData(
    cacheKey,
    () => fetchProductsFromDB(params),
    300 // 5 minutos
  )
}

// Invalidar cache al crear/actualizar producto
export async function createProduct(data: ProductInput) {
  const product = await insertProduct(data)
  await invalidateCache('products:*')
  return product
}
```

#### 5. Email Queue con Inngest

```bash
npm install inngest
```

```typescript
// lib/email/queue.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({ name: 'E-commerce' })

export const sendEmailJob = inngest.createFunction(
  { name: 'Send Email' },
  { event: 'email/send' },
  async ({ event, step }) => {
    await step.run('send-email', async () => {
      await sendEmail({
        to: event.data.to,
        subject: event.data.subject,
        html: event.data.html,
      })
    })
  }
)

// Uso en registro
await inngest.send({
  name: 'email/send',
  data: {
    to: user.email,
    subject: 'Confirma tu email',
    html: emailHtml,
  },
})

// Response inmediato al usuario, email se envia en background
```

#### 6. Stock Reservations en Checkout

```typescript
// actions/checkout/process.ts
export async function processCheckout(input: ProcessCheckoutInput) {
  // ... validaciones

  // Reservar stock ANTES de crear orden
  for (const item of items) {
    const reserved = await supabase.rpc('reserve_stock', {
      p_product_id: item.productId,
      p_variant_id: item.variantId,
      p_quantity: item.quantity,
      p_duration_minutes: 15, // Expira en 15 min
    })

    if (!reserved) {
      return {
        success: false,
        error: `Stock insuficiente para ${item.product.name}`,
      }
    }
  }

  // Crear orden
  const order = await createOrder({ ... })

  // Asociar reservas a la orden
  await supabase
    .from('stock_reservations')
    .update({ order_id: order.id })
    .eq('cart_id', cartId)

  // ... continuar con pago
}
```

### 9.3 Prioridad MEDIA (Mes 1)

#### 7. Database Optimization

```sql
-- Crear indices compuestos faltantes
CREATE INDEX idx_orders_customer_status_date
  ON orders(customer_email, status, created_at DESC);

CREATE INDEX idx_products_category_price_active
  ON products(category_id, price)
  WHERE is_active = true;

CREATE INDEX idx_reviews_product_approved
  ON product_reviews(product_id, rating, created_at DESC)
  WHERE status = 'approved';

-- Vacuum y analyze periodico
VACUUM ANALYZE products;
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
```

#### 8. Logging Estructurado

```typescript
// lib/logger/index.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Uso
logger.info({
  module: 'checkout',
  orderId,
  userId,
  amount,
  items: items.length
}, 'Order created successfully')

logger.error({
  module: 'mercadopago',
  error: error.message,
  orderId
}, 'Failed to create preference')
```

#### 9. API Documentation con OpenAPI

```typescript
// lib/openapi/spec.ts
export const apiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce API',
    version: '1.0.0',
  },
  paths: {
    '/api/products': {
      get: {
        summary: 'List products',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 }
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProductList' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          price: { type: 'number' },
          // ...
        }
      }
    }
  }
}
```

### 9.4 Prioridad BAJA (Backlog)

10. Tests automatizados (Jest + Testing Library)
11. E2E tests (Playwright)
12. CI/CD pipeline
13. Backup automatico de DB
14. Disaster recovery plan
15. Load testing (k6)

---

## 10. DIAGRAMA DE ARQUITECTURA

### 10.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                               │
│  Next.js 16 App Router + React 19 + TypeScript + TailwindCSS  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─── Client Components (zustand, react-query)
             ├─── Server Components (RSC)
             └─── Middleware (auth protection)
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                      BACKEND LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────┐    │
│  │  API Routes   │    │Server Actions│    │  Middleware │    │
│  │  (24 routes)  │    │   (60+ fn)   │    │   (auth)    │    │
│  └───────┬───────┘    └──────┬───────┘    └──────┬──────┘    │
│          │                   │                     │            │
│          └───────────────────┴─────────────────────┘            │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Supabase    │    │  External APIs  │    │   Supabase     │
│  PostgreSQL   │    │                 │    │    Storage     │
│               │    │ • Mercado Pago  │    │                │
│ • 21 Tables   │    │ • SMTP (Email)  │    │ • Images       │
│ • 25+ Funcs   │    │                 │    │ • Files        │
│ • 80+ RLS     │    └─────────────────┘    └────────────────┘
└───────────────┘
```

### 10.2 Flujo de Checkout

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. Add to cart
     ▼
┌─────────────────┐
│ Shopping Cart   │ (Zustand + localStorage)
│ (Client State)  │
└────┬────────────┘
     │ 2. Proceed to checkout
     ▼
┌──────────────────────────────────────────────────────┐
│           Server Action: processCheckout             │
├──────────────────────────────────────────────────────┤
│ 1. Validate input (Zod)                              │
│ 2. Validate stock availability                       │
│ 3. Calculate shipping cost (by department)           │
│ 4. Apply coupon if present                           │
│ 5. Create order in DB                                │
│ 6. Create order_items                                │
│ 7. Reserve stock (optional, not currently used)      │
│ 8. Process payment method:                           │
│    ├─ Mercado Pago: Create preference               │
│    ├─ Bank Transfer: Set pending_payment            │
│    └─ Cash on Delivery: Set pending                 │
└──────┬───────────────────────────────────────────────┘
       │
       ├─ If Mercado Pago
       │  ↓
       │  ┌────────────────────────────────┐
       │  │  lib/mercadopago/checkout.ts   │
       │  │  createPreference()            │
       │  └──────┬─────────────────────────┘
       │         │ API Call
       │         ▼
       │  ┌────────────────────┐
       │  │   Mercado Pago     │
       │  │   Preference API   │
       │  └──────┬─────────────┘
       │         │ Returns init_point
       │         ▼
       │  ┌────────────────────┐
       │  │ Redirect to MP     │
       │  │ Checkout           │
       │  └──────┬─────────────┘
       │         │ User pays
       │         ▼
       │  ┌────────────────────┐
       │  │ MP sends webhook   │
       │  └──────┬─────────────┘
       │         │ POST /api/webhooks/mercadopago
       │         ▼
       │  ┌────────────────────────────┐
       │  │ processPaymentWebhook()    │
       │  ├────────────────────────────┤
       │  │ 1. Get payment from MP     │
       │  │ 2. Extract orderId         │
       │  │ 3. Update order status     │
       │  │ 4. Decrement stock         │
       │  │ 5. Send confirmation email │
       │  └────────────────────────────┘
       │
       └─ If Bank Transfer / Cash
          ↓
          ┌────────────────────────────┐
          │ Order created with status: │
          │ - pending_payment          │
          │ - pending                  │
          └────────────────────────────┘
```

### 10.3 Arquitectura de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                          │
│                     Supabase PostgreSQL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────┐  │
│  │    USERS     │      │  PRODUCTS    │      │   ORDERS    │  │
│  │              │      │              │      │             │  │
│  │ • Auth users │      │ • Catalog    │      │ • Orders    │  │
│  │ • Customers  │      │ • Variants   │      │ • Items     │  │
│  │ • Admins     │      │ • Reviews    │      │ • Payments  │  │
│  └──────┬───────┘      └──────┬───────┘      └──────┬──────┘  │
│         │                     │                     │           │
│         │                     │                     │           │
│  ┌──────┴────────────────────┴─────────────────────┴───────┐  │
│  │                  RELATIONSHIPS                           │  │
│  │                                                          │  │
│  │  users (1) ----< (N) customer_addresses                │  │
│  │  users (1) ----< (N) product_reviews                   │  │
│  │  users (1) ----< (N) shopping_carts                    │  │
│  │                                                          │  │
│  │  categories (1) ----< (N) products                     │  │
│  │  products (1) ----< (N) product_variants               │  │
│  │  products (1) ----< (N) product_reviews                │  │
│  │  products (1) ----< (N) order_items                    │  │
│  │                                                          │  │
│  │  orders (1) ----< (N) order_items                      │  │
│  │  orders (1) ----o (1) coupons                          │  │
│  │                                                          │  │
│  │  coupons (1) ----< (N) coupon_usages                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             STORED PROCEDURES (25+)                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  • generate_order_number()                              │  │
│  │  • decrement_product_stock(product_id, quantity)        │  │
│  │  • decrement_variant_stock(variant_id, quantity)        │  │
│  │  • reserve_stock(product_id, quantity, ...)            │  │
│  │  • get_available_stock(product_id, variant_id)         │  │
│  │  • validate_coupon(code, email, subtotal, ...)         │  │
│  │  • calculate_product_rating(product_id)                │  │
│  │  • create_password_reset_token(email, ip, ...)         │  │
│  │  • log_login_attempt(email, success, ip, ...)          │  │
│  │  • upsert_cart(user_id, session_id, items, ...)        │  │
│  │  • merge_carts(user_id, session_id)                    │  │
│  │  • cleanup_expired_carts()                             │  │
│  │  • mark_abandoned_carts()                              │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             ROW LEVEL SECURITY (80+)                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ✅ Public read for active products                     │  │
│  │  ✅ Users can CRUD own cart                             │  │
│  │  ✅ Users can CRUD own addresses                        │  │
│  │  ✅ Users can create own reviews                        │  │
│  │  ✅ Admins can moderate reviews                         │  │
│  │  ✅ Service role bypasses RLS (admin client)            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Integraciones Externas

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   MERCADO PAGO                         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │  1. Checkout Pro (Preference API)                     │    │
│  │     - Redirect user to MP hosted checkout            │    │
│  │     - Handles payment collection                      │    │
│  │     - Returns to success/failure URL                  │    │
│  │                                                        │    │
│  │  2. Checkout API (Payment API)                        │    │
│  │     - Tokenized card payments                         │    │
│  │     - Direct API integration                          │    │
│  │     - Custom checkout UI                              │    │
│  │                                                        │    │
│  │  3. Webhooks (IPN)                                    │    │
│  │     - Payment status notifications                    │    │
│  │     - Merchant order updates                          │    │
│  │     - Chargebacks                                     │    │
│  │                                                        │    │
│  │  ⚠️  PROBLEMAS:                                       │    │
│  │     • Sin verificacion de firma                       │    │
│  │     • Currency hardcoded (UYU)                        │    │
│  │     • Sin retry mechanism                             │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               EMAIL (SMTP via Nodemailer)              │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │  1. Email Templates (React Email)                     │    │
│  │     - Email verification                              │    │
│  │     - Password reset                                  │    │
│  │     - Order confirmation                              │    │
│  │                                                        │    │
│  │  2. SMTP Configuration                                │    │
│  │     - Gmail SMTP (smtp.gmail.com:587)                 │    │
│  │     - App Password authentication                     │    │
│  │                                                        │    │
│  │  ⚠️  PROBLEMAS:                                       │    │
│  │     • Emails sincronicos (bloquean response)          │    │
│  │     • Sin retry mechanism                             │    │
│  │     • Sin queue                                       │    │
│  │     • Sin rate limiting                               │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              SUPABASE AUTH                             │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │  1. User Registration                                  │    │
│  │     - Email/password                                   │    │
│  │     - Email verification required                      │    │
│  │                                                        │    │
│  │  2. Authentication                                     │    │
│  │     - Session management                               │    │
│  │     - JWT tokens                                       │    │
│  │                                                        │    │
│  │  3. Database Sync                                      │    │
│  │     - Trigger on auth.users -> public.users           │    │
│  │     - Auto role assignment                             │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              SUPABASE STORAGE                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                        │    │
│  │  1. Buckets                                            │    │
│  │     - products (product images)                        │    │
│  │     - reviews (review images)                          │    │
│  │     - payment-proofs (bank transfer receipts)          │    │
│  │                                                        │    │
│  │  2. RLS Policies                                       │    │
│  │     - Public read for product images                   │    │
│  │     - Auth write for uploads                           │    │
│  │                                                        │    │
│  │  ⚠️  MEJORAS:                                         │    │
│  │     • Agregar CDN (Cloudflare)                        │    │
│  │     • Image optimization                               │    │
│  │     • Lazy loading                                     │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

### Estado General del Backend

**CALIFICACION: 7/10 (PRODUCCION CON RESERVAS)**

#### Fortalezas

1. **Arquitectura Solida:**
   - Separacion clara entre API routes y server actions
   - RLS bien implementado en Supabase
   - Migraciones organizadas y versionadas
   - Stored procedures para logica critica de negocio

2. **Features Completas:**
   - Sistema de autenticacion robusto
   - Carritos persistentes con reservas de stock
   - Reviews con moderacion
   - Sistema de cupones flexible
   - Integracion completa con Mercado Pago

3. **Seguridad de Datos:**
   - Row Level Security en todas las tablas
   - Validacion con Zod
   - Audit logs para eventos criticos
   - Password reset seguro con tokens

#### Debilidades Criticas

1. **Sin Rate Limiting:** Vulnerable a ataques de fuerza bruta y DDoS
2. **Webhook Sin Verificacion:** Cualquiera puede modificar ordenes
3. **Race Conditions en Stock:** Riesgo de sobreventa
4. **Sin Monitoreo:** Errores no detectados hasta que usuarios reportan

#### Plan de Accion Recomendado

**Semana 1:**
- Implementar rate limiting (Upstash)
- Verificar firma de webhooks de MP
- Configurar Sentry para error monitoring

**Semana 2-3:**
- Implementar caching con Redis
- Email queue con Inngest
- Activar sistema de reservas de stock

**Mes 1:**
- Optimizar indices de DB
- Logging estructurado
- Documentacion OpenAPI

**Backlog:**
- Tests automatizados
- CI/CD pipeline
- Load testing

---

**Generado por:** Claude Sonnet 4.5
**Fecha:** 13 de Diciembre, 2025
**Version:** 1.0
