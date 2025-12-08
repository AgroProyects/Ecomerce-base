// Este archivo es seguro para importar en componentes de cliente
// Solo exporta funciones que usan el cliente de navegador

import { createClient } from '@/lib/supabase/client';
import type { StorageBucket } from './constants';

// Cliente de Storage para el navegador
export function getStorageClient() {
  const supabase = createClient();
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
  expiresIn: number = 3600
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
