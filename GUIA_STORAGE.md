# Guía Completa de Supabase Storage

Sistema completo de gestión de archivos con Supabase Storage para tu e-commerce.

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Buckets Disponibles](#buckets-disponibles)
3. [Uso Básico](#uso-básico)
4. [Componentes de UI](#componentes-de-ui)
5. [Hooks de React](#hooks-de-react)
6. [API Routes](#api-routes)
7. [Ejemplos Prácticos](#ejemplos-prácticos)

## Configuración Inicial

### 1. Crear Buckets en Supabase

Accede a tu panel de Supabase y crea los siguientes buckets en Storage:

```
products     - Público  - Imágenes de productos
avatars      - Público  - Avatares de usuarios
categories   - Público  - Imágenes de categorías
banners      - Público  - Banners promocionales
documents    - Privado  - Documentos y facturas
```

### 2. Configurar Políticas de Acceso (RLS)

Para cada bucket público, agrega estas políticas en Supabase:

**Permitir lectura pública:**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');
```

**Permitir subida autenticada:**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
```

**Permitir actualización del propietario:**
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.uid() = owner);
```

**Permitir eliminación del propietario:**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.uid() = owner);
```

## Buckets Disponibles

```typescript
import { STORAGE_BUCKETS } from '@/lib/storage';

STORAGE_BUCKETS.PRODUCTS    // 'products'
STORAGE_BUCKETS.AVATARS     // 'avatars'
STORAGE_BUCKETS.CATEGORIES  // 'categories'
STORAGE_BUCKETS.BANNERS     // 'banners'
STORAGE_BUCKETS.DOCUMENTS   // 'documents'
```

## Uso Básico

### Subir un Archivo

```typescript
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';

const file = event.target.files[0];

const result = await uploadFile({
  bucket: STORAGE_BUCKETS.PRODUCTS,
  file,
  // path opcional - se genera automáticamente si no se proporciona
  path: 'custom/path/filename.jpg',
});

if (result.success) {
  console.log('Archivo subido:', result.publicUrl);
  console.log('Path:', result.path);
}
```

### Subir Múltiples Archivos

```typescript
import { uploadMultipleFiles, STORAGE_BUCKETS } from '@/lib/storage';

const files = Array.from(event.target.files);

const results = await uploadMultipleFiles(
  files,
  STORAGE_BUCKETS.PRODUCTS
);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Archivo ${index + 1} subido:`, result.publicUrl);
  }
});
```

### Listar Archivos

```typescript
import { listFiles, STORAGE_BUCKETS } from '@/lib/storage';

const result = await listFiles(STORAGE_BUCKETS.PRODUCTS, 'folder/path', {
  limit: 10,
  offset: 0,
  search: 'imagen',
});

if (result.success) {
  console.log('Archivos:', result.files);
}
```

### Eliminar Archivo

```typescript
import { deleteFile, STORAGE_BUCKETS } from '@/lib/storage';

const result = await deleteFile(
  STORAGE_BUCKETS.PRODUCTS,
  'path/to/file.jpg'
);

if (result.success) {
  console.log('Archivo eliminado');
}
```

### Obtener URL Pública

```typescript
import { getPublicUrl, STORAGE_BUCKETS } from '@/lib/storage';

const url = getPublicUrl(STORAGE_BUCKETS.PRODUCTS, 'path/to/file.jpg');
console.log('URL pública:', url);
```

### Obtener URL Firmada (Privada)

```typescript
import { getSignedUrl, STORAGE_BUCKETS } from '@/lib/storage';

const result = await getSignedUrl(
  STORAGE_BUCKETS.DOCUMENTS,
  'invoice.pdf',
  3600 // expira en 1 hora
);

if (result.data) {
  console.log('URL firmada:', result.data.signedUrl);
}
```

## Componentes de UI

### FileUpload - Subir Archivos Genéricos

```tsx
import { FileUpload } from '@/components/storage';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function MyComponent() {
  return (
    <FileUpload
      bucket={STORAGE_BUCKETS.DOCUMENTS}
      accept=".pdf,.doc,.docx"
      maxSize={10} // 10 MB
      multiple={true}
      onUploadSuccess={(result) => {
        console.log('Archivo subido:', result.publicUrl);
      }}
      onUploadError={(error) => {
        console.error('Error:', error);
      }}
    />
  );
}
```

### ImageUpload - Subir Imágenes con Preview

```tsx
import { ImageUpload } from '@/components/storage';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function ProductForm() {
  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.PRODUCTS}
      maxSize={5}
      preview={true}
      currentImage="https://existing-image-url.com/image.jpg"
      onUploadSuccess={(result) => {
        // Guardar en tu estado o base de datos
        setProductImage(result.publicUrl);
      }}
      onUploadError={(error) => {
        alert(error);
      }}
    />
  );
}
```

## Hooks de React

### useFileUpload - Gestionar Subida de Archivos

```tsx
'use client';

import { useFileUpload } from '@/hooks/useFileUpload';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function UploadComponent() {
  const { upload, isUploading, progress, error, uploadedFile } = useFileUpload({
    bucket: STORAGE_BUCKETS.PRODUCTS,
    maxSize: 5,
    allowedTypes: ['image/*'],
    onSuccess: (result) => {
      console.log('¡Subido!', result.publicUrl);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <p>Subiendo... {progress}%</p>}
      {error && <p className="text-red-500">{error}</p>}
      {uploadedFile && <p>URL: {uploadedFile.publicUrl}</p>}
    </div>
  );
}
```

### useStorage - Gestionar Archivos

```tsx
'use client';

import { useStorage } from '@/hooks/useStorage';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function FileManager() {
  const { files, isLoading, list, remove, download } = useStorage(
    STORAGE_BUCKETS.PRODUCTS
  );

  useEffect(() => {
    list('products/2025');
  }, [list]);

  return (
    <div>
      {isLoading && <p>Cargando...</p>}

      {files.map((file) => (
        <div key={file.id}>
          <span>{file.name}</span>
          <button onClick={() => download(`products/2025/${file.name}`)}>
            Descargar
          </button>
          <button onClick={() => remove(`products/2025/${file.name}`)}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Routes

### POST /api/storage/upload

Subir archivos desde el servidor.

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('bucket', 'products');
formData.append('path', 'optional/custom/path.jpg');

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.publicUrl);
```

### DELETE /api/storage/delete

Eliminar archivos.

```typescript
// Eliminar un archivo
await fetch('/api/storage/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bucket: 'products',
    path: 'path/to/file.jpg',
  }),
});

// Eliminar múltiples archivos
await fetch('/api/storage/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bucket: 'products',
    paths: ['file1.jpg', 'file2.jpg'],
  }),
});
```

### GET /api/storage/list

Listar archivos.

```typescript
const response = await fetch(
  '/api/storage/list?bucket=products&path=2025&limit=10'
);
const data = await response.json();
console.log(data.files);
```

## Ejemplos Prácticos

### 1. Formulario de Producto con Imagen

```tsx
'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/storage';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function ProductForm() {
  const [productData, setProductData] = useState({
    name: '',
    price: 0,
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guardar producto con la imagen
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={productData.name}
        onChange={(e) => setProductData({ ...productData, name: e.target.value })}
      />

      <ImageUpload
        bucket={STORAGE_BUCKETS.PRODUCTS}
        onUploadSuccess={(result) => {
          setProductData({ ...productData, imageUrl: result.publicUrl });
        }}
      />

      <button type="submit">Crear Producto</button>
    </form>
  );
}
```

### 2. Galería de Imágenes con Múltiples Uploads

```tsx
'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/storage';
import { STORAGE_BUCKETS } from '@/lib/storage';

export default function ImageGallery() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <div>
      <FileUpload
        bucket={STORAGE_BUCKETS.PRODUCTS}
        accept="image/*"
        multiple={true}
        onUploadSuccess={(result) => {
          setImages((prev) => [...prev, result.publicUrl]);
        }}
      />

      <div className="grid grid-cols-3 gap-4 mt-4">
        {images.map((url, index) => (
          <img key={index} src={url} alt={`Image ${index + 1}`} />
        ))}
      </div>
    </div>
  );
}
```

### 3. Avatar de Usuario

```tsx
'use client';

import { ImageUpload } from '@/components/storage';
import { STORAGE_BUCKETS } from '@/lib/storage';
import { useSession } from 'next-auth/react';

export default function UserAvatar() {
  const { data: session, update } = useSession();

  return (
    <ImageUpload
      bucket={STORAGE_BUCKETS.AVATARS}
      currentImage={session?.user?.image || undefined}
      onUploadSuccess={async (result) => {
        // Actualizar avatar en la sesión
        await update({
          user: {
            ...session?.user,
            image: result.publicUrl,
          },
        });
      }}
    />
  );
}
```

## Límites y Consideraciones

### Tamaños Máximos Recomendados

```typescript
import { FILE_SIZE_LIMITS } from '@/lib/storage';

FILE_SIZE_LIMITS.IMAGE     // 5 MB
FILE_SIZE_LIMITS.DOCUMENT  // 10 MB
FILE_SIZE_LIMITS.VIDEO     // 100 MB
FILE_SIZE_LIMITS.GENERAL   // 50 MB
```

### Tipos de Archivo Permitidos

```typescript
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
} from '@/lib/storage';

// Imágenes: JPG, PNG, GIF, WEBP, SVG
// Documentos: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
// Videos: MP4, MPEG, MOV, AVI, WEBM
```

## Solución de Problemas

### Error: "Bucket not found"

Asegúrate de haber creado los buckets en tu panel de Supabase.

### Error: "Permission denied"

Verifica las políticas RLS en Supabase Storage para el bucket correspondiente.

### Las imágenes no se muestran

Confirma que el bucket sea público y que hayas configurado las políticas de lectura.

### Error al subir archivos grandes

Verifica los límites de tamaño en Supabase (por defecto 50MB) y ajusta si es necesario.

## Siguientes Pasos

1. Crear los buckets en Supabase
2. Configurar las políticas de acceso
3. Probar la subida de imágenes
4. Integrar en tus formularios de productos
5. Implementar galería de imágenes
6. Agregar optimización de imágenes si es necesario
