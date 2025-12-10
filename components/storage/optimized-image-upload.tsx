'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  validateImageFile,
  compressImage,
  generateImageFileName,
} from '@/lib/image-utils'
import { toast } from 'sonner'
import Image from 'next/image'

interface OptimizedImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  maxSizeMB?: number
  bucket?: 'products' | 'categories' | 'users' | 'banners'
  compressBeforeUpload?: boolean
  showPreview?: boolean
  className?: string
}

/**
 * Componente de upload de imágenes optimizado con:
 * - Validación client-side
 * - Compresión automática
 * - Preview de imágenes
 * - Multi-upload
 * - Drag & drop
 * - Progress indicator
 */
export function OptimizedImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSizeMB = 5,
  bucket = 'products',
  compressBeforeUpload = true,
  showPreview = true,
  className,
}: OptimizedImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      // Validar cantidad de archivos
      if (value.length + files.length > maxFiles) {
        toast.error(`Máximo ${maxFiles} imágenes permitidas`)
        return
      }

      setIsUploading(true)
      const newUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `${file.name}-${Date.now()}`

        try {
          // Validar archivo
          const validation = validateImageFile(file, maxSizeMB)
          if (!validation.valid) {
            toast.error(validation.error)
            continue
          }

          // Comprimir imagen si está habilitado
          let fileToUpload: File | Blob = file
          if (compressBeforeUpload && file.size > 500 * 1024) {
            // Solo comprimir si > 500KB
            setUploadProgress((prev) => ({ ...prev, [fileId]: 10 }))
            fileToUpload = await compressImage(file, 1920, 0.85)
            setUploadProgress((prev) => ({ ...prev, [fileId]: 30 }))
          }

          // Generar nombre único
          const fileName = generateImageFileName(file.name)

          // Crear FormData
          const formData = new FormData()
          formData.append('file', fileToUpload, fileName)
          formData.append('bucket', bucket)

          setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }))

          // Subir a Supabase
          const response = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData,
          })

          setUploadProgress((prev) => ({ ...prev, [fileId]: 80 }))

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Error al subir imagen')
          }

          const data = await response.json()
          newUrls.push(data.url)

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))

          // Limpiar progreso después de 500ms
          setTimeout(() => {
            setUploadProgress((prev) => {
              const { [fileId]: _, ...rest } = prev
              return rest
            })
          }, 500)
        } catch (error) {
          console.error('Error uploading image:', error)
          toast.error(
            error instanceof Error ? error.message : 'Error al subir imagen'
          )
        }
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls])
        toast.success(`${newUrls.length} imagen(es) subida(s) correctamente`)
      }

      setIsUploading(false)
    },
    [value, onChange, maxFiles, maxSizeMB, bucket, compressBeforeUpload]
  )

  const handleRemove = async (urlToRemove: string) => {
    try {
      // Eliminar de Supabase
      await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove }),
      })

      // Actualizar estado
      onChange(value.filter((url) => url !== urlToRemove))
      toast.success('Imagen eliminada')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Error al eliminar imagen')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const canUploadMore = value.length < maxFiles

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            multiple
            disabled={isUploading}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}

          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isUploading
                ? 'Subiendo imágenes...'
                : 'Arrastra imágenes aquí o haz clic para seleccionar'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, WEBP, AVIF hasta {maxSizeMB}MB (máx. {maxFiles} archivos)
            </p>
            {compressBeforeUpload && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Las imágenes se comprimirán automáticamente
              </p>
            )}
          </div>

          {/* Progress Indicators */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 w-full space-y-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Subiendo...</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Grid */}
      {showPreview && value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            >
              <Image
                src={url}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity hover:bg-red-600 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      {value.length > 0 && (
        <p className="text-sm text-gray-500">
          {value.length} de {maxFiles} imágenes subidas
          {value.length > 0 && ' • La primera imagen será la principal'}
        </p>
      )}
    </div>
  )
}
