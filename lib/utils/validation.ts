import { ZodError, ZodSchema } from 'zod'

/**
 * Resultado de validación
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

/**
 * Valida datos contra un schema de Zod
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validData = schema.parse(data)
    return {
      success: true,
      data: validData,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {}

      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })

      return {
        success: false,
        errors,
      }
    }

    throw error
  }
}

/**
 * Valida FormData contra un schema de Zod
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  formData: FormData
): ValidationResult<T> {
  const data = Object.fromEntries(formData.entries())
  return validate(schema, data)
}

/**
 * Parsea FormData a un objeto con tipos correctos
 */
export function parseFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    // Handle arrays (multiple values with same key)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2)
      if (!data[arrayKey]) {
        data[arrayKey] = []
      }
      (data[arrayKey] as unknown[]).push(parseValue(value))
    } else if (data[key]) {
      // Convert to array if key already exists
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]]
      }
      (data[key] as unknown[]).push(parseValue(value))
    } else {
      data[key] = parseValue(value)
    }
  })

  return data
}

/**
 * Parsea un valor de FormData al tipo correcto
 */
function parseValue(value: FormDataEntryValue): unknown {
  if (value instanceof File) {
    return value
  }

  const stringValue = value.toString()

  // Try to parse as JSON
  if (
    (stringValue.startsWith('{') && stringValue.endsWith('}')) ||
    (stringValue.startsWith('[') && stringValue.endsWith(']'))
  ) {
    try {
      return JSON.parse(stringValue)
    } catch {
      return stringValue
    }
  }

  // Try to parse as number
  if (stringValue !== '' && !isNaN(Number(stringValue))) {
    return Number(stringValue)
  }

  // Try to parse as boolean
  if (stringValue === 'true') return true
  if (stringValue === 'false') return false

  // Handle null/undefined
  if (stringValue === 'null') return null
  if (stringValue === 'undefined') return undefined

  return stringValue
}

/**
 * Formatea errores de Zod para mostrar al usuario
 */
export function formatZodErrors(error: ZodError): string {
  return error.issues
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ')
}
