'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getImageSizes } from '@/lib/image-utils'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  layout?: 'card' | 'hero' | 'gallery' | 'avatar'
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  showSkeleton?: boolean
  fallbackSrc?: string
}

/**
 * Componente de imagen optimizado con:
 * - Blur placeholder automático
 * - Lazy loading
 * - Formatos modernos (AVIF, WebP)
 * - Responsive sizes
 * - Error handling con fallback
 * - Skeleton loading
 */
export function OptimizedImage({
  src,
  alt,
  layout = 'card',
  aspectRatio,
  showSkeleton = true,
  fallbackSrc = '/images/placeholder.png',
  className,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Calcular aspect ratio class
  const aspectRatioClass = aspectRatio
    ? {
        square: 'aspect-square',
        video: 'aspect-video',
        portrait: 'aspect-[3/4]',
        landscape: 'aspect-[4/3]',
      }[aspectRatio]
    : undefined

  // Determinar el src a usar (original o fallback)
  const imageSrc = hasError ? fallbackSrc : src

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass, className)}>
      {/* Skeleton loader */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
      )}

      {/* Imagen optimizada */}
      <Image
        src={imageSrc}
        alt={alt}
        sizes={props.sizes || getImageSizes(layout)}
        priority={priority}
        quality={90}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        {...props}
      />
    </div>
  )
}
