import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea un precio con el símbolo de moneda
 */
export function formatPrice(
  price: number,
  options: {
    currency?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    currency = 'ARS',
    locale = 'es-AR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(price)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(
  value: number,
  options: {
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    locale = 'es-AR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: es })
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: es })
}

/**
 * Retorna tiempo relativo (hace X minutos, etc.)
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es })
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Calcula el porcentaje de descuento
 */
export function calculateDiscount(price: number, comparePrice: number): number {
  if (comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

/**
 * Formatea un número de orden
 */
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`
}

/**
 * Trunca texto con ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}
