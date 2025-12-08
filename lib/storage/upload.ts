import { getStorageClient } from './client';
import type { StorageBucket } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  path?: string;
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

// Generar nombre de archivo único
export function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  const uuid = uuidv4();
  return `${uuid}.${extension}`;
}

// Generar path organizado por fecha
export function generateDatePath(fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}/${fileName}`;
}

// Validar tipo de archivo
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.split('/')[0];
      return file.type.startsWith(prefix + '/');
    }
    return file.type === type;
  });
}

// Validar tamaño de archivo
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// Subir archivo individual
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const storage = getStorageClient();
    const {
      bucket,
      file,
      path,
      upsert = false,
      cacheControl = '3600',
      contentType,
    } = options;

    // Generar path si no se proporciona
    const fileName = path || generateDatePath(generateUniqueFileName(file.name));

    // Subir archivo
    const { data, error } = await storage.from(bucket).upload(fileName, file, {
      cacheControl,
      contentType: contentType || file.type,
      upsert,
    });

    if (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Obtener URL pública
    const { data: urlData } = storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Subir múltiples archivos
export async function uploadMultipleFiles(
  files: File[],
  bucket: StorageBucket,
  options?: {
    upsert?: boolean;
    cacheControl?: string;
    generatePath?: (file: File) => string;
  }
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file =>
    uploadFile({
      bucket,
      file,
      path: options?.generatePath?.(file),
      upsert: options?.upsert,
      cacheControl: options?.cacheControl,
    })
  );

  return await Promise.all(uploadPromises);
}

// Subir imagen con redimensionamiento (requiere configuración en Supabase)
export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  options?: {
    path?: string;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<UploadResult> {
  // Validar que sea una imagen
  if (!validateFileType(file, ['image/*'])) {
    return {
      success: false,
      error: 'El archivo debe ser una imagen',
    };
  }

  // Aquí puedes agregar lógica de redimensionamiento si es necesario
  // Por ahora, simplemente subimos la imagen

  return await uploadFile({
    bucket,
    file,
    path: options?.path,
    upsert: true,
  });
}

// Reemplazar archivo existente
export async function replaceFile(
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<UploadResult> {
  try {
    const storage = getStorageClient();

    // Eliminar archivo anterior si existe
    await storage.from(bucket).remove([path]);

    // Subir nuevo archivo
    return await uploadFile({
      bucket,
      file,
      path,
      upsert: true,
    });
  } catch (error) {
    console.error('Replace file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al reemplazar archivo',
    };
  }
}
