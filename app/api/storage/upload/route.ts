import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

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
      console.error('Error uploading file:', error);
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
