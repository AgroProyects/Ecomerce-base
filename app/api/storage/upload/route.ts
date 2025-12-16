import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit';

// Allowed file types per bucket
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  products: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  categories: ['image/jpeg', 'image/png', 'image/webp'],
  banners: ['image/jpeg', 'image/png', 'image/webp'],
  reviews: ['image/jpeg', 'image/png', 'image/webp'],
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
};

// Max file sizes per bucket (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  products: 5 * 1024 * 1024, // 5MB
  categories: 2 * 1024 * 1024, // 2MB
  banners: 5 * 1024 * 1024, // 5MB
  reviews: 3 * 1024 * 1024, // 3MB
  avatars: 1 * 1024 * 1024, // 1MB
};

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB default

// Validate file type
function isAllowedFileType(bucket: string, mimeType: string): boolean {
  const allowed = ALLOWED_MIME_TYPES[bucket];
  if (!allowed) return true; // Allow all if bucket not configured
  return allowed.includes(mimeType);
}

// Validate file size
function isWithinSizeLimit(bucket: string, size: number): boolean {
  const maxSize = MAX_FILE_SIZES[bucket] || DEFAULT_MAX_SIZE;
  return size <= maxSize;
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Generar nombre de archivo único
function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  const uuid = uuidv4();
  return `${uuid}.${extension}`;
}

// Generar path organizado por fecha
function generateDatePath(fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}/${fileName}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.upload.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. Continuar con la lógica normal
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as StorageBucket;
    const path = formData.get('path') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        { error: 'Bucket no válido' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(bucket, file.type)) {
      const allowedTypes = ALLOWED_MIME_TYPES[bucket] || ['image/*'];
      return NextResponse.json(
        {
          error: 'Tipo de archivo no permitido',
          details: `Tipos permitidos: ${allowedTypes.map(t => t.replace('image/', '')).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isWithinSizeLimit(bucket, file.size)) {
      const maxSize = MAX_FILE_SIZES[bucket] || DEFAULT_MAX_SIZE;
      return NextResponse.json(
        {
          error: 'El archivo excede el tamaño máximo permitido',
          details: `Tamaño máximo: ${formatBytes(maxSize)}`
        },
        { status: 400 }
      );
    }

    // Usar admin client para bypass RLS
    const supabase = createAdminClient();
    const storage = supabase.storage;

    // Generar path si no se proporciona
    const fileName = path || generateDatePath(generateUniqueFileName(file.name));

    // Convertir File a ArrayBuffer para el servidor
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo con admin client
    const { data, error } = await storage.from(bucket).upload(fileName, buffer, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al subir archivo' },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: urlData } = storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
