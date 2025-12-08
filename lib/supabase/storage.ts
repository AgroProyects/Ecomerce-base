import { createClient } from './client';
import { createAdminClient } from './admin';
import type { StorageBucket } from '@/lib/storage/constants';

// Re-exportar constantes
export { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage/constants';

// Cliente de Storage para el navegador
export function getStorageClient() {
  const supabase = createClient();
  return supabase.storage;
}

// Cliente de Storage para el servidor (usar solo en Server Components/Actions)
export async function getServerStorageClient() {
  // Importación dinámica para evitar errores en cliente
  const { createClient: createServerClient } = await import('./server');
  const supabase = await createServerClient();
  return supabase.storage;
}

// Cliente de Storage con permisos admin (solo servidor)
export function getAdminStorageClient() {
  const supabase = createAdminClient();
  return supabase.storage;
}

// Obtener URL pública de un archivo
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Generar URL firmada temporal (privada)
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600 // 1 hora por defecto
) {
  const storage = getStorageClient();
  return await storage.from(bucket).createSignedUrl(path, expiresIn);
}

// Generar múltiples URLs firmadas
export async function getSignedUrls(
  bucket: StorageBucket,
  paths: string[],
  expiresIn: number = 3600
) {
  const storage = getStorageClient();
  return await storage.from(bucket).createSignedUrls(paths, expiresIn);
}
