-- ============================================
-- SCRIPT DE LIMPIEZA COMPLETA DE BASE DE DATOS
-- ============================================
-- ADVERTENCIA: Este script eliminará TODOS los datos
-- Ejecutar solo en desarrollo o cuando quieras empezar de cero
-- ============================================

-- 1. Eliminar todos los usuarios de Auth (esto elimina en cascada muchas tablas por FK)
DELETE FROM auth.users;

-- 2. Limpiar tablas en orden (de hijas a padres para evitar errores de FK)

-- Tablas de verificación y sesiones
TRUNCATE TABLE public.email_verification_tokens CASCADE;
TRUNCATE TABLE public.email_verification_attempts CASCADE;

-- Tablas de órdenes (primero items, luego órdenes)
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- Tablas de carrito
TRUNCATE TABLE public.cart_items CASCADE;

-- Tablas de reviews
TRUNCATE TABLE public.review_helpful_votes CASCADE;
TRUNCATE TABLE public.reviews CASCADE;

-- Tablas de cupones y uso
TRUNCATE TABLE public.coupon_usage CASCADE;
TRUNCATE TABLE public.coupons CASCADE;

-- Tablas de productos (primero variantes, luego productos, luego categorías)
TRUNCATE TABLE public.product_variants CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;

-- Tablas de shipping
TRUNCATE TABLE public.shipping_costs CASCADE;

-- Tablas de usuarios/customers (debe ser después de órdenes y reviews)
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- 3. Reiniciar secuencias si existen
-- (Esto asegura que los IDs empiecen desde 1)

-- 4. Verificar limpieza
DO $$
BEGIN
  RAISE NOTICE '✓ Base de datos limpiada exitosamente';
  RAISE NOTICE 'Ahora puedes ejecutar el seed.sql para crear datos de prueba';
END $$;

-- Mostrar conteo de registros en tablas principales
SELECT
  'users' as tabla, COUNT(*) as registros FROM public.users
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'coupons', COUNT(*) FROM public.coupons
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
