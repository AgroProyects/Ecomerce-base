'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, X, Expand } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { IMAGES } from '@/lib/constants/config'
import { Button } from '@/components/ui/button'

interface ProductGalleryProps {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  const displayImages = images.length > 0 ? images : [IMAGES.PLACEHOLDER]

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    )
  }, [displayImages.length])

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    )
  }, [displayImages.length])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') setIsLightboxOpen(false)
  }, [goToPrevious, goToNext])

  return (
    <>
      <div className="flex flex-col gap-4" onKeyDown={handleKeyDown} tabIndex={0}>
        {/* Main Image */}
        <div className="relative">
          <div
            className={cn(
              'relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900',
              isZoomed && 'cursor-zoom-out'
            )}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={`${name} - Imagen ${selectedIndex + 1}`}
              fill
              className={cn(
                'object-cover transition-transform duration-300',
                isZoomed && 'scale-150'
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : undefined
              }
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            {/* Zoom indicator */}
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" />
              {isZoomed ? 'Click para salir' : 'Pasá el mouse para zoom'}
            </div>
          </div>

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Fullscreen button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Expand className="h-5 w-5" />
          </Button>

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl transition-all duration-200',
                    selectedIndex === index
                      ? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-50'
                      : 'ring-1 ring-zinc-200 hover:ring-zinc-400 dark:ring-zinc-800 dark:hover:ring-zinc-600'
                  )}
                >
                  <Image
                    src={image}
                    alt={`${name} - Miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {selectedIndex === index && (
                    <div className="absolute inset-0 bg-zinc-900/10 dark:bg-zinc-50/10" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dot indicators for mobile */}
        {displayImages.length > 1 && (
          <div className="flex justify-center gap-2 sm:hidden">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  selectedIndex === index
                    ? 'w-6 bg-zinc-900 dark:bg-zinc-50'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setIsLightboxOpen(false)}
          onKeyDown={handleKeyDown}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 h-12 w-12 rounded-full text-white hover:bg-white/10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          {displayImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={`${name} - Imagen ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}

          {/* Thumbnails in lightbox */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-2">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={cn(
                    'relative h-14 w-14 overflow-hidden rounded-lg transition-all',
                    selectedIndex === index
                      ? 'ring-2 ring-white'
                      : 'opacity-50 hover:opacity-100'
                  )}
                >
                  <Image
                    src={image}
                    alt={`${name} - Miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
