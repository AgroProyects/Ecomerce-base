# Sistema de Pedidos - Guía Completa

## Índice
1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Métodos de Pago](#métodos-de-pago)
4. [Estados de Pedidos](#estados-de-pedidos)
5. [Backend (Server Actions)](#backend-server-actions)
6. [Componentes del Frontend](#componentes-del-frontend)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [Emails de Notificación](#emails-de-notificación)
9. [Panel de Administración](#panel-de-administración)

---

## Descripción General

El sistema de pedidos (orders) es el núcleo del e-commerce. Permite a los clientes realizar compras y a los administradores gestionar todo el ciclo de vida de los pedidos, desde la creación hasta la entrega.

### Características Principales
✅ Múltiples métodos de pago (Mercado Pago, Transferencia Bancaria, Efectivo)
✅ Upload de comprobantes de pago para transferencias
✅ Gestión completa de estados de pedidos
✅ Notificaciones automáticas por email
✅ Panel de administración completo
✅ Integración con sistema de stock
✅ Soporte para variantes de productos
✅ Descuentos y costos de envío

---

## Estructura de Base de Datos

### Tabla: `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',

  -- Cliente
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Direcciones
  shipping_address JSONB,
  billing_address JSONB,

  -- Totales
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Notas
  notes TEXT,
  admin_notes TEXT,

  -- Pago
  payment_method VARCHAR(50),  -- 'mercadopago', 'bank_transfer', 'cash_on_delivery'
  payment_proof_url TEXT,      -- URL del comprobante de transferencia
  mp_payment_id VARCHAR(255),
  mp_preference_id VARCHAR(255),
  mp_status VARCHAR(50),
  mp_status_detail VARCHAR(255),
  mp_payment_method VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

### Tabla: `order_items`

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Producto
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),

  -- Cantidades y precios
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enum: `order_status`

```sql
CREATE TYPE order_status AS ENUM (
  'pending',          -- Pendiente (inicial)
  'pending_payment',  -- Esperando pago (transferencias)
  'paid',            -- Pagado
  'processing',      -- Procesando
  'shipped',         -- Enviado
  'delivered',       -- Entregado
  'cancelled',       -- Cancelado
  'refunded'         -- Reembolsado
);
```

---

## Métodos de Pago

### 1. Mercado Pago (`mercadopago`)

**Características:**
- Pago en línea seguro
- Redirección a Mercado Pago
- Confirmación automática
- Soporte para tarjetas de crédito/débito

**Flujo:**
1. Cliente selecciona Mercado Pago
2. Se crea la preferencia de pago
3. Cliente es redirigido a MP
4. Webhook confirma el pago
5. Estado cambia a `paid`

**Implementación:**
```typescript
// TODO: Integración con SDK de Mercado Pago
// https://www.mercadopago.com.ar/developers
```

### 2. Transferencia Bancaria (`bank_transfer`)

**Características:**
- Pago manual por transferencia
- Upload de comprobante obligatorio
- Verificación manual por admin
- Estado inicial: `pending_payment`

**Flujo:**
1. Cliente selecciona transferencia
2. Ve datos bancarios
3. Realiza transferencia
4. Sube comprobante
5. Admin verifica
6. Admin cambia estado a `paid`

**Datos bancarios (configurar en admin):**
```typescript
const bankData = {
  bank: 'Banco Nación',
  holder: 'Tu Empresa SRL',
  cuit: 'XX-XXXXXXXX-X',
  cbu: 'XXXX XXXX XXXX XXXX XXXX XX',
  alias: 'TU.EMPRESA.MERCADO',
};
```

### 3. Efectivo contra Entrega (`cash_on_delivery`)

**Características:**
- Pago al recibir el pedido
- Sin comprobante necesario
- Estado inicial: `pending`
- Se marca `paid` al entregar

**Flujo:**
1. Cliente selecciona efectivo
2. Orden queda en `pending`
3. Se prepara y envía
4. Al entregar, se marca `delivered` y `paid`

---

## Estados de Pedidos

### Diagrama de Estados

```
pending
  ↓
pending_payment (solo transferencias)
  ↓
paid
  ↓
processing
  ↓
shipped
  ↓
delivered

(Desde cualquier estado previo a delivered)
  ↓
cancelled / refunded
```

### Estados Detallados

| Estado | Descripción | Acciones Admin | Email |
|--------|-------------|----------------|-------|
| `pending` | Orden recibida | Marcar pagado, Cancelar | ✅ Confirmación |
| `pending_payment` | Esperando pago | Marcar pagado, Cancelar | ✅ Recordatorio |
| `paid` | Pago confirmado | Procesar, Reembolsar | ✅ Confirmación pago |
| `processing` | Preparando pedido | Marcar enviado, Cancelar | ✅ En preparación |
| `shipped` | Enviado | Marcar entregado | ✅ Envío |
| `delivered` | Entregado | - | ✅ Entrega |
| `cancelled` | Cancelado | - | ✅ Cancelación |
| `refunded` | Reembolsado | - | ✅ Reembolso |

---

## Backend (Server Actions)

### Ubicación
```
actions/
├── orders/
│   ├── index.ts          # Exportaciones
│   ├── queries.ts        # Consultas
│   └── mutations.ts      # Mutaciones (CREATE, UPDATE)
```

### Queries

#### `getOrders(params)`
Obtiene pedidos con filtros y paginación.

```typescript
const result = await getOrders({
  page: 1,
  pageSize: 20,
  status: 'paid',
  search: 'Juan',
});

// Retorna:
{
  data: Order[],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 150,
    totalPages: 8,
    hasMore: true,
  }
}
```

#### `getOrderById(id)`
Obtiene un pedido por ID.

```typescript
const order = await getOrderById('uuid-here');
```

#### `getOrderWithItems(id)`
Obtiene pedido con sus items.

```typescript
const result = await getOrderWithItems('uuid-here');
// { order: Order, items: OrderItem[] }
```

#### `getOrderStats()`
Obtiene estadísticas de pedidos.

```typescript
const stats = await getOrderStats();
// {
//   totalOrders: 150,
//   todayOrders: 5,
//   totalRevenue: 125000,
//   byStatus: { paid: 100, shipped: 30, ... }
// }
```

### Mutations

#### `createOrder(data)`
Crea un nuevo pedido.

```typescript
const result = await createOrder({
  customer_email: 'cliente@email.com',
  customer_name: 'Juan Pérez',
  customer_phone: '+54911XXXXXXXX',
  shipping_address: {
    street: 'Av. Corrientes',
    number: '1234',
    floor: '5',
    apartment: 'B',
    city: 'CABA',
    state: 'Buenos Aires',
    postal_code: '1043',
    country: 'Argentina',
  },
  items: [
    {
      product_id: 'uuid-producto',
      variant_id: 'uuid-variante',
      product_name: 'Remera',
      variant_name: 'Talle M / Rojo',
      quantity: 2,
      unit_price: 5000,
      total_price: 10000,
    },
  ],
  payment_method: 'bank_transfer',
  shipping_cost: 1500,
  discount_amount: 0,
});

if (result.success) {
  console.log(result.data); // Order creada
}
```

**Nota**: Al crear una orden:
- Se genera número de orden único
- Se decrementan stocks automáticamente
- Se calcula el total
- Se determina estado inicial según método de pago
- Se envía email de confirmación

#### `updateOrderStatus({ id, status, notes })`
Actualiza el estado de un pedido.

```typescript
const result = await updateOrderStatus({
  id: 'order-uuid',
  status: 'shipped',
  notes: 'Enviado por Correo Argentino',
});
```

**Nota**: Al cambiar el estado se envía email automático al cliente.

#### `uploadPaymentProof({ order_id, payment_proof_url })`
Sube comprobante de pago para una orden.

```typescript
const result = await uploadPaymentProof({
  order_id: 'order-uuid',
  payment_proof_url: 'https://storage.supabase.co/...',
});
```

#### `updateOrderNotes({ id, notes })`
Actualiza notas administrativas.

```typescript
const result = await updateOrderNotes({
  id: 'order-uuid',
  notes: 'Cliente solicitó entrega urgente',
});
```

---

## Componentes del Frontend

### 1. OrderStatusBadge

Badge visual para mostrar el estado de un pedido.

```tsx
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';

<OrderStatusBadge status="paid" />
```

**Colores y íconos:**
- `pending`: Amarillo (Clock)
- `pending_payment`: Naranja (DollarSign)
- `paid`: Verde (CheckCircle)
- `processing`: Azul (Package)
- `shipped`: Índigo (Truck)
- `delivered`: Verde esmeralda (PackageCheck)
- `cancelled`: Rojo (XCircle)
- `refunded`: Púrpura (RotateCcw)

### 2. OrderList

Lista de pedidos para el admin con filtros.

```tsx
import { OrderList } from '@/components/admin/OrderList';

<OrderList
  orders={orders}
  totalPages={10}
  currentPage={1}
  onPageChange={(page) => { /* ... */ }}
  onSearch={(term) => { /* ... */ }}
  onFilterStatus={(status) => { /* ... */ }}
  onFilterPaymentMethod={(method) => { /* ... */ }}
/>
```

**Características:**
- Búsqueda por número, cliente o email
- Filtro por estado
- Filtro por método de pago
- Paginación
- Vista de tabla

### 3. OrderDetails

Vista detallada de un pedido con acciones admin.

```tsx
import { OrderDetails } from '@/components/admin/OrderDetails';

<OrderDetails order={order} items={items} />
```

**Características:**
- Información completa del pedido
- Datos del cliente
- Dirección de envío
- Items con precios
- Método de pago y comprobante
- Cambio rápido de estado
- Acciones de gestión
- Notas administrativas

### 4. PaymentMethodSelector

Selector de método de pago para checkout.

```tsx
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';

<PaymentMethodSelector
  selectedMethod={paymentMethod}
  onSelectMethod={setPaymentMethod}
  onPaymentProofUrl={setProofUrl}
/>
```

**Características:**
- 3 métodos de pago
- Upload de comprobante para transferencias
- Información bancaria
- Validación de archivos (imagen/PDF)
- Preview de comprobante

---

## Flujos de Trabajo

### Flujo 1: Compra con Mercado Pago

1. **Cliente**: Llena datos de envío
2. **Cliente**: Selecciona Mercado Pago
3. **Sistema**: Crea orden con `status: pending`
4. **Sistema**: Crea preferencia de MP
5. **Cliente**: Es redirigido a MP
6. **Cliente**: Completa pago en MP
7. **MP**: Envía webhook de confirmación
8. **Sistema**: Actualiza orden a `paid`
9. **Sistema**: Envía email de confirmación
10. **Admin**: Ve orden en dashboard
11. **Admin**: Marca como `processing`
12. **Admin**: Marca como `shipped`
13. **Admin**: Marca como `delivered`

### Flujo 2: Compra con Transferencia

1. **Cliente**: Llena datos de envío
2. **Cliente**: Selecciona Transferencia
3. **Cliente**: Ve datos bancarios
4. **Cliente**: Realiza transferencia bancaria
5. **Cliente**: Sube comprobante de pago
6. **Sistema**: Crea orden con `status: pending_payment`
7. **Sistema**: Guarda comprobante en Supabase Storage
8. **Sistema**: Envía email con instrucciones
9. **Admin**: Recibe notificación
10. **Admin**: Verifica comprobante
11. **Admin**: Marca como `paid`
12. **Sistema**: Envía email de confirmación de pago
13. **Admin**: Continúa con preparación y envío

### Flujo 3: Compra con Efectivo

1. **Cliente**: Llena datos de envío
2. **Cliente**: Selecciona Efectivo contra entrega
3. **Sistema**: Crea orden con `status: pending`
4. **Sistema**: Envía email de confirmación
5. **Admin**: Prepara pedido (`processing`)
6. **Admin**: Envía pedido (`shipped`)
7. **Repartidor**: Entrega y cobra
8. **Admin**: Marca como `paid` y `delivered`

---

## Emails de Notificación

### 1. Confirmación de Orden

**Cuándo**: Al crear la orden
**Template**: `order-confirmation.tsx`

**Contenido:**
- Número de orden
- Resumen de productos
- Totales (subtotal, envío, descuento, total)
- Dirección de envío
- Método de pago
- CTA: Ver estado del pedido

### 2. Actualización de Estado

**Cuándo**: Al cambiar el estado de la orden
**Template**: `order-status-update.tsx`

**Contenido:**
- Nuevo estado con badge de color
- Mensaje específico del estado
- Número de orden
- Información adicional (tracking, etc.)
- CTA: Ver detalles

**Mensajes por Estado:**
- `paid`: "Tu pago ha sido confirmado"
- `processing`: "Estamos preparando tu pedido"
- `shipped`: "Tu pedido está en camino"
- `delivered`: "¡Tu pedido ha sido entregado!"

### Configuración de Envío

```typescript
// En actions/orders/mutations.ts

import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '@/lib/email/send-order-emails';

// Al crear orden
await sendOrderConfirmationEmail({
  order,
  items,
  storeName: 'Mi Tienda',
  storeUrl: 'https://mitienda.com',
});

// Al cambiar estado
await sendOrderStatusUpdateEmail({
  order,
  newStatus: 'shipped',
  storeName: 'Mi Tienda',
  storeUrl: 'https://mitienda.com',
});
```

---

## Panel de Administración

### Página de Listado: `/admin/orders`

**Características:**
- Vista de tabla de todos los pedidos
- Filtros por estado
- Búsqueda por número/cliente/email
- Paginación
- Acceso rápido a detalles

**URL de ejemplo:**
```
/admin/orders
/admin/orders?status=paid
/admin/orders?status=pending_payment&page=2
```

### Página de Detalle: `/admin/orders/[id]`

**Características:**
- Vista completa del pedido
- Información del cliente
- Items con precios y totales
- Dirección de envío
- Método de pago y comprobante
- Selector de estado con botones rápidos
- Notas del cliente y administrativas
- Historial de cambios

**Acciones Disponibles:**
- Cambiar estado
- Marcar como pagado
- Marcar como procesando
- Marcar como enviado
- Marcar como entregado
- Cancelar pedido
- Agregar/editar notas administrativas
- Ver comprobante de pago (si existe)

---

## Mejores Prácticas

### 1. Gestión de Stock

```typescript
// Siempre decrementar stock al crear orden
for (const item of items) {
  if (item.variant_id) {
    await supabase.rpc('decrement_variant_stock', {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    });
  } else {
    await supabase.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }
}
```

### 2. Validación de Comprobantes

Para transferencias bancarias:
- Validar formato de archivo (imagen o PDF)
- Tamaño máximo: 5MB
- Almacenar en bucket privado
- Generar nombre único: `{order_id}/{timestamp}-{filename}`

### 3. Seguridad

- Usar RLS en Supabase para proteger datos
- Solo admins pueden cambiar estados
- Clientes solo pueden ver sus propias órdenes
- Comprobantes en bucket privado
- Validar todos los inputs

### 4. Notificaciones

- Enviar email en cada cambio de estado importante
- No spamear: evitar emails redundantes
- Templates personalizables
- Incluir siempre número de orden
- CTA claro para seguimiento

---

## Troubleshooting

### Error: Stock insuficiente
**Solución**: Validar stock antes de crear orden. Mostrar mensaje claro al usuario.

### Error: Comprobante no se sube
**Solución**:
1. Verificar que el bucket 'payment-proofs' exista en Supabase
2. Verificar políticas RLS del bucket
3. Validar tamaño y tipo de archivo
4. Revisar logs en consola

### Orden no actualiza estado
**Solución**:
1. Verificar permisos de usuario
2. Revisar logs de server actions
3. Verificar que la orden exista
4. Validar transición de estados

### Email no se envía
**Solución**:
1. Verificar configuración de Nodemailer
2. Revisar credenciales de Gmail
3. Ver logs de `send-order-emails.ts`
4. Confirmar que el template renderiza correctamente

---

## Próximas Mejoras

1. **Integración completa con Mercado Pago**
   - SDK oficial
   - Webhooks
   - Gestión de preferencias
   - Reembolsos automáticos

2. **Tracking de Envío**
   - Integración con correos (OCA, Andreani, etc.)
   - Número de tracking
   - Estado de envío en tiempo real

3. **Dashboard de Estadísticas**
   - Gráficos de ventas
   - Productos más vendidos
   - Revenue por período
   - Métodos de pago más usados

4. **Exportación de Reportes**
   - CSV de pedidos
   - Facturas en PDF
   - Reportes de ventas
   - Etiquetas de envío

5. **Gestión de Devoluciones**
   - Proceso de devolución
   - Restock automático
   - Gestión de reembolsos

---

## Migración de Base de Datos

Para aplicar los cambios de base de datos, ejecutar el script SQL:

```bash
psql -h db.supabase.co -U postgres -d postgres -f supabase/orders-migration.sql
```

O ejecutar manualmente en el editor SQL de Supabase Dashboard:

[Ver supabase/orders-migration.sql](supabase/orders-migration.sql)

**Importante**: Crear el bucket 'payment-proofs' en Supabase Storage:

1. Ir a Storage en Supabase Dashboard
2. Create bucket
3. Name: `payment-proofs`
4. Public: No (privado)
5. Create

Luego configurar las políticas RLS para permitir uploads autenticados.

---

## Resumen

El sistema de pedidos está completamente implementado con:
- ✅ 3 métodos de pago (Mercado Pago, Transferencia, Efectivo)
- ✅ Upload de comprobantes para transferencias
- ✅ 8 estados de pedido con flujos completos
- ✅ Panel de administración completo
- ✅ Emails automáticos de notificación
- ✅ Integración con sistema de stock
- ✅ Soporte para variantes de productos
- ✅ Gestión de descuentos y costos de envío

**Archivos Clave**:
- `schemas/order.schema.ts` - Validaciones
- `actions/orders/` - Backend logic
- `components/admin/OrderDetails.tsx` - Vista detalle
- `components/admin/OrderList.tsx` - Listado
- `components/checkout/PaymentMethodSelector.tsx` - Selector de pago
- `lib/email/templates/` - Templates de emails
- `app/(admin)/admin/orders/` - Páginas del admin

¡El sistema está listo para producción!
