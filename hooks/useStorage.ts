'use client';

import { useState, useCallback } from 'react';
import type { StorageBucket } from '@/lib/storage/constants';
import {
  listFiles,
  deleteFile,
  deleteMultipleFiles,
  moveFile,
  copyFile,
  downloadFile,
  type FileObject,
  type ListFilesOptions,
} from '@/lib/storage';

export function useStorage(bucket: StorageBucket) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listar archivos
  const list = useCallback(
    async (path: string = '', options?: ListFilesOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listFiles(bucket, path, options);

        if (result.success) {
          setFiles(result.files);
        } else {
          setError(result.error || 'Error al listar archivos');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg, files: [] };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Eliminar archivo
  const remove = useCallback(
    async (path: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deleteFile(bucket, path);

        if (result.success) {
          // Actualizar la lista local
          setFiles(prev => prev.filter(f => f.name !== path.split('/').pop()));
        } else {
          setError(result.error || 'Error al eliminar archivo');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Eliminar múltiples archivos
  const removeMultiple = useCallback(
    async (paths: string[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deleteMultipleFiles(bucket, paths);

        if (result.success) {
          // Actualizar la lista local
          const fileNames = paths.map(p => p.split('/').pop());
          setFiles(prev => prev.filter(f => !fileNames.includes(f.name)));
        } else {
          setError(result.error || 'Error al eliminar archivos');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg, deletedCount: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Mover archivo
  const move = useCallback(
    async (fromPath: string, toPath: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await moveFile(bucket, fromPath, toPath);

        if (!result.success) {
          setError(result.error || 'Error al mover archivo');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Copiar archivo
  const copy = useCallback(
    async (fromPath: string, toPath: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await copyFile(bucket, fromPath, toPath);

        if (!result.success) {
          setError(result.error || 'Error al copiar archivo');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Descargar archivo
  const download = useCallback(
    async (path: string, fileName?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await downloadFile(bucket, path);

        if (result.success && result.blob) {
          // Crear URL temporal y descargar
          const url = window.URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || path.split('/').pop() || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          setError(result.error || 'Error al descargar archivo');
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        return { success: false, error: errorMsg, blob: null };
      } finally {
        setIsLoading(false);
      }
    },
    [bucket]
  );

  // Refrescar lista
  const refresh = useCallback(
    async (path: string = '') => {
      return await list(path);
    },
    [list]
  );

  return {
    files,
    isLoading,
    error,
    list,
    remove,
    removeMultiple,
    move,
    copy,
    download,
    refresh,
  };
}
