'use client';

import { useState, useCallback } from 'react';
import type { StorageBucket } from '@/lib/storage/constants';

interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

interface UseFileUploadOptions {
  bucket: StorageBucket;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

// Validar tamaño de archivo
function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// Validar tipo de archivo
function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.split('/')[0];
      return file.type.startsWith(prefix + '/');
    }
    return file.type === type;
  });
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Validaciones locales
        if (options.maxSize && !validateFileSize(file, options.maxSize)) {
          const errorMsg = `El archivo excede el tamaño máximo de ${options.maxSize}MB`;
          setError(errorMsg);
          options.onError?.(errorMsg);
          return null;
        }

        if (options.allowedTypes && !validateFileType(file, options.allowedTypes)) {
          const errorMsg = 'Tipo de archivo no permitido';
          setError(errorMsg);
          options.onError?.(errorMsg);
          return null;
        }

        setProgress(30);

        // Usar la API route para upload (bypass RLS)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', options.bucket);

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);

        const result = await response.json();

        setProgress(100);

        if (result.success) {
          const uploadResult: UploadResult = {
            success: true,
            path: result.path,
            publicUrl: result.publicUrl,
          };
          setUploadedFile(uploadResult);
          options.onSuccess?.(uploadResult);
          return uploadResult;
        } else {
          const errorMsg = result.error || 'Error al subir archivo';
          setError(errorMsg);
          options.onError?.(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Validar todos los archivos
        for (const file of files) {
          if (options.maxSize && !validateFileSize(file, options.maxSize)) {
            throw new Error(
              `El archivo ${file.name} excede el tamaño máximo de ${options.maxSize}MB`
            );
          }

          if (options.allowedTypes && !validateFileType(file, options.allowedTypes)) {
            throw new Error(`Tipo de archivo no permitido: ${file.name}`);
          }
        }

        setProgress(10);

        // Subir cada archivo usando la API
        const results: UploadResult[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bucket', options.bucket);

          const response = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          results.push({
            success: result.success,
            path: result.path,
            publicUrl: result.publicUrl,
            error: result.error,
          });

          setProgress(10 + ((i + 1) / files.length) * 90);
        }

        // Verificar si alguno falló
        const failedUploads = results.filter(r => !r.success);
        if (failedUploads.length > 0) {
          const errorMsg = `${failedUploads.length} archivo(s) no se pudieron subir`;
          setError(errorMsg);
          options.onError?.(errorMsg);
        }

        return results;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    upload,
    uploadMultiple,
    reset,
    isUploading,
    progress,
    error,
    uploadedFile,
  };
}
