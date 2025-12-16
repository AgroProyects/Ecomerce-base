import { NextRequest, NextResponse } from 'next/server';
import {
  deleteFile,
  deleteMultipleFiles,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/storage';
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit';

export async function DELETE(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.delete.limit(identifier)

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
    const { bucket, path, paths } = await request.json();

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        { error: 'Bucket no válido' },
        { status: 400 }
      );
    }

    // Eliminar múltiples archivos
    if (paths && Array.isArray(paths)) {
      const result = await deleteMultipleFiles(bucket as StorageBucket, paths);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Error al eliminar archivos' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    }

    // Eliminar un solo archivo
    if (path) {
      const result = await deleteFile(bucket as StorageBucket, path);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Error al eliminar archivo' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Se requiere path o paths' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
