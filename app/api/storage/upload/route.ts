import { NextResponse } from 'next/server';
import { uploadFile, STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage';

export async function POST(request: Request) {
  try {
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

    const result = await uploadFile({
      bucket,
      file,
      path: path || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al subir archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la solicitud',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
