/**
 * Utilidades para procesamiento y optimización de imágenes
 */

// Generar blur placeholder (base64) para imágenes
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) {
    // Fallback para SSR - blur placeholder genérico
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Crear gradiente gris suave
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/png')
}

// Validar tipo de archivo de imagen
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'] as const
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as const

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; error: string }

export function validateImageFile(file: File, maxSizeMB: number = 5): ImageValidationResult {
  // Validar tipo MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    }
  }

  // Validar extensión
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: `Extensión no permitida. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  // Validar tamaño
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
    }
  }

  // Validar nombre (sin path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Nombre de archivo inválido'
    }
  }

  return { valid: true }
}

// Comprimir imagen antes de subir
export async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Redimensionar si es necesario
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'))
          return
        }

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Error al comprimir imagen'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('Error al cargar imagen'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Error al leer archivo'))
    reader.readAsDataURL(file)
  })
}

// Generar nombre único para imagen
export function generateImageFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedName = originalName
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 20)

  return `${sanitizedName}-${timestamp}-${randomString}.${extension}`
}

// Calcular dimensiones manteniendo aspect ratio
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  // Ajustar por ancho máximo
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  // Ajustar por alto máximo si se especifica
  if (maxHeight && height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

// Obtener URL de imagen optimizada de Supabase
export function getOptimizedImageUrl(
  publicUrl: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg'
  }
): string {
  if (!publicUrl) return ''

  // Si la URL ya tiene parámetros de transformación, retornarla
  if (publicUrl.includes('/render/image/')) return publicUrl

  const url = new URL(publicUrl)
  const params = new URLSearchParams()

  if (options?.width) params.set('width', options.width.toString())
  if (options?.height) params.set('height', options.height.toString())
  if (options?.quality) params.set('quality', options.quality.toString())
  if (options?.format) params.set('format', options.format)

  const queryString = params.toString()
  return queryString ? `${publicUrl}?${queryString}` : publicUrl
}

// Tipos para facilitar el uso
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original'

export const IMAGE_SIZES: Record<ImageSize, { width: number; height?: number }> = {
  thumbnail: { width: 128, height: 128 },
  small: { width: 256 },
  medium: { width: 512 },
  large: { width: 1024 },
  original: { width: 1920 },
}

// Obtener sizes attribute para responsive images
export function getImageSizes(layout?: 'card' | 'hero' | 'gallery' | 'avatar'): string {
  switch (layout) {
    case 'card':
      return '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw'
    case 'hero':
      return '100vw'
    case 'gallery':
      return '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
    case 'avatar':
      return '(min-width: 1024px) 48px, (min-width: 768px) 40px, 32px'
    default:
      return '100vw'
  }
}
