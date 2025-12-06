-- =====================================================
-- E-COMMERCE FLEXIBLE - SCHEMA INICIAL
-- =====================================================
-- Este esquema está diseñado para ser reutilizable
-- en múltiples tipos de tiendas online
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'editor',
  'viewer'
);

CREATE TYPE banner_position AS ENUM (
  'hero',
  'secondary',
  'footer',
  'popup'
);

-- =====================================================
-- TABLA: users
-- Usuarios del sistema (admins)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'viewer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABLA: categories
-- Categorías de productos (con soporte para subcategorías)
-- =====================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- =====================================================
-- TABLA: products
-- Productos del catálogo
-- =====================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0),
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  track_inventory BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Índice de búsqueda full-text
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- =====================================================
-- TABLA: product_variants
-- Variantes de productos (tallas, colores, etc.)
-- =====================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_override DECIMAL(10, 2) CHECK (price_override >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- =====================================================
-- TABLA: orders
-- Órdenes de compra
-- =====================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  notes TEXT,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_status TEXT,
  mp_status_detail TEXT,
  mp_payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_mp_payment ON orders(mp_payment_id);

-- =====================================================
-- TABLA: order_items
-- Items de cada orden
-- =====================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- TABLA: store_settings
-- Configuración de la tienda
-- =====================================================

CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#3b82f6',
  social_links JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,
  currency TEXT DEFAULT 'ARS',
  currency_symbol TEXT DEFAULT '$',
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  homepage_config JSONB DEFAULT '{}',
  seo_config JSONB DEFAULT '{}',
  shipping_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: banners
-- Banners promocionales
-- =====================================================

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  position banner_position DEFAULT 'hero',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_active ON banners(is_active);
CREATE INDEX idx_banners_dates ON banners(starts_at, ends_at);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 3) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE year_prefix || '%';

  new_number := year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar stock de producto
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_quantity, 0),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar stock de variante
CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = GREATEST(stock - p_quantity, 0),
      updated_at = NOW()
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en todas las tablas
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (categorías, productos, banners activos)
CREATE POLICY "Categorías activas son públicas"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Productos activos son públicos"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Variantes activas son públicas"
  ON product_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Banners activos son públicos"
  ON banners FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

CREATE POLICY "Store settings son públicos"
  ON store_settings FOR SELECT
  USING (true);

-- Políticas para admins (acceso total)
-- Estas políticas usan service_role que bypasea RLS
-- Para admins autenticados, se deben crear políticas adicionales

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuración inicial de la tienda
INSERT INTO store_settings (
  store_name,
  store_slug,
  description,
  primary_color,
  secondary_color,
  accent_color,
  currency,
  currency_symbol,
  homepage_config,
  seo_config
) VALUES (
  'Mi Tienda',
  'mi-tienda',
  'Bienvenido a nuestra tienda online',
  '#000000',
  '#ffffff',
  '#3b82f6',
  'ARS',
  '$',
  '{"showHeroBanner": true, "showFeaturedProducts": true, "showCategories": true, "featuredProductsLimit": 8}',
  '{"title": "Mi Tienda - Compra Online", "description": "La mejor tienda online con los mejores productos"}'
);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de productos con información de categoría
CREATE OR REPLACE VIEW products_with_category AS
SELECT
  p.*,
  c.name as category_name,
  c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Vista de órdenes con totales
CREATE OR REPLACE VIEW orders_summary AS
SELECT
  o.*,
  COUNT(oi.id) as items_count,
  SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Vista de productos con stock bajo
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.stock,
  p.low_stock_threshold,
  'product' as type
FROM products p
WHERE p.track_inventory = true
  AND p.stock <= p.low_stock_threshold
  AND p.is_active = true
UNION ALL
SELECT
  pv.id,
  p.name || ' - ' || pv.name as name,
  p.slug,
  pv.stock,
  p.low_stock_threshold,
  'variant' as type
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.track_inventory = true
  AND pv.stock <= p.low_stock_threshold
  AND pv.is_active = true;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE users IS 'Usuarios administrativos del sistema';
COMMENT ON TABLE categories IS 'Categorías de productos con soporte para jerarquía';
COMMENT ON TABLE products IS 'Catálogo principal de productos';
COMMENT ON TABLE product_variants IS 'Variantes de productos (tallas, colores, etc.)';
COMMENT ON TABLE orders IS 'Órdenes de compra con integración Mercado Pago';
COMMENT ON TABLE order_items IS 'Items individuales de cada orden';
COMMENT ON TABLE store_settings IS 'Configuración global de la tienda';
COMMENT ON TABLE banners IS 'Banners promocionales de la tienda';

COMMENT ON COLUMN products.metadata IS 'Campo JSON flexible para datos adicionales según el tipo de producto';
COMMENT ON COLUMN product_variants.attributes IS 'Array de atributos [{name: "Color", value: "Rojo"}]';
COMMENT ON COLUMN store_settings.homepage_config IS 'Configuración del layout de la página principal';
COMMENT ON COLUMN store_settings.shipping_config IS 'Configuración de envíos y costos';
