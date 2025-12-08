# Storage Library - Supabase Storage Integration

Sistema completo para gestión de archivos con Supabase Storage.

## Estructura

```
lib/storage/
├── index.ts          # Exportaciones principales
├── types.ts          # Tipos y constantes
├── upload.ts         # Funciones de subida
├── manage.ts         # Gestión de archivos
└── README.md         # Esta documentación

lib/supabase/
└── storage.ts        # Clientes de Storage

hooks/
├── useFileUpload.ts  # Hook para subir archivos
└── useStorage.ts     # Hook para gestionar archivos

components/storage/
├── FileUpload.tsx    # Componente de subida genérico
├── ImageUpload.tsx   # Componente de subida de imágenes
└── index.ts          # Exportaciones
```

## Inicio Rápido

### 1. Importar funciones

```typescript
import { uploadFile, STORAGE_BUCKETS } from '@/lib/storage';
```

### 2. Subir un archivo

```typescript
const result = await uploadFile({
  bucket: STORAGE_BUCKETS.PRODUCTS,
  file: myFile,
});

console.log(result.publicUrl);
```

### 3. Usar componentes

```tsx
import { ImageUpload } from '@/components/storage';

<ImageUpload
  bucket={STORAGE_BUCKETS.PRODUCTS}
  onUploadSuccess={(result) => console.log(result.publicUrl)}
/>
```

## Funciones Disponibles

### Upload (lib/storage/upload.ts)

- `uploadFile()` - Subir archivo individual
- `uploadMultipleFiles()` - Subir múltiples archivos
- `uploadImage()` - Subir imagen con validación
- `replaceFile()` - Reemplazar archivo existente
- `generateUniqueFileName()` - Generar nombre único
- `generateDatePath()` - Generar path organizado por fecha
- `validateFileType()` - Validar tipo de archivo
- `validateFileSize()` - Validar tamaño de archivo

### Manage (lib/storage/manage.ts)

- `listFiles()` - Listar archivos
- `deleteFile()` - Eliminar archivo
- `deleteMultipleFiles()` - Eliminar múltiples archivos
- `moveFile()` - Mover archivo
- `copyFile()` - Copiar archivo
- `downloadFile()` - Descargar archivo
- `getFileInfo()` - Obtener información de archivo
- `createFolder()` - Crear carpeta
- `emptyFolder()` - Vaciar carpeta

### Storage (lib/supabase/storage.ts)

- `getStorageClient()` - Cliente para navegador
- `getServerStorageClient()` - Cliente para servidor
- `getAdminStorageClient()` - Cliente con permisos admin
- `getPublicUrl()` - Obtener URL pública
- `getSignedUrl()` - Generar URL firmada temporal
- `getSignedUrls()` - Generar múltiples URLs firmadas

## Hooks

### useFileUpload

```tsx
const { upload, isUploading, progress, error } = useFileUpload({
  bucket: STORAGE_BUCKETS.PRODUCTS,
  maxSize: 5,
  onSuccess: (result) => console.log(result),
});
```

### useStorage

```tsx
const { files, list, remove, download } = useStorage(
  STORAGE_BUCKETS.PRODUCTS
);
```

## Componentes

### FileUpload

Componente genérico con drag & drop.

```tsx
<FileUpload
  bucket={STORAGE_BUCKETS.DOCUMENTS}
  accept=".pdf,.doc"
  maxSize={10}
  multiple={true}
  onUploadSuccess={(result) => {}}
/>
```

### ImageUpload

Componente especializado para imágenes con preview.

```tsx
<ImageUpload
  bucket={STORAGE_BUCKETS.PRODUCTS}
  preview={true}
  currentImage="https://..."
  onUploadSuccess={(result) => {}}
/>
```

## Buckets Predefinidos

```typescript
STORAGE_BUCKETS.PRODUCTS    // Imágenes de productos
STORAGE_BUCKETS.AVATARS     // Avatares de usuarios
STORAGE_BUCKETS.CATEGORIES  // Imágenes de categorías
STORAGE_BUCKETS.BANNERS     // Banners promocionales
STORAGE_BUCKETS.DOCUMENTS   // Documentos privados
```

## Configuraciones

### Límites de Tamaño

```typescript
FILE_SIZE_LIMITS.IMAGE     // 5 MB
FILE_SIZE_LIMITS.DOCUMENT  // 10 MB
FILE_SIZE_LIMITS.VIDEO     // 100 MB
FILE_SIZE_LIMITS.GENERAL   // 50 MB
```

### Tipos Permitidos

```typescript
ALLOWED_IMAGE_TYPES      // JPG, PNG, GIF, WEBP, SVG
ALLOWED_DOCUMENT_TYPES   // PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
ALLOWED_VIDEO_TYPES      // MP4, MPEG, MOV, AVI, WEBM
```

## API Routes

Usa las API routes para operaciones del servidor:

- `POST /api/storage/upload` - Subir archivo
- `DELETE /api/storage/delete` - Eliminar archivo(s)
- `GET /api/storage/list` - Listar archivos

## Ver También

- [GUIA_STORAGE.md](../../GUIA_STORAGE.md) - Guía completa con ejemplos
- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
