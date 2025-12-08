'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Upload, GripVertical, Star } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Importar solo las constantes, no el módulo completo
const STORAGE_BUCKETS = {
  PRODUCTS: 'products' as const,
};

interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ProductImageManager({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: ProductImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { upload, isUploading, progress, error } = useFileUpload({
    bucket: STORAGE_BUCKETS.PRODUCTS,
    maxSize: 5,
    allowedTypes: ['image/*'],
    onSuccess: (result) => {
      if (result.publicUrl) {
        onChange([...images, result.publicUrl]);
      }
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      alert(`Solo puedes subir ${remainingSlots} imagen(es) más`);
      return;
    }

    for (const file of files) {
      await upload(file);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div
            key={url}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative group aspect-square rounded-lg border-2 overflow-hidden bg-gray-100',
              draggedIndex === index && 'opacity-50',
              !disabled && 'cursor-move'
            )}
          >
            <Image
              src={url}
              alt={`Producto imagen ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Badge de imagen principal */}
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Principal
              </div>
            )}

            {/* Drag handle */}
            {!disabled && (
              <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}

            {/* Botón eliminar */}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Número de orden */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Upload box */}
        {canAddMore && !disabled && (
          <label
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors cursor-pointer bg-gray-50',
              isUploading && 'opacity-50 pointer-events-none'
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500 text-center px-2">
              {isUploading ? `Subiendo... ${progress}%` : 'Subir imagen'}
            </span>
            <span className="text-xs text-gray-400">
              {images.length}/{maxImages}
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <p>• La primera imagen será la imagen principal del producto</p>
        <p>• Arrastra las imágenes para reordenarlas</p>
        <p>• Formato: JPG, PNG, WEBP (máx. 5MB por imagen)</p>
        <p>• Máximo {maxImages} imágenes por producto</p>
      </div>
    </div>
  );
}
