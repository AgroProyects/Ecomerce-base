import slugifyLib from 'slugify'

/**
 * Genera un slug URL-friendly a partir de un texto
 */
export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'es',
  })
}

/**
 * Genera un slug único agregando un sufijo aleatorio
 */
export function uniqueSlug(text: string): string {
  const base = slugify(text)
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

/**
 * Valida si un string es un slug válido
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}
