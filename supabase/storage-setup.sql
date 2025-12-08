-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================
-- Este script configura los buckets y políticas
-- de acceso para Supabase Storage
-- ============================================

-- NOTA: Los buckets deben crearse manualmente en la UI de Supabase
-- con las siguientes configuraciones:

/*
BUCKETS A CREAR EN LA UI DE SUPABASE:

1. products     - Público: ✓  - Límite: 5MB  - Tipos: image/*
2. avatars      - Público: ✓  - Límite: 5MB  - Tipos: image/*
3. categories   - Público: ✓  - Límite: 5MB  - Tipos: image/*
4. banners      - Público: ✓  - Límite: 5MB  - Tipos: image/*
5. documents    - Público: ✗  - Límite: 10MB - Tipos: application/pdf, etc.
*/

-- ============================================
-- POLÍTICAS PARA BUCKET: products
-- ============================================

-- Permitir lectura pública de productos
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización del propietario
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.uid() = owner
);

-- Permitir eliminación del propietario
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.uid() = owner
);

-- ============================================
-- POLÍTICAS PARA BUCKET: avatars
-- ============================================

-- Permitir lectura pública de avatares
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización del propietario
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() = owner
);

-- Permitir eliminación del propietario
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() = owner
);

-- ============================================
-- POLÍTICAS PARA BUCKET: categories
-- ============================================

-- Permitir lectura pública de categorías
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Authenticated users can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'categories'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización del propietario
CREATE POLICY "Users can update own category images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'categories'
  AND auth.uid() = owner
);

-- Permitir eliminación del propietario
CREATE POLICY "Users can delete own category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'categories'
  AND auth.uid() = owner
);

-- ============================================
-- POLÍTICAS PARA BUCKET: banners
-- ============================================

-- Permitir lectura pública de banners
CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización del propietario
CREATE POLICY "Users can update own banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners'
  AND auth.uid() = owner
);

-- Permitir eliminación del propietario
CREATE POLICY "Users can delete own banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners'
  AND auth.uid() = owner
);

-- ============================================
-- POLÍTICAS PARA BUCKET: documents (PRIVADO)
-- ============================================

-- Solo el propietario puede ver sus documentos
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() = owner
);

-- Permitir subida a usuarios autenticados
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización del propietario
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid() = owner
);

-- Permitir eliminación del propietario
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid() = owner
);

-- ============================================
-- OPCIONAL: POLÍTICAS DE ADMIN
-- ============================================
-- Descomenta estas líneas si quieres dar acceso
-- total a usuarios con rol de admin

/*
-- Crear función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política de admin para todos los buckets
CREATE POLICY "Admins have full access"
ON storage.objects FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas consultas para verificar que
-- las políticas se crearon correctamente

/*
-- Ver todas las políticas de storage
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Ver buckets configurados
SELECT * FROM storage.buckets;
*/
