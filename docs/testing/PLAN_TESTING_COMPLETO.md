# PLAN DE TESTING COMPLETO - E-COMMERCE

## Estado Actual
- **Fecha de creación**: 2024-12-24
- **Cobertura actual**: 0% (sin tests implementados)
- **Framework**: Jest + React Testing Library
- **Estado**: Pendiente de implementación

---

## 1. RESUMEN EJECUTIVO

Este plan establece una estrategia completa de testing para el e-commerce, organizada en 5 fases progresivas desde lo más crítico (pagos, stock, órdenes) hasta cobertura completa (UI, E2E).

### Objetivos de Cobertura
- **Global**: 80% statements, 75% branches
- **Módulos Críticos**: 90-95%
- **Tiempo de ejecución**: < 2 minutos

---

## 2. PRIORIZACIÓN DE ÁREAS

### 🔴 CRÍTICO (Afecta dinero, stock, órdenes)
1. **Checkout y Pagos** - `actions/checkout/process.ts`
2. **Sistema de Reservas de Stock** - `lib/stock/reservations.ts`
3. **Webhooks Mercado Pago** - `lib/mercadopago/webhooks.ts`
4. **Verificación de Webhooks** - `lib/mercadopago/verify-webhook.ts`
5. **Actualización de Stock** - `actions/products/stock.ts`

### 🟠 ALTO (Autenticación, datos críticos)
1. **Carrito** - `hooks/use-cart.ts`, `lib/cart/index.ts`
2. **Schemas de Validación** - `schemas/checkout.schema.ts`
3. **Rate Limiting** - `lib/middleware/rate-limit.ts`
4. **Autenticación** - `actions/auth/*`
5. **Shipping Calculator** - `actions/shipping/*`

### 🟡 MEDIO (Funcionalidad core)
1. **Gestión de Productos** - `actions/products/*`
2. **Reviews** - `actions/reviews/*`
3. **Utilidades** - `lib/utils/*`
4. **Server Actions** - Diversas acciones

### 🟢 BAJO (UX, edge cases)
1. **Componentes UI**
2. **Hooks menores**
3. **Formateo y slugs**

---

## 3. FASES DE IMPLEMENTACIÓN

### FASE 1: SETUP + CRÍTICO (Semanas 1-2)

#### Semana 1: Configuración Base
- [ ] Instalar dependencias de testing
- [ ] Configurar Jest + Testing Library
- [ ] Crear mocks de Supabase
- [ ] Crear mocks de Mercado Pago
- [ ] Crear mocks de Redis/Upstash
- [ ] Configurar factories de datos
- [ ] Tests: Stock Reservations (90%+ coverage)

#### Semana 2: Checkout & Webhooks
- [ ] Tests: Checkout Process (90%+ coverage)
- [ ] Tests: Webhook Verification (95%+ coverage)
- [ ] Tests: Webhook Processing (90%+ coverage)
- [ ] Tests: API Route Webhooks (85%+ coverage)
- [ ] Tests: Schemas de Checkout (90%+ coverage)

### FASE 2: ALTO (Semanas 3-4)

#### Semana 3: Carrito & Seguridad
- [ ] Tests: useCart Hook (90%+ coverage)
- [ ] Tests: Cart Mutations (85%+ coverage)
- [ ] Tests: Rate Limiting (90%+ coverage)
- [ ] Tests: Auth Actions (85%+ coverage)
- [ ] Tests: Shipping Calculator (85%+ coverage)

#### Semana 4: Componentes Críticos
- [ ] Tests: CheckoutWizard (80%+ coverage)
- [ ] Tests: CartDrawer (75%+ coverage)
- [ ] Tests: PaymentMethodSelector (80%+ coverage)
- [ ] Tests: VariantSelector (75%+ coverage)

### FASE 3: MEDIO (Semanas 5-6)

#### Semana 5: Productos & Validaciones
- [ ] Tests: Product Schemas (85%+ coverage)
- [ ] Tests: Product Actions CRUD (80%+ coverage)
- [ ] Tests: Variant Actions (80%+ coverage)
- [ ] Tests: Review Actions (75%+ coverage)
- [ ] Tests: Validation Utils (85%+ coverage)

#### Semana 6: Componentes & Utilidades
- [ ] Tests: ProductCard (70%+ coverage)
- [ ] Tests: ReviewForm (75%+ coverage)
- [ ] Tests: Format Utils (80%+ coverage)
- [ ] Tests: Slug Utils (85%+ coverage)

### FASE 4: E2E (Semanas 7-8)

#### Semana 7: Setup E2E
- [ ] Configurar Playwright
- [ ] Test E2E: Flujo compra Mercado Pago
- [ ] Test E2E: Flujo transferencia bancaria
- [ ] Test E2E: Aplicación de cupones

#### Semana 8: Refinamiento
- [ ] Test E2E: Stock agotado
- [ ] Test E2E: Webhook flow
- [ ] Generar reportes de coverage
- [ ] Documentar resultados

---

## 4. CONFIGURACIÓN TÉCNICA

### Dependencias Necesarias
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @types/jest \
  ts-jest \
  msw \
  @faker-js/faker
```

### Scripts NPM
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:unit": "jest --testPathPattern=__tests__/unit",
  "test:integration": "jest --testPathPattern=__tests__/integration",
  "test:ci": "jest --ci --coverage --maxWorkers=2"
}
```

---

## 5. ESTRUCTURA DE ARCHIVOS

```
eccomerce_base/
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── stock/
│   │   │   │   └── reservations.test.ts
│   │   │   ├── mercadopago/
│   │   │   │   ├── verify-webhook.test.ts
│   │   │   │   └── webhooks.test.ts
│   │   │   └── utils/
│   │   │       ├── validation.test.ts
│   │   │       ├── format.test.ts
│   │   │       └── slug.test.ts
│   │   ├── hooks/
│   │   │   └── use-cart.test.ts
│   │   └── schemas/
│   │       └── checkout.schema.test.ts
│   ├── integration/
│   │   ├── actions/
│   │   │   ├── checkout/
│   │   │   │   └── process.test.ts
│   │   │   └── products/
│   │   │       └── stock.test.ts
│   │   └── api/
│   │       └── webhooks/
│   │           └── mercadopago.test.ts
│   └── components/
│       ├── checkout/
│       │   └── CheckoutWizard.test.tsx
│       └── store/
│           └── cart-item.test.tsx
├── mocks/
│   ├── server.ts
│   ├── supabase.ts
│   ├── mercadopago.ts
│   └── redis.ts
├── test-utils/
│   ├── index.tsx
│   └── factories.ts
├── jest.config.js
└── jest.setup.js
```

---

## 6. TESTS CRÍTICOS - DETALLE

### 6.1 Stock Reservations (lib/stock/reservations.ts)

**Cobertura objetivo**: 95%

**Casos de prueba**:
- ✅ `getAvailableStock()`: cálculo correcto, solo reservas activas
- ✅ `reserveStock()`: creación exitosa, rechazo por stock insuficiente
- ✅ `releaseReservation()`: liberación correcta, estados cancelled/expired
- ✅ `completeReservation()`: completar y decrementar stock real
- ✅ `reserveCartStock()`: múltiples items, rollback en error
- ✅ `checkStockAvailability()`: verificación por item

**Edge cases**:
- Reservas concurrentes del mismo producto
- Expiración automática después de 15 minutos
- Rollback si falla alguna reserva del carrito

### 6.2 Checkout Process (actions/checkout/process.ts)

**Cobertura objetivo**: 90%

**Casos de prueba**:
- ✅ Validación de schema (email, phone, address)
- ✅ Verificación de stock antes de reservar
- ✅ Reserva de stock (15 min)
- ✅ Creación de orden con datos correctos
- ✅ Aplicación de cupón y registro de uso
- ✅ Cálculo de shipping según departamento
- ✅ Creación de preferencia Mercado Pago
- ✅ Flujos: MP, transferencia, efectivo
- ✅ Rollback de reservas si falla

**Edge cases**:
- Stock insuficiente en medio del checkout
- Cupón expirado o max usos alcanzados
- Error de MP al crear preferencia
- Mix de productos con/sin variantes

### 6.3 Webhook Verification (lib/mercadopago/verify-webhook.ts)

**Cobertura objetivo**: 95%

**Casos de prueba**:
- ✅ Firma válida: retorna true
- ✅ Falta x-signature: retorna false
- ✅ Falta x-request-id: retorna false
- ✅ Timestamp muy antiguo (>5min): retorna false
- ✅ Hash incorrecto: retorna false
- ✅ Construcción correcta del manifest

**Edge cases**:
- Timestamps en el límite (4:59 vs 5:01)
- Headers con formato incorrecto
- Comparación case-insensitive de hashes

### 6.4 Webhook Processing (lib/mercadopago/webhooks.ts)

**Cobertura objetivo**: 90%

**Casos de prueba**:
- ✅ Procesar pago aprobado: status "paid", stock decrementado
- ✅ Procesar pago rechazado: status "cancelled"
- ✅ Procesar reembolso: status "refunded"
- ✅ Actualizar mp_payment_id, mp_status
- ✅ Decrementar stock de productos y variantes
- ✅ Manejar orden no encontrada

**Edge cases**:
- Webhook duplicado (idempotencia)
- Orden ya procesada
- Error al decrementar stock

### 6.5 useCart Hook (hooks/use-cart.ts)

**Cobertura objetivo**: 90%

**Casos de prueba**:
- ✅ `addItem()`: agregar nuevo, incrementar existente
- ✅ `updateQuantity()`: actualizar, respetar max_stock
- ✅ `removeItem()`: eliminar por product_id + variant_id
- ✅ Cálculo de subtotal, discount, shipping, total
- ✅ `applyCoupon()`: porcentual, fijo, límite máximo
- ✅ Persistencia en localStorage
- ✅ Uso de price_override de variante

**Edge cases**:
- Descuento excede subtotal
- Datos corruptos en localStorage
- Cambio de precio después de agregar al carrito

---

## 7. MOCKS NECESARIOS

### Mock de Supabase
- Crear cliente mock con from(), select(), insert(), update(), rpc()
- Simular respuestas exitosas y errores
- Mockear Auth (getSession, signIn, signOut)

### Mock de Mercado Pago
- Mockear preference.create()
- Mockear payment.get()
- Simular respuestas de API

### Mock de Redis/Upstash
- Mockear rate limiting con redis-mock
- Simular límites alcanzados

### MSW (Mock Service Worker)
- Interceptar requests HTTP a APIs externas
- Simular webhooks entrantes

---

## 8. MÉTRICAS DE ÉXITO

### Cobertura Mínima
- **Global**: 80% statements, 75% branches
- **Módulos Críticos**: 90-95%

### Indicadores
- ✅ Todos los tests críticos pasan antes de deploy
- ✅ Suite completa < 2 minutos
- ✅ Cero flaky tests
- ✅ Tests de regresión para cada bug

---

## 9. DOCUMENTOS RELACIONADOS

- [Guía de Implementación Testing](./GUIA_IMPLEMENTACION_TESTING.md)
- [Ejemplos de Tests](./EJEMPLOS_TESTS.md)
- [Configuración Jest](./CONFIGURACION_JEST.md)

---

## 10. PRÓXIMOS PASOS

1. **Revisar y aprobar este plan**
2. **Comenzar Fase 1 - Semana 1**: Setup + Stock Reservations
3. **Ejecutar tests incrementalmente**
4. **Documentar resultados y edge cases encontrados**
5. **Iterar según findings**

---

**Última actualización**: 2024-12-24
**Responsable**: Equipo de Desarrollo
**Estado**: Pendiente de aprobación
