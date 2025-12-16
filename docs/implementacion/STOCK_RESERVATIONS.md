# Sistema de Reservas de Stock - Implementación Completa

## 📋 Tabla de Contenidos

1. [Resumen](#resumen)
2. [Problema que Resuelve](#problema-que-resuelve)
3. [Arquitectura](#arquitectura)
4. [Base de Datos](#base-de-datos)
5. [API de Reservas](#api-de-reservas)
6. [Integración en Checkout](#integración-en-checkout)
7. [Cleanup Automático](#cleanup-automático)
8. [Endpoints Admin](#endpoints-admin)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Resumen

El Sistema de Reservas de Stock está **100% implementado** para prevenir overselling cuando múltiples usuarios compran el mismo producto simultáneamente.

### ✅ Estado de Implementación

- ✅ **Tabla de Reservas**: `stock_reservations` con estados y expiración
- ✅ **Funciones SQL**: `reserve_stock`, `release_reservation`, `complete_reservation`, `cleanup_expired_reservations`
- ✅ **API TypeScript**: Wrapper completo para todas las operaciones
- ✅ **Integración Checkout**: Reserva automática en `processCheckout`
- ✅ **Cleanup Worker**: Job automático cada 5 minutos para liberar reservas expiradas
- ✅ **Endpoints Admin**: Monitoreo y gestión de reservas
- ✅ **Stock Endpoint Público**: Consulta de disponibilidad en tiempo real

### 🎯 Beneficios Clave

1. **Previene Overselling**: Múltiples usuarios no pueden comprar el mismo stock
2. **Tiempo Limitado**: Reservas expiran en 15 minutos si no se completan
3. **Stock en Tiempo Real**: Considera tanto stock físico como reservas activas
4. **Rollback Automático**: Si falla checkout, reservas se liberan automáticamente
5. **Transparencia**: Usuarios y admins pueden ver stock disponible real

---

## Problema que Resuelve

### Sin Reservas de Stock

```
Usuario A: Ve 1 producto disponible → Inicia checkout
Usuario B: Ve 1 producto disponible → Inicia checkout
Usuario A: Completa pago → Stock = 0
Usuario B: Completa pago → ❌ OVERSELLING! Stock = -1
```

**Resultado**: Vendemos más de lo que tenemos. Necesitamos cancelar una orden manualmente.

### Con Reservas de Stock

```
Usuario A: Ve 1 producto disponible → Inicia checkout → ✓ Stock reservado
Usuario B: Ve 0 productos disponibles → ❌ No puede agregar al carrito
Usuario A: Completa pago → Reserva convertida en orden → Stock = 0
Usuario B: Debe esperar a que haya más stock
```

**Resultado**: Solo vendemos lo que tenemos. No hay overselling.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT PROCESS                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  1. Check Stock Availability  │
        │  (checkStockAvailability)     │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  2. Reserve Stock (15 min)    │
        │  (reserveCartStock)           │
        │  - Creates active reservations│
        │  - Blocks stock from others   │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  3. Create Order              │
        │  (Supabase insert)            │
        └───────────┬───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────┐
        │  4. Complete Reservations     │
        │  (completeCartReservations)   │
        │  - Mark as 'completed'        │
        │  - Decrement actual stock     │
        │  - Link to order              │
        └───────────────────────────────┘

        ┌───────────────────────────────┐
        │  CLEANUP WORKER (Every 5 min) │
        │  - Finds expired reservations │
        │  - Marks as 'expired'         │
        │  - Frees up stock             │
        └───────────────────────────────┘
```

---

## Base de Datos

### Migración: [supabase/migrations/010_stock_reservations.sql](../../supabase/migrations/010_stock_reservations.sql)

#### Tabla: `stock_reservations`

```sql
CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Producto/variante reservado
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

  -- Cantidad reservada
  quantity INTEGER NOT NULL CHECK (quantity > 0),

  -- Usuario/sesión
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT, -- Para usuarios no autenticados

  -- Estado
  status reservation_status DEFAULT 'active',
  -- 'active' | 'completed' | 'expired' | 'cancelled'

  -- Referencia a orden
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL, -- ⏱ Momento de expiración
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### Función: `get_available_stock()`

Calcula stock disponible = stock total - reservas activas

```sql
SELECT get_available_stock(
  p_product_id := 'uuid-del-producto',
  p_variant_id := NULL
);
-- Retorna: INTEGER (stock disponible)
```

#### Función: `reserve_stock()`

Crea una reserva temporal de stock

```sql
SELECT reserve_stock(
  p_product_id := 'uuid-del-producto',
  p_variant_id := NULL,
  p_quantity := 2,
  p_user_id := 'uuid-del-usuario',
  p_session_id := NULL,
  p_expires_in_minutes := 15
);
-- Retorna: UUID (reservation_id)
-- Lanza excepción si stock insuficiente
```

#### Función: `release_reservation()`

Libera una reserva (cancelación)

```sql
SELECT release_reservation(
  p_reservation_id := 'uuid-de-reserva',
  p_reason := 'cancelled' -- o 'expired'
);
-- Retorna: BOOLEAN
```

#### Función: `complete_reservation()`

Completa una reserva (convierte en orden real)

```sql
SELECT complete_reservation(
  p_reservation_id := 'uuid-de-reserva',
  p_order_id := 'uuid-de-orden'
);
-- Retorna: BOOLEAN
-- Decrementa stock real del producto/variante
```

#### Función: `cleanup_expired_reservations()`

Marca reservas expiradas como `expired`

```sql
SELECT cleanup_expired_reservations();
-- Retorna: INTEGER (cantidad de reservas expiradas)
```

---

## API de Reservas

### [lib/stock/reservations.ts](../../lib/stock/reservations.ts)

#### 1. getAvailableStock()

Obtiene stock disponible en tiempo real

```typescript
import { getAvailableStock } from '@/lib/stock/reservations'

const available = await getAvailableStock({
  productId: 'uuid-producto',
})
// Retorna: number
```

---

#### 2. reserveStock()

Reserva stock para un item

```typescript
import { reserveStock } from '@/lib/stock/reservations'

const reservationId = await reserveStock({
  productId: 'uuid-producto',
  quantity: 2,
  userId: 'uuid-usuario',
  expiresInMinutes: 15, // Opcional, default: 15
})
// Retorna: string (reservation ID)
// Lanza Error si stock insuficiente
```

---

#### 3. reserveCartStock()

Reserva stock para múltiples items (carrito completo)

```typescript
import { reserveCartStock } from '@/lib/stock/reservations'

const reservationIds = await reserveCartStock({
  items: [
    { productId: 'uuid-1', quantity: 2 },
    { variantId: 'uuid-v1', quantity: 1 },
  ],
  userId: 'uuid-usuario',
  expiresInMinutes: 15,
})
// Retorna: string[] (array de reservation IDs)
// Si falla 1 item, hace rollback de todos
```

---

#### 4. releaseReservation()

Libera una reserva

```typescript
import { releaseReservation } from '@/lib/stock/reservations'

await releaseReservation('reservation-id', 'cancelled')
// Marca reserva como 'cancelled' o 'expired'
```

---

#### 5. completeReservation()

Completa una reserva (después de crear orden)

```typescript
import { completeReservation } from '@/lib/stock/reservations'

await completeReservation('reservation-id', 'order-id')
// Marca como 'completed' y decrementa stock real
```

---

#### 6. completeCartReservations()

Completa múltiples reservas

```typescript
import { completeCartReservations } from '@/lib/stock/reservations'

await completeCartReservations(['res-id-1', 'res-id-2'], 'order-id')
// Completa todas las reservas del carrito
```

---

#### 7. checkStockAvailability()

Verifica disponibilidad antes de reservar

```typescript
import { checkStockAvailability } from '@/lib/stock/reservations'

const check = await checkStockAvailability([
  { productId: 'uuid-1', quantity: 2 },
  { variantId: 'uuid-v1', quantity: 1 },
])

if (!check.available) {
  console.log('Items no disponibles:', check.unavailableItems)
  // [{productId, requested: 2, available: 1}]
}
```

---

## Integración en Checkout

### [actions/checkout/process.ts](../../actions/checkout/process.ts)

El flujo de checkout ahora incluye 4 pasos:

```typescript
export async function processCheckout(input) {
  // PASO 1: Verificar disponibilidad
  const stockCheck = await checkStockAvailability(items)
  if (!stockCheck.available) {
    return { error: 'Stock insuficiente' }
  }

  // PASO 2: Reservar stock (15 minutos)
  const reservationIds = await reserveCartStock({
    items,
    userId: session?.user?.id,
    expiresInMinutes: 15,
  })

  // PASO 3: Crear orden en base de datos
  const order = await supabase.from('orders').insert({ ... })

  // PASO 4: Completar reservas
  await completeCartReservations(reservationIds, order.id)
  // Esto decrementa el stock real

  return { success: true, order }
}
```

**Importante**: Si el checkout falla después del PASO 2, las reservas se liberarán automáticamente cuando expiren (15 minutos).

---

## Cleanup Automático

### Cleanup Worker

El worker ejecuta automáticamente cada 5 minutos:

```bash
# Iniciar worker
npm run worker:cleanup

# Con PM2 (producción)
pm2 start "npm run worker:cleanup" --name cleanup-worker
pm2 save
```

### [lib/queue/cleanup-worker.ts](../../lib/queue/cleanup-worker.ts)

```typescript
// Ejecuta cada 5 minutos
async function cleanupExpiredReservationsJob() {
  const count = await cleanupExpiredReservations()
  // Marca reservas expiradas como 'expired'
  return { reservationsExpired: count }
}
```

### Manual Cleanup

También se puede ejecutar manualmente:

```bash
curl -X POST http://localhost:3000/api/admin/reservations/cleanup \
  -H "Cookie: next-auth.session-token=xxx"
```

---

## Endpoints Admin

### 1. GET /api/admin/reservations

Obtiene todas las reservas activas

```bash
curl http://localhost:3000/api/admin/reservations \
  -H "Cookie: next-auth.session-token=xxx"
```

**Response:**

```json
{
  "reservations": [
    {
      "id": "uuid",
      "product_name": "Camisa Azul",
      "quantity": 2,
      "user_email": "user@example.com",
      "expires_at": "2025-12-15T10:45:00Z",
      "seconds_until_expiration": 720
    }
  ],
  "count": 1
}
```

---

### 2. DELETE /api/admin/reservations/[id]

Libera una reserva manualmente

```bash
curl -X DELETE http://localhost:3000/api/admin/reservations/uuid \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 3. POST /api/admin/reservations/cleanup

Ejecuta limpieza manual de reservas expiradas

```bash
curl -X POST http://localhost:3000/api/admin/reservations/cleanup \
  -H "Cookie: next-auth.session-token=xxx"
```

**Response:**

```json
{
  "success": true,
  "reservationsExpired": 5,
  "message": "5 reservas expiradas limpiadas"
}
```

---

### 4. GET /api/products/[slug]/stock

Obtiene stock disponible de un producto (PÚBLICO)

```bash
curl http://localhost:3000/api/products/camisa-azul/stock
```

**Response:**

```json
{
  "productId": "uuid",
  "productName": "Camisa Azul",
  "trackInventory": true,
  "totalStock": 10,
  "availableStock": 7,
  "reservedStock": 3,
  "stockStatus": "in_stock"
}
```

**Stock Status**:
- `in_stock`: Disponible >= 6
- `low_stock`: Disponible entre 1-5
- `out_of_stock`: Disponible = 0

---

## Testing

### Test 1: Reservar Stock

```typescript
import { reserveStock, getAvailableStock } from '@/lib/stock/reservations'

// 1. Ver stock inicial
const initial = await getAvailableStock({ productId: 'uuid' })
console.log('Initial stock:', initial) // 10

// 2. Reservar 3 unidades
const resId = await reserveStock({
  productId: 'uuid',
  quantity: 3,
  userId: 'user-uuid',
})
console.log('Reserved:', resId)

// 3. Ver stock disponible
const available = await getAvailableStock({ productId: 'uuid' })
console.log('Available after reservation:', available) // 7

// 4. Liberar reserva
await releaseReservation(resId, 'cancelled')

// 5. Ver stock disponible
const final = await getAvailableStock({ productId: 'uuid' })
console.log('Available after release:', final) // 10
```

---

### Test 2: Overselling Prevention

```typescript
// Producto con stock = 1
const productId = 'uuid'

// Usuario A reserva 1 unidad
const resA = await reserveStock({ productId, quantity: 1, userId: 'user-a' })
// ✓ OK

// Usuario B intenta reservar 1 unidad
try {
  const resB = await reserveStock({ productId, quantity: 1, userId: 'user-b' })
  // ❌ Nunca llega aquí
} catch (error) {
  console.error(error.message)
  // "Stock insuficiente. Disponible: 0, Solicitado: 1"
}
```

---

### Test 3: Expiración Automática

```typescript
// Reservar con 1 minuto de expiración
const resId = await reserveStock({
  productId: 'uuid',
  quantity: 5,
  userId: 'user-uuid',
  expiresInMinutes: 1,
})

// Ver stock
const before = await getAvailableStock({ productId: 'uuid' })
console.log('Stock before expiration:', before) // 5 (10 - 5 reservados)

// Esperar 61 segundos
await new Promise((resolve) => setTimeout(resolve, 61000))

// Ejecutar cleanup
await cleanupExpiredReservations()

// Ver stock
const after = await getAvailableStock({ productId: 'uuid' })
console.log('Stock after expiration:', after) // 10 (reserva expirada)
```

---

## Troubleshooting

### Problema: Stock insuficiente pero hay stock físico

**Síntomas**: Error "Stock insuficiente" pero la tabla `products` muestra stock > 0

**Diagnóstico**:

```sql
-- Ver reservas activas del producto
SELECT * FROM active_reservations
WHERE product_id = 'uuid-del-producto';

-- Ver stock real vs disponible
SELECT
  p.name,
  p.stock as total_stock,
  get_available_stock(p.id, NULL) as available_stock,
  p.stock - get_available_stock(p.id, NULL) as reserved_stock
FROM products p
WHERE p.id = 'uuid-del-producto';
```

**Solución**:
```bash
# Limpiar reservas expiradas manualmente
curl -X POST http://localhost:3000/api/admin/reservations/cleanup
```

---

### Problema: Reservas no expiran

**Síntomas**: Reservas activas con `expires_at` en el pasado

**Diagnóstico**:

```bash
# Verificar que cleanup worker esté corriendo
pm2 status cleanup-worker

# Ver logs del worker
pm2 logs cleanup-worker
```

**Solución**:

```bash
# Reiniciar worker
pm2 restart cleanup-worker

# O ejecutar cleanup manual
curl -X POST http://localhost:3000/api/admin/reservations/cleanup
```

---

### Problema: Stock se decrementa dos veces

**Síntomas**: Stock baja más de lo esperado después de una orden

**Causa**: `completeReservation` ya decrementa el stock. No se debe decrementar manualmente.

**Solución**: Asegurarse de que `processCheckout` NO decrementa stock directamente. Solo debe llamar a `completeCartReservations`.

```typescript
// ❌ MAL - Decrementa manualmente
await supabase.from('products').update({ stock: stock - quantity })
await completeCartReservations(reservationIds, orderId)

// ✅ BIEN - Solo completa reservas
await completeCartReservations(reservationIds, orderId)
// Esta función ya decrementa el stock internamente
```

---

## Mejores Prácticas

### ✅ DO - Qué Hacer

#### 1. Siempre verificar stock antes de reservar

```typescript
// ✅ BIEN
const check = await checkStockAvailability(items)
if (check.available) {
  await reserveCartStock(items)
}

// ❌ MAL - Reservar sin verificar
await reserveCartStock(items) // Puede fallar
```

#### 2. Manejar errores de stock insuficiente

```typescript
// ✅ BIEN
try {
  await reserveCartStock(items)
} catch (error) {
  if (error.message.includes('Stock insuficiente')) {
    return { error: 'Algunos productos no están disponibles' }
  }
  throw error
}

// ❌ MAL - Dejar error sin manejar
await reserveCartStock(items) // Puede crashear
```

#### 3. Usar TTL apropiado

```typescript
// ✅ BIEN - 15 minutos para checkout
await reserveStock({ ..., expiresInMinutes: 15 })

// ❌ MAL - 24 horas (bloquea stock mucho tiempo)
await reserveStock({ ..., expiresInMinutes: 1440 })
```

#### 4. Completar reservas después de crear orden

```typescript
// ✅ BIEN - Orden creada exitosamente
const order = await createOrder(...)
await completeCartReservations(reservationIds, order.id)

// ❌ MAL - Completar antes de crear orden
await completeCartReservations(reservationIds, 'order-no-creada-aun')
```

---

### ❌ DON'T - Qué NO Hacer

#### 1. NO decrementar stock manualmente

```typescript
// ❌ MAL
await supabase.from('products').update({ stock: stock - quantity })

// ✅ BIEN - completeReservation ya lo hace
await completeReservation(reservationId, orderId)
```

#### 2. NO ignorar reservas en queries de stock

```typescript
// ❌ MAL - Solo ver stock total
const { data } = await supabase.from('products').select('stock')

// ✅ BIEN - Ver stock disponible (considera reservas)
const available = await getAvailableStock({ productId })
```

#### 3. NO crear reservas con expiración indefinida

```typescript
// ❌ MAL - Sin expiración
INSERT INTO stock_reservations (expires_at) VALUES (NULL)

// ✅ BIEN - Siempre con expiración
await reserveStock({ expiresInMinutes: 15 })
```

#### 4. NO olvidar limpiar reservas expiradas

```typescript
// ❌ MAL - Worker no corriendo
// Reservas se acumulan y bloquean stock

// ✅ BIEN - Worker siempre corriendo
pm2 start "npm run worker:cleanup" --name cleanup-worker
```

---

## Resumen de Archivos

### SQL (1 archivo)
- ✅ [supabase/migrations/010_stock_reservations.sql](../../supabase/migrations/010_stock_reservations.sql)

### Core API (1 archivo)
- ✅ [lib/stock/reservations.ts](../../lib/stock/reservations.ts)

### Integración Checkout (1 archivo modificado)
- ✅ [actions/checkout/process.ts](../../actions/checkout/process.ts)

### Cleanup Worker (3 archivos)
- ✅ [lib/queue/cleanup-queue.ts](../../lib/queue/cleanup-queue.ts)
- ✅ [lib/queue/cleanup-worker.ts](../../lib/queue/cleanup-worker.ts)
- ✅ [scripts/start-cleanup-worker.ts](../../scripts/start-cleanup-worker.ts)

### Endpoints Admin (4 archivos)
- ✅ [app/api/admin/reservations/route.ts](../../app/api/admin/reservations/route.ts)
- ✅ [app/api/admin/reservations/[id]/route.ts](../../app/api/admin/reservations/[id]/route.ts)
- ✅ [app/api/admin/reservations/cleanup/route.ts](../../app/api/admin/reservations/cleanup/route.ts)
- ✅ [app/api/products/[slug]/stock/route.ts](../../app/api/products/[slug]/stock/route.ts)

---

## Deployment en Producción

### 1. Ejecutar Migración

```bash
# Aplicar migración a la base de datos
# (Usar Supabase CLI o ejecutar SQL manualmente en dashboard)
```

### 2. Iniciar Cleanup Worker

```bash
pm2 start "npm run worker:cleanup" --name cleanup-worker
pm2 save
pm2 startup
```

### 3. Monitoreo

```bash
# Ver reservas activas
curl http://localhost:3000/api/admin/reservations

# Ver logs del worker
pm2 logs cleanup-worker

# Ver estadísticas de queue
curl http://localhost:3000/api/admin/queue/stats
```

---

**Implementado**: ✅ 100% Completo
**Producción**: ✅ Listo para deploy
**Previene Overselling**: ✅ Sí, completamente
