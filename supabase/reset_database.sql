-- ============================================
-- SCRIPT DE LIMPIEZA COMPLETA DE BASE DE DATOS
-- ============================================
-- ADVERTENCIA: Este script eliminará TODOS los datos
-- Ejecutar solo en desarrollo o cuando quieras empezar de cero
-- ============================================

-- 1. Eliminar todos los usuarios de Auth (esto elimina en cascada muchas tablas por FK)
DELETE FROM auth.users;

-- 2. Limpiar tablas en orden (de hijas a padres para evitar errores de FK)
-- Usamos IF EXISTS para evitar errores si alguna tabla no existe

DO $$
BEGIN
  -- Tablas de verificación y sesiones
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_verification_tokens') THEN
    TRUNCATE TABLE public.email_verification_tokens CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_verification_attempts') THEN
    TRUNCATE TABLE public.email_verification_attempts CASCADE;
  END IF;

  -- Tablas de órdenes (primero items, luego órdenes)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    TRUNCATE TABLE public.order_items CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    TRUNCATE TABLE public.orders CASCADE;
  END IF;

  -- Tablas de carrito
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items') THEN
    TRUNCATE TABLE public.cart_items CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart') THEN
    TRUNCATE TABLE public.cart CASCADE;
  END IF;

  -- Tablas de reviews
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_helpful_votes') THEN
    TRUNCATE TABLE public.review_helpful_votes CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    TRUNCATE TABLE public.reviews CASCADE;
  END IF;

  -- Tablas de cupones y uso
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupon_usage') THEN
    TRUNCATE TABLE public.coupon_usage CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    TRUNCATE TABLE public.coupons CASCADE;
  END IF;

  -- Tablas de productos (primero variantes, luego productos, luego categorías)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    TRUNCATE TABLE public.product_variants CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    TRUNCATE TABLE public.products CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    TRUNCATE TABLE public.categories CASCADE;
  END IF;

  -- Tablas de shipping
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_costs') THEN
    TRUNCATE TABLE public.shipping_costs CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_zones') THEN
    TRUNCATE TABLE public.shipping_zones CASCADE;
  END IF;

  -- Tablas de usuarios/customers (debe ser después de órdenes y reviews)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    TRUNCATE TABLE public.customers CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    TRUNCATE TABLE public.users CASCADE;
  END IF;

  RAISE NOTICE '✓ Base de datos limpiada exitosamente';
  RAISE NOTICE 'Ahora puedes ejecutar el seed.sql para crear datos de prueba';
END $$;

-- Mostrar conteo de registros en tablas principales (solo las que existen)
DO $$
DECLARE
  users_count INT := 0;
  categories_count INT := 0;
  products_count INT := 0;
  orders_count INT := 0;
  coupons_count INT := 0;
  auth_users_count INT := 0;
BEGIN
  -- Contar solo si la tabla existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    SELECT COUNT(*) INTO users_count FROM public.users;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    SELECT COUNT(*) INTO categories_count FROM public.categories;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    SELECT COUNT(*) INTO products_count FROM public.products;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    SELECT COUNT(*) INTO orders_count FROM public.orders;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    SELECT COUNT(*) INTO coupons_count FROM public.coupons;
  END IF;

  SELECT COUNT(*) INTO auth_users_count FROM auth.users;

  RAISE NOTICE '=== VERIFICACIÓN DE LIMPIEZA ===';
  RAISE NOTICE 'users: %', users_count;
  RAISE NOTICE 'categories: %', categories_count;
  RAISE NOTICE 'products: %', products_count;
  RAISE NOTICE 'orders: %', orders_count;
  RAISE NOTICE 'coupons: %', coupons_count;
  RAISE NOTICE 'auth.users: %', auth_users_count;
  RAISE NOTICE '================================';

  IF users_count = 0 AND categories_count = 0 AND products_count = 0 AND orders_count = 0 AND auth_users_count = 0 THEN
    RAISE NOTICE '✓ Todas las tablas están vacías. Listo para ejecutar seed.sql';
  END IF;
END $$;
