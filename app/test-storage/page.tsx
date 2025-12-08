'use client';

import { useState } from 'react';
import { ImageUpload, FileUpload } from '@/components/storage';

// Definir los buckets aquí para evitar importar desde lib/storage en cliente
const STORAGE_BUCKETS = {
  PRODUCTS: 'products' as const,
  DOCUMENTS: 'documents' as const,
  AVATARS: 'avatars' as const,
  CATEGORIES: 'categories' as const,
  BANNERS: 'banners' as const,
};

export default function TestStoragePage() {
  const [productImage, setProductImage] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Prueba de Supabase Storage</h1>

      {/* Test 1: Image Upload */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">1. Subir Imagen de Producto</h2>
        <p className="text-gray-600 mb-4">
          Prueba el componente ImageUpload con preview
        </p>

        <ImageUpload
          bucket={STORAGE_BUCKETS.PRODUCTS}
          maxSize={5}
          preview={true}
          onUploadSuccess={(result) => {
            setProductImage(result.publicUrl);
            alert('¡Imagen subida exitosamente!');
          }}
          onUploadError={(error) => {
            alert(`Error: ${error}`);
          }}
        />

        {productImage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-800">URL pública:</p>
            <a
              href={productImage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {productImage}
            </a>
          </div>
        )}
      </section>

      {/* Test 2: Multiple Files Upload */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">2. Subir Múltiples Archivos</h2>
        <p className="text-gray-600 mb-4">
          Prueba el componente FileUpload con múltiples archivos
        </p>

        <FileUpload
          bucket={STORAGE_BUCKETS.PRODUCTS}
          accept="image/*"
          maxSize={5}
          multiple={true}
          onUploadSuccess={(result) => {
            setUploadedFiles((prev) => [
              ...prev,
              {
                name: result.path?.split('/').pop() || 'unknown',
                url: result.publicUrl,
              },
            ]);
          }}
          onUploadError={(error) => {
            alert(`Error: ${error}`);
          }}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Archivos subidos:</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border rounded flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{file.name}</span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver archivo
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Test 3: Document Upload */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">3. Subir Documentos</h2>
        <p className="text-gray-600 mb-4">
          Prueba subir PDFs y documentos
        </p>

        <FileUpload
          bucket={STORAGE_BUCKETS.DOCUMENTS}
          accept=".pdf,.doc,.docx,.txt"
          maxSize={10}
          onUploadSuccess={(result) => {
            alert(`Documento subido: ${result.publicUrl}`);
          }}
          onUploadError={(error) => {
            alert(`Error: ${error}`);
          }}
        />
      </section>

      {/* Instructions */}
      <section className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-semibold mb-3 text-blue-900">
          Instrucciones
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>
            Asegúrate de haber creado los buckets en Supabase (products, documents)
          </li>
          <li>Configura las políticas de acceso usando el archivo storage-setup.sql</li>
          <li>Intenta subir imágenes en la sección 1</li>
          <li>Prueba subir múltiples archivos en la sección 2</li>
          <li>Sube un documento PDF en la sección 3</li>
        </ol>
      </section>

      {/* API Test */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">4. Prueba de API</h2>
        <p className="text-gray-600 mb-4">
          Prueba las API routes de storage
        </p>

        <div className="space-y-2">
          <button
            onClick={async () => {
              const response = await fetch(
                '/api/storage/list?bucket=products&limit=10'
              );
              const data = await response.json();
              console.log('Archivos en products:', data);
              alert(`Encontrados ${data.files?.length || 0} archivos. Ver consola.`);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Listar archivos en products
          </button>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="p-6 bg-gray-50 border rounded">
        <h2 className="text-xl font-semibold mb-3">Documentación</h2>
        <ul className="space-y-2">
          <li>
            <a
              href="/GUIA_STORAGE.md"
              className="text-blue-600 hover:underline"
              target="_blank"
            >
              📘 Guía Completa de Storage
            </a>
          </li>
          <li>
            <a
              href="/lib/storage/README.md"
              className="text-blue-600 hover:underline"
              target="_blank"
            >
              📖 Documentación Técnica
            </a>
          </li>
          <li>
            <a
              href="/supabase/storage-setup.sql"
              className="text-blue-600 hover:underline"
              target="_blank"
            >
              🗄️ Script SQL de Configuración
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
