'use client';

import { useState, useCallback } from 'react';
import type { StorageBucket } from '@/lib/storage/constants';
import {
  uploadFile,
  uploadMultipleFiles,
  validateFileSize,
  validateFileType,
  type UploadResult,
} from '@/lib/storage';

interface UseFileUploadOptions {
  bucket: StorageBucket;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
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
        // Validaciones
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

        // Simular progreso (Supabase no proporciona progreso real en el cliente)
        setProgress(50);

        const result = await uploadFile({
          bucket: options.bucket,
          file,
        });

        setProgress(100);

        if (result.success) {
          setUploadedFile(result);
          options.onSuccess?.(result);
        } else {
          setError(result.error || 'Error al subir archivo');
          options.onError?.(result.error || 'Error al subir archivo');
        }

        return result;
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

        setProgress(30);

        const results = await uploadMultipleFiles(files, options.bucket);

        setProgress(100);

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
