import { NextResponse } from 'next/server';
import { listFiles, STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') as StorageBucket;
    const path = searchParams.get('path') || '';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json(
        { error: 'Bucket no válido o no especificado' },
        { status: 400 }
      );
    }

    const result = await listFiles(bucket, path, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      search: search || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al listar archivos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: result.files,
    });
  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
