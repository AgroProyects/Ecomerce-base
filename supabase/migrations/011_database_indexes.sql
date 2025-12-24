-- =====================================================
-- MIGRATION: Database Performance Indexes
-- Descripción: Índices para optimizar queries frecuentes
-- Fecha: 2025-12-23
-- Versión: 1.0
-- =====================================================

-- Índice compuesto para órdenes por cliente y estado
-- Mejora queries: "Ver mis órdenes", "Órdenes por estado", "Historial de cliente"
CREATE INDEX IF NOT EXISTS idx_orders_customer_status_date
  ON orders(customer_email, status, created_at DESC);

-- Índice para productos activos por categoría y precio
-- Mejora queries: "Productos de una categoría", "Ordenar por precio", "Filtros de catálogo"
CREATE INDEX IF NOT EXISTS idx_products_category_price_active
  ON products(category_id, price)
  WHERE is_active = true;

-- Índice para búsqueda de productos por nombre y descripción
-- Mejora queries: Búsqueda full-text de productos
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')))
  WHERE is_active = true;

-- Índice para productos destacados
-- Mejora queries: "Productos destacados en home"
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products(created_at DESC)
  WHERE is_active = true AND is_featured = true;

-- Índice para reviews aprobados por producto
-- Mejora queries: "Reviews de un producto", "Calcular rating promedio"
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved
  ON product_reviews(product_id, rating, created_at DESC)
  WHERE status = 'approved';

-- Índice para cupones activos
-- Mejora queries: "Validar cupón", "Buscar cupón por código"
CREATE INDEX IF NOT EXISTS idx_coupons_active_expires
  ON coupons(code, is_active, expires_at)
  WHERE is_active = true;

-- Índice para búsqueda de usuarios por email
-- Mejora queries: "Buscar usuario", "Validar email único"
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- Índice para order_items por producto
-- Mejora queries: "Productos más vendidos", "Reportes de ventas por producto"
CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON order_items(product_id, created_at DESC);

-- Índice para order_items por orden
-- Mejora queries: "Detalles de una orden"
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_id);

-- Índice para variantes de productos
-- Mejora queries: "Variantes de un producto"
CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_variants(product_id, is_active)
  WHERE is_active = true;

-- Índice para tokens de verificación de email
-- Mejora queries: "Verificar email con token"
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_active
  ON email_verification_tokens(token, expires_at)
  WHERE verified_at IS NULL;

-- Índices para carritos de compra ya existen en la migración 005_cart_system.sql
-- Los siguientes índices ya están creados sobre la tabla 'shopping_carts':
-- - idx_carts_user_id: índice para búsquedas por user_id
-- - idx_carts_session_id: índice para búsquedas por session_id
-- No es necesario crearlos nuevamente aquí

-- Índice para uso de cupones
-- Mejora queries: "Histórico de uso de cupones", "Validar límite de uso por usuario"
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon
  ON coupon_usages(coupon_id, used_at DESC);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_email
  ON coupon_usages(user_email, coupon_id);

-- Índice para reservas de stock activas
-- Mejora queries: "Stock disponible", "Reservas por expirar"
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_status
  ON stock_reservations(product_id, status, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_stock_reservations_variant_status
  ON stock_reservations(variant_id, status, expires_at)
  WHERE variant_id IS NOT NULL AND status = 'active';

-- Índice para reservas por orden
-- Mejora queries: "Reservas de una orden específica"
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order
  ON stock_reservations(order_id)
  WHERE order_id IS NOT NULL;

-- Índice para reservas por sesión/usuario
-- Mejora queries: "Reservas de un usuario/sesión"
CREATE INDEX IF NOT EXISTS idx_stock_reservations_user
  ON stock_reservations(user_id, status)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_reservations_session
  ON stock_reservations(session_id, status)
  WHERE session_id IS NOT NULL;

-- =====================================================
-- ANALYZE: Actualizar estadísticas de tablas
-- =====================================================

-- Actualizar estadísticas para que el query planner use los índices correctamente
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE product_reviews;
ANALYZE coupons;
ANALYZE coupon_usages;
ANALYZE users;
ANALYZE product_variants;
ANALYZE shopping_carts;
ANALYZE stock_reservations;
ANALYZE email_verification_tokens;

-- =====================================================
-- COMENTARIOS: Documentación de índices
-- =====================================================

COMMENT ON INDEX idx_orders_customer_status_date IS
  'Índice compuesto para búsqueda de órdenes por cliente, estado y fecha';

COMMENT ON INDEX idx_products_category_price_active IS
  'Índice para filtrado de productos por categoría y ordenamiento por precio';

COMMENT ON INDEX idx_products_search IS
  'Índice GIN para búsqueda full-text en nombre y descripción de productos';

COMMENT ON INDEX idx_reviews_product_approved IS
  'Índice para consultas de reviews aprobados por producto';

COMMENT ON INDEX idx_coupons_active_expires IS
  'Índice para validación rápida de cupones activos';

COMMENT ON INDEX idx_stock_reservations_product_status IS
  'Índice para cálculo de stock disponible considerando reservas activas';

-- =====================================================
-- FIN DE MIGRATION
-- =====================================================
