import { NextResponse } from 'next/server';
import {
  deleteFile,
  deleteMultipleFiles,
  STORAGE_BUCKETS,
  type StorageBucket,
} from '@/lib/storage';

export async function DELETE(request: Request) {
  try {
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
