'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { StorageBucket } from '@/lib/supabase/storage';
import { ALLOWED_IMAGE_TYPES, FILE_SIZE_LIMITS } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  bucket: StorageBucket;
  maxSize?: number;
  onUploadSuccess?: (result: { path: string; publicUrl: string }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  preview?: boolean;
  currentImage?: string;
}

export function ImageUpload({
  bucket,
  maxSize = FILE_SIZE_LIMITS.IMAGE,
  onUploadSuccess,
  onUploadError,
  className,
  disabled = false,
  preview = true,
  currentImage,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

  const { upload, isUploading, progress, error } = useFileUpload({
    bucket,
    maxSize,
    allowedTypes: [...ALLOWED_IMAGE_TYPES],
    onSuccess: result => {
      if (result.path && result.publicUrl) {
        setPreviewUrl(result.publicUrl);
        onUploadSuccess?.({ path: result.path, publicUrl: result.publicUrl });
      }
    },
    onError: onUploadError,
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];

      // Crear preview
      if (preview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      await upload(file);
    },
    [disabled, isUploading, preview, upload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const file = files[0];

      // Crear preview
      if (preview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      await upload(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [preview, upload]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const removeImage = useCallback(() => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled || isUploading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer',
          error && 'border-red-500',
          previewUrl ? 'p-0' : 'p-6'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {previewUrl ? (
          <div className="relative w-full aspect-video">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            {!isUploading && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-sm font-medium">Subiendo...</p>
                  <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">{progress}%</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <ImageIcon className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading
                  ? 'Subiendo imagen...'
                  : dragActive
                    ? 'Suelta la imagen aquí'
                    : 'Arrastra una imagen o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WEBP (máx. {maxSize}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
