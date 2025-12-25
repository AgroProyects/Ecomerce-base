# 📘 Ejemplo: Cómo Escribir un Test

Este documento muestra un ejemplo completo de cómo escribir un test para el proyecto.

---

## Ejemplo 1: Test Unitario Simple (Función Pura)

### Archivo a Testear: `lib/utils/format.ts`

```typescript
// lib/utils/format.ts
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
  }).format(price)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-UY')
}
```

### Test: `__tests__/unit/lib/utils/format.test.ts`

```typescript
import { formatPrice, formatDate } from '@/lib/utils/format'

describe('Format Utils', () => {
  describe('formatPrice', () => {
    it('should format price in UYU currency', () => {
      const result = formatPrice(1500)
      expect(result).toContain('$')
      expect(result).toContain('1')
      expect(result).toContain('500')
    })

    it('should handle zero', () => {
      const result = formatPrice(0)
      expect(result).toContain('0')
    })

    it('should handle decimals', () => {
      const result = formatPrice(1500.50)
      expect(result).toContain('1')
      expect(result).toContain('500')
    })

    it('should handle negative numbers', () => {
      const result = formatPrice(-1000)
      expect(result).toContain('-')
      expect(result).toContain('1')
      expect(result).toContain('000')
    })
  })

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = formatDate('2024-12-24')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should format Date object', () => {
      const date = new Date('2024-12-24')
      const result = formatDate(date)
      expect(result).toBeTruthy()
    })
  })
})
```

---

## Ejemplo 2: Test con Mocks (Server Action)

### Archivo a Testear: `actions/products/queries.ts`

```typescript
// actions/products/queries.ts
export async function getProductById(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
```

### Test: `__tests__/integration/actions/products/queries.test.ts`

```typescript
import { getProductById } from '@/actions/products/queries'
import { mockSupabaseClient, resetSupabaseMocks } from '@/mocks/supabase'
import { createMockProduct } from '@/test-utils/factories'

// Los mocks ya están configurados globalmente
// No necesitas hacer jest.mock() aquí

describe('Product Queries', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    resetSupabaseMocks()
  })

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = createMockProduct({
        id: 'test-123',
        name: 'Test Product',
      })

      // Mockear respuesta exitosa
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockProduct,
          error: null,
        })

      const result = await getProductById('test-123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProduct)
      expect(result.data?.name).toBe('Test Product')

      // Verificar que se llamó correctamente
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products')
    })

    it('should return error when product not found', async () => {
      // Mockear error
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Product not found' },
        })

      const result = await getProductById('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Product not found')
    })

    it('should handle database errors', async () => {
      // Mockear error de base de datos
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Database connection error' },
        })

      const result = await getProductById('test-123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database')
    })
  })
})
```

---

## Ejemplo 3: Test con Múltiples Mocks

### Archivo a Testear: `actions/checkout/process.ts` (simplificado)

```typescript
// actions/checkout/process.ts (simplificado para ejemplo)
export async function processCheckout(data: CheckoutData) {
  const supabase = createAdminClient()

  // 1. Verificar stock
  const { data: availableStock } = await supabase.rpc(
    'get_available_stock',
    { product_id: data.productId }
  )

  if (availableStock < data.quantity) {
    return { success: false, error: 'Stock insuficiente' }
  }

  // 2. Crear orden
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_email: data.email,
      total: data.total,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Crear preferencia de Mercado Pago
  const mpClient = getMercadoPagoClient()
  const preference = await mpClient.preference.create({
    items: [{ title: 'Order', unit_price: data.total, quantity: 1 }],
    external_reference: order.id,
  })

  return {
    success: true,
    data: {
      orderId: order.id,
      preferenceId: preference.id,
      initPoint: preference.init_point,
    },
  }
}
```

### Test: `__tests__/integration/actions/checkout/process.test.ts`

```typescript
import { processCheckout } from '@/actions/checkout/process'
import { mockSupabaseClient, resetSupabaseMocks } from '@/mocks/supabase'
import {
  mockMercadoPagoClient,
  resetMercadoPagoMocks,
} from '@/mocks/mercadopago'
import { createMockOrder, createMockCheckoutData } from '@/test-utils/factories'

describe('Checkout Process', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    resetMercadoPagoMocks()
  })

  it('should process checkout successfully', async () => {
    const checkoutData = createMockCheckoutData()
    const mockOrder = createMockOrder()

    // Mock 1: Verificar stock (suficiente)
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: 100, // Stock disponible
      error: null,
    })

    // Mock 2: Crear orden
    mockSupabaseClient.from().insert().select().single
      .mockResolvedValueOnce({
        data: mockOrder,
        error: null,
      })

    // Mock 3: Mercado Pago preference
    mockMercadoPagoClient.preference.create.mockResolvedValueOnce({
      id: 'pref-123',
      init_point: 'https://mercadopago.com/checkout/pref-123',
      external_reference: mockOrder.id,
    })

    const result = await processCheckout(checkoutData)

    expect(result.success).toBe(true)
    expect(result.data?.orderId).toBe(mockOrder.id)
    expect(result.data?.preferenceId).toBe('pref-123')
    expect(result.data?.initPoint).toContain('mercadopago.com')
  })

  it('should reject checkout with insufficient stock', async () => {
    const checkoutData = createMockCheckoutData()

    // Mock: Stock insuficiente
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: 0, // Sin stock
      error: null,
    })

    const result = await processCheckout(checkoutData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Stock insuficiente')

    // Verificar que NO se creó orden
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    // Verificar que NO se llamó a Mercado Pago
    expect(mockMercadoPagoClient.preference.create).not.toHaveBeenCalled()
  })

  it('should handle order creation errors', async () => {
    const checkoutData = createMockCheckoutData()

    // Mock: Stock OK
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: 100,
      error: null,
    })

    // Mock: Error al crear orden
    mockSupabaseClient.from().insert().select().single
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

    const result = await processCheckout(checkoutData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')

    // Verificar que NO se llamó a Mercado Pago
    expect(mockMercadoPagoClient.preference.create).not.toHaveBeenCalled()
  })
})
```

---

## Ejemplo 4: Test de Componente React

### Componente a Testear: `components/ui/button.tsx`

```typescript
// components/ui/button.tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}
```

### Test: `__tests__/components/ui/button.test.tsx`

```typescript
import { render, screen, fireEvent } from '@/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)

    const button = screen.getByText('Click me')

    expect(button).toBeDisabled()
  })

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn()

    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    )

    const button = screen.getByText('Click me')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should apply variant className', () => {
    const { container } = render(<Button variant="secondary">Click me</Button>)

    const button = container.querySelector('.btn-secondary')

    expect(button).toBeInTheDocument()
  })

  it('should use primary variant by default', () => {
    const { container } = render(<Button>Click me</Button>)

    const button = container.querySelector('.btn-primary')

    expect(button).toBeInTheDocument()
  })
})
```

---

## Patrones Comunes

### 1. Estructura de un Test

```typescript
describe('Feature/Module Name', () => {
  // Setup que se ejecuta antes de TODOS los tests
  beforeAll(() => {
    // Configuración global
  })

  // Cleanup que se ejecuta después de TODOS los tests
  afterAll(() => {
    // Limpieza global
  })

  // Setup que se ejecuta antes de CADA test
  beforeEach(() => {
    jest.clearAllMocks()
    resetSupabaseMocks()
  })

  // Cleanup que se ejecuta después de CADA test
  afterEach(() => {
    // Limpieza por test
  })

  describe('Specific Function/Method', () => {
    it('should do something specific', () => {
      // Arrange (preparar)
      const input = 'test'

      // Act (ejecutar)
      const result = functionToTest(input)

      // Assert (verificar)
      expect(result).toBe('expected')
    })
  })
})
```

### 2. Assertions Comunes

```typescript
// Igualdad
expect(value).toBe(expected)          // ===
expect(value).toEqual(expected)       // Deep equality
expect(value).not.toBe(expected)      // !==

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Números
expect(number).toBeGreaterThan(3)
expect(number).toBeGreaterThanOrEqual(3.5)
expect(number).toBeLessThan(5)
expect(number).toBeLessThanOrEqual(4.5)
expect(number).toBeCloseTo(0.3) // Para decimales

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Objects
expect(object).toHaveProperty('key')
expect(object).toMatchObject({ key: 'value' })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')

// Async
await expect(promise).resolves.toBe('value')
await expect(promise).rejects.toThrow()

// Mocks
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
expect(mockFn).toHaveBeenLastCalledWith(arg1)

// DOM (Testing Library)
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveClass('className')
expect(element).toHaveTextContent('text')
```

### 3. Mockear Funciones

```typescript
// Crear mock
const mockFn = jest.fn()

// Mock con retorno
const mockFn = jest.fn().mockReturnValue('value')

// Mock con retorno una sola vez
mockFn.mockReturnValueOnce('first').mockReturnValueOnce('second')

// Mock async
const mockFn = jest.fn().mockResolvedValue('value')
const mockFn = jest.fn().mockRejectedValue(new Error('error'))

// Reset mocks
mockFn.mockClear()          // Limpia llamadas
mockFn.mockReset()          // Limpia todo
mockFn.mockRestore()        // Restaura implementación original
```

---

## Checklist para Escribir Tests

- [ ] **Descripción clara** - El nombre del test describe exactamente qué verifica
- [ ] **Arrange-Act-Assert** - Estructura clara de preparación, ejecución y verificación
- [ ] **Un concepto por test** - Cada test verifica una sola cosa
- [ ] **Independiente** - No depende de otros tests ni del orden de ejecución
- [ ] **Repetible** - Da el mismo resultado cada vez que se ejecuta
- [ ] **Limpieza** - Usa beforeEach/afterEach para limpiar mocks y estado
- [ ] **Coverage** - Incluye casos felices, edge cases y errores

---

## Próximos Pasos

1. Revisa estos ejemplos
2. Elige un archivo para testear (recomiendo empezar con `lib/stock/reservations.ts`)
3. Crea el archivo de test correspondiente
4. Escribe los tests siguiendo los patrones de este documento
5. Ejecuta `npm run test:watch` para ver resultados en tiempo real

¿Listo para escribir tu primer test real? 🚀
