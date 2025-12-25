/**
 * Test Utilities
 *
 * Utilidades y helpers para testing de componentes React
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

/**
 * Custom render que incluye todos los providers necesarios
 */
interface AllTheProvidersProps {
  children: ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  // Aquí puedes agregar providers que tus componentes necesiten
  // Por ejemplo: QueryClientProvider, ThemeProvider, etc.

  return <>{children}</>
}

/**
 * Render customizado que envuelve el componente con providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-exportar todo de testing library
export * from '@testing-library/react'
export { customRender as render }

/**
 * Helper para esperar por actualizaciones asíncronas
 */
export const waitForNextUpdate = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/**
 * Helper para mockear un FormData
 */
export const createMockFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          formData.append(`${key}[]`, item)
        })
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
  })

  return formData
}

/**
 * Helper para crear un archivo mock
 */
export const createMockFile = (
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File => {
  const blob = new Blob(['a'.repeat(size)], { type })
  return new File([blob], name, { type })
}

/**
 * Helper para crear múltiples archivos mock
 */
export const createMockFiles = (count: number = 3): File[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockFile(`test-${i + 1}.jpg`)
  )
}

/**
 * Helper para mockear un evento de input
 */
export const createMockInputEvent = (value: string) => ({
  target: { value },
  currentTarget: { value },
})

/**
 * Helper para mockear un evento de change
 */
export const createMockChangeEvent = (name: string, value: any) => ({
  target: { name, value },
  currentTarget: { name, value },
})

/**
 * Helper para mockear Request de Next.js
 */
export const createMockRequest = (options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  json?: () => Promise<any>
} = {}): Request => {
  const {
    method = 'GET',
    url = 'http://localhost:3000',
    headers = {},
    body = null,
    json = async () => ({}),
  } = options

  const request = {
    method,
    url,
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
      has: (key: string) => key.toLowerCase() in headers,
      forEach: (callback: (value: string, key: string) => void) => {
        Object.entries(headers).forEach(([key, value]) => callback(value, key))
      },
    },
    json,
    text: async () => JSON.stringify(body),
    body: body ? JSON.stringify(body) : null,
  } as unknown as Request

  return request
}

/**
 * Helper para mockear Response de Next.js
 */
export const createMockResponse = (
  body: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
    body: JSON.stringify(body),
  } as unknown as Response
}

/**
 * Helper para esperar por un tiempo específico
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Helper para verificar si un componente renderiza sin errores
 */
export const renderWithoutErrors = (ui: ReactElement) => {
  const consoleError = console.error
  const errors: any[] = []

  console.error = (...args: any[]) => {
    errors.push(args)
  }

  try {
    const result = render(ui)
    console.error = consoleError

    if (errors.length > 0) {
      throw new Error(`Component rendered with errors: ${errors.join(', ')}`)
    }

    return result
  } catch (error) {
    console.error = consoleError
    throw error
  }
}

/**
 * Helper para limpiar mocks entre tests
 */
export const clearAllMocks = () => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
}
