# FASE 1: SETUP Y TESTS CRÍTICOS

## Objetivo
Configurar el entorno de testing e implementar los tests más críticos del sistema (stock reservations, checkout, webhooks).

---

## SEMANA 1: CONFIGURACIÓN BASE + STOCK RESERVATIONS

### Día 1: Setup Inicial

#### 1.1 Instalación de Dependencias
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @testing-library/react-hooks \
  jest-environment-jsdom \
  @types/jest \
  ts-jest \
  msw \
  @faker-js/faker \
  redis-mock
```

#### 1.2 Crear jest.config.js
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'actions/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 75,
      lines: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

#### 1.3 Crear jest.setup.js
```javascript
import '@testing-library/jest-dom'

// Environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.MP_ACCESS_TOKEN = 'test-mp-token'
process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
```

#### 1.4 Crear estructura de carpetas
```bash
mkdir -p __tests__/unit/lib/stock
mkdir -p __tests__/unit/lib/mercadopago
mkdir -p __tests__/unit/lib/utils
mkdir -p __tests__/unit/hooks
mkdir -p __tests__/unit/schemas
mkdir -p __tests__/integration/actions/checkout
mkdir -p __tests__/integration/actions/products
mkdir -p __tests__/integration/api/webhooks
mkdir -p __tests__/components/checkout
mkdir -p __tests__/components/store
mkdir -p mocks
mkdir -p test-utils
```

#### 1.5 Scripts en package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

### Día 2: Mocks Base

#### 2.1 mocks/supabase.ts
```typescript
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://...' } })),
    })),
  },
}

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabaseClient,
}))

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient,
}))
```

#### 2.2 mocks/mercadopago.ts
```typescript
export const mockMercadoPagoClient = {
  preference: {
    create: jest.fn().mockResolvedValue({
      id: 'pref-123',
      init_point: 'https://mercadopago.com/checkout/pref-123',
    }),
  },
  payment: {
    get: jest.fn().mockResolvedValue({
      id: '123456',
      status: 'approved',
      external_reference: 'order-uuid',
      payment_method_id: 'visa',
      status_detail: 'accredited',
    }),
  },
}

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: () => mockMercadoPagoClient,
}))
```

#### 2.3 test-utils/factories.ts
```typescript
import { faker } from '@faker-js/faker'

export const createMockProduct = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  slug: faker.helpers.slugify(faker.commerce.productName().toLowerCase()),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  stock: faker.number.int({ min: 0, max: 100 }),
  images: [faker.image.url()],
  track_inventory: true,
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

export const createMockVariant = (productId: string, overrides = {}) => ({
  id: faker.string.uuid(),
  product_id: productId,
  name: faker.commerce.productAdjective(),
  price_override: faker.datatype.boolean() ? parseFloat(faker.commerce.price()) : null,
  stock: faker.number.int({ min: 0, max: 50 }),
  sku: faker.string.alphanumeric(8).toUpperCase(),
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: faker.string.uuid(),
  order_number: `ORD-${faker.number.int({ min: 1000, max: 9999 })}`,
  status: 'pending',
  customer_email: faker.internet.email(),
  customer_name: faker.person.fullName(),
  customer_phone: faker.phone.number(),
  subtotal: parseFloat(faker.commerce.price()),
  shipping_cost: 150,
  discount_amount: 0,
  total: parseFloat(faker.commerce.price()),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
})

export const createMockCartItem = (overrides = {}) => ({
  id: faker.string.uuid(),
  product: createMockProduct(),
  variant: null,
  quantity: faker.number.int({ min: 1, max: 5 }),
  unitPrice: parseFloat(faker.commerce.price()),
  totalPrice: 0,
  ...overrides,
})
```

---

### Días 3-5: Tests de Stock Reservations

#### 3.1 __tests__/unit/lib/stock/reservations.test.ts

**Objetivo**: 95% coverage de `lib/stock/reservations.ts`

**Casos de prueba principales**:
1. `getAvailableStock()`: stock disponible = total - reservas activas
2. `reserveStock()`: creación exitosa, rechazo por stock insuficiente
3. `releaseReservation()`: liberación con diferentes motivos
4. `completeReservation()`: completar y decrementar stock
5. `reserveCartStock()`: múltiples items + rollback en error
6. `checkStockAvailability()`: verificación item por item

Ver archivo completo en: `docs/testing/ejemplos/stock-reservations.test.ts`

---

## SEMANA 2: CHECKOUT Y WEBHOOKS

### Días 1-3: Tests de Checkout Process

#### __tests__/integration/actions/checkout/process.test.ts

**Objetivo**: 90% coverage de `actions/checkout/process.ts`

**Casos de prueba principales**:
1. Validación de schema de input
2. Verificación de stock antes de reservar
3. Flujo completo Mercado Pago
4. Flujo completo Transferencia Bancaria
5. Flujo completo Efectivo Contraentrega
6. Aplicación de cupones
7. Cálculo de shipping
8. Rollback en errores

Ver archivo completo en: `docs/testing/ejemplos/checkout-process.test.ts`

---

### Días 4-5: Tests de Webhooks

#### __tests__/unit/lib/mercadopago/verify-webhook.test.ts

**Objetivo**: 95% coverage de `lib/mercadopago/verify-webhook.ts`

**Casos de prueba**:
1. Firma válida: retorna true
2. Falta x-signature: retorna false
3. Timestamp muy antiguo: retorna false
4. Hash incorrecto: retorna false
5. Construcción correcta del manifest

Ver archivo completo en: `docs/testing/ejemplos/verify-webhook.test.ts`

---

#### __tests__/unit/lib/mercadopago/webhooks.test.ts

**Objetivo**: 90% coverage de `lib/mercadopago/webhooks.ts`

**Casos de prueba**:
1. Procesar pago aprobado
2. Procesar pago rechazado
3. Procesar reembolso
4. Actualizar stock
5. Manejar orden no encontrada

Ver archivo completo en: `docs/testing/ejemplos/webhooks.test.ts`

---

#### __tests__/integration/api/webhooks/mercadopago.test.ts

**Objetivo**: 85% coverage de `app/api/webhooks/mercadopago/route.ts`

**Casos de prueba**:
1. Webhook válido procesado correctamente
2. Rechazo de webhook sin firma
3. Rechazo de webhook con firma inválida
4. Rate limiting aplicado
5. Ignorar webhooks que no son "payment"

Ver archivo completo en: `docs/testing/ejemplos/webhook-api.test.ts`

---

## CHECKLIST DE FASE 1

### Setup (Semana 1 - Día 1)
- [ ] Instalar dependencias
- [ ] Configurar jest.config.js
- [ ] Configurar jest.setup.js
- [ ] Crear estructura de carpetas
- [ ] Agregar scripts npm
- [ ] Verificar que `npm test` corre sin errores

### Mocks (Semana 1 - Día 2)
- [ ] Mock de Supabase completo
- [ ] Mock de Mercado Pago completo
- [ ] Mock de Redis/Upstash
- [ ] Factories de datos con Faker
- [ ] Test utilities configuradas

### Tests Stock Reservations (Semana 1 - Días 3-5)
- [ ] Test: getAvailableStock()
- [ ] Test: reserveStock()
- [ ] Test: releaseReservation()
- [ ] Test: completeReservation()
- [ ] Test: reserveCartStock()
- [ ] Test: checkStockAvailability()
- [ ] Coverage >= 95%

### Tests Checkout (Semana 2 - Días 1-3)
- [ ] Test: Validación de schemas
- [ ] Test: Flujo Mercado Pago completo
- [ ] Test: Flujo Transferencia Bancaria
- [ ] Test: Flujo Efectivo
- [ ] Test: Aplicación de cupones
- [ ] Test: Rollback en errores
- [ ] Coverage >= 90%

### Tests Webhooks (Semana 2 - Días 4-5)
- [ ] Test: verify-webhook.ts (95%+)
- [ ] Test: webhooks.ts (90%+)
- [ ] Test: API route (85%+)
- [ ] Test: Actualización de stock
- [ ] Test: Idempotencia

---

## COMANDOS ÚTILES

```bash
# Correr todos los tests
npm test

# Correr tests en modo watch
npm run test:watch

# Generar reporte de coverage
npm run test:coverage

# Correr solo tests unitarios
npm run test:unit

# Correr solo tests de integración
npm run test:integration

# Correr tests de un archivo específico
npm test -- reservations.test.ts

# Ver coverage de un archivo específico
npm run test:coverage -- --collectCoverageFrom="lib/stock/reservations.ts"
```

---

## CRITERIOS DE ÉXITO - FASE 1

✅ **Setup completo y funcionando**
✅ **Stock Reservations: 95%+ coverage**
✅ **Checkout Process: 90%+ coverage**
✅ **Webhook Verification: 95%+ coverage**
✅ **Webhook Processing: 90%+ coverage**
✅ **API Route Webhooks: 85%+ coverage**
✅ **Todos los tests pasan (0 failures)**
✅ **Suite completa corre en < 30 segundos**

Una vez completada la Fase 1, estaremos listos para continuar con la Fase 2: Carrito y Seguridad.

---

**Última actualización**: 2024-12-24
