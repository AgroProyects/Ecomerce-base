import { getStorageClient } from './client';
import type { StorageBucket } from './constants';

export interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface ListFilesOptions {
  limit?: number;
  offset?: number;
  sortBy?: {
    column: 'name' | 'updated_at' | 'created_at';
    order: 'asc' | 'desc';
  };
  search?: string;
}

// Listar archivos en un bucket
export async function listFiles(
  bucket: StorageBucket,
  path: string = '',
  options?: ListFilesOptions
) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage.from(bucket).list(path, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy,
      search: options?.search,
    });

    if (error) {
      console.error('Error listing files:', error);
      return { success: false, error: error.message, files: [] };
    }

    return { success: true, files: data, error: null };
  } catch (error) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      files: [],
    };
  }
}

// Eliminar archivo
export async function deleteFile(bucket: StorageBucket, path: string) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar archivo',
    };
  }
}

// Eliminar múltiples archivos
export async function deleteMultipleFiles(
  bucket: StorageBucket,
  paths: string[]
) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage.from(bucket).remove(paths);

    if (error) {
      console.error('Error deleting files:', error);
      return { success: false, error: error.message, deletedCount: 0 };
    }

    return { success: true, data, deletedCount: paths.length };
  } catch (error) {
    console.error('Delete multiple files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar archivos',
      deletedCount: 0,
    };
  }
}

// Mover archivo
export async function moveFile(
  bucket: StorageBucket,
  fromPath: string,
  toPath: string
) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      console.error('Error moving file:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Move file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al mover archivo',
    };
  }
}

// Copiar archivo
export async function copyFile(
  bucket: StorageBucket,
  fromPath: string,
  toPath: string
) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) {
      console.error('Error copying file:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Copy file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al copiar archivo',
    };
  }
}

// Descargar archivo
export async function downloadFile(bucket: StorageBucket, path: string) {
  try {
    const storage = getStorageClient();

    const { data, error } = await storage.from(bucket).download(path);

    if (error) {
      console.error('Error downloading file:', error);
      return { success: false, error: error.message, blob: null };
    }

    return { success: true, blob: data };
  } catch (error) {
    console.error('Download file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al descargar archivo',
      blob: null,
    };
  }
}

// Obtener información de un archivo
export async function getFileInfo(bucket: StorageBucket, path: string) {
  try {
    const storage = getStorageClient();

    // Supabase no tiene un método directo para obtener info,
    // así que listamos y filtramos
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    const directory = pathParts.join('/');

    const { data, error } = await storage.from(bucket).list(directory, {
      search: fileName,
    });

    if (error) {
      console.error('Error getting file info:', error);
      return { success: false, error: error.message, info: null };
    }

    const fileInfo = data.find(file => file.name === fileName);

    return { success: true, info: fileInfo || null };
  } catch (error) {
    console.error('Get file info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener info',
      info: null,
    };
  }
}

// Crear carpeta (simulado mediante archivo .keep)
export async function createFolder(bucket: StorageBucket, path: string) {
  try {
    const storage = getStorageClient();

    // Supabase Storage no tiene carpetas reales, así que creamos un archivo .keep
    const keepPath = `${path}/.keep`;
    const keepFile = new File([''], '.keep', { type: 'text/plain' });

    const { data, error } = await storage.from(bucket).upload(keepPath, keepFile);

    if (error) {
      console.error('Error creating folder:', error);
      return { success: false, error: error.message };
    }

    return { success: true, path: keepPath };
  } catch (error) {
    console.error('Create folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear carpeta',
    };
  }
}

// Vaciar carpeta
export async function emptyFolder(bucket: StorageBucket, path: string) {
  try {
    const storage = getStorageClient();

    // Listar todos los archivos en la carpeta
    const { data: files, error: listError } = await storage
      .from(bucket)
      .list(path);

    if (listError) {
      return { success: false, error: listError.message, deletedCount: 0 };
    }

    if (!files || files.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Eliminar todos los archivos
    const filePaths = files.map(file => `${path}/${file.name}`);
    const { error: deleteError } = await storage.from(bucket).remove(filePaths);

    if (deleteError) {
      return { success: false, error: deleteError.message, deletedCount: 0 };
    }

    return { success: true, deletedCount: filePaths.length };
  } catch (error) {
    console.error('Empty folder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al vaciar carpeta',
      deletedCount: 0,
    };
  }
}
