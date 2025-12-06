-- =====================================================
-- DATOS DE PRUEBA PARA E-COMMERCE
-- =====================================================
-- Ejecutar después de la migración inicial
-- =====================================================

-- Limpiar datos existentes (en orden correcto por FK)
TRUNCATE order_items, orders, product_variants, products, categories, banners, store_settings, users CASCADE;

-- =====================================================
-- CONFIGURACIÓN DE LA TIENDA
-- =====================================================
INSERT INTO store_settings (
  id,
  store_name,
  store_slug,
  description,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  contact_email,
  contact_phone,
  social_links,
  currency,
  currency_symbol,
  homepage_config,
  seo_config
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'TechStore',
  'techstore',
  'Tu tienda de tecnología de confianza. Encontrá los mejores productos electrónicos, accesorios y gadgets al mejor precio.',
  NULL,
  '#18181b',
  '#fafafa',
  '#3b82f6',
  'contacto@techstore.com',
  '+54 11 1234-5678',
  '{"instagram": "https://instagram.com/techstore", "facebook": "https://facebook.com/techstore", "twitter": "https://twitter.com/techstore"}',
  'ARS',
  '$',
  '{"showHeroBanner": true, "showFeaturedProducts": true, "showCategories": true, "featuredProductsLimit": 8}',
  '{"title": "TechStore - Tu tienda de tecnología", "description": "Comprá online los mejores productos de tecnología con envío a todo el país"}'
);

-- =====================================================
-- USUARIOS ADMIN
-- =====================================================
INSERT INTO users (id, email, name, role, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'admin@techstore.com', 'Administrador', 'super_admin', true),
  ('b0000000-0000-0000-0000-000000000002', 'editor@techstore.com', 'Editor', 'editor', true);

-- =====================================================
-- CATEGORÍAS
-- =====================================================
INSERT INTO categories (id, name, slug, description, image_url, parent_id, is_active, sort_order) VALUES
  -- Categorías principales
  ('c0000000-0000-0000-0000-000000000001', 'Computación', 'computacion', 'Notebooks, PCs y accesorios de computación', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', NULL, true, 1),
  ('c0000000-0000-0000-0000-000000000002', 'Celulares', 'celulares', 'Smartphones y accesorios móviles', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', NULL, true, 2),
  ('c0000000-0000-0000-0000-000000000003', 'Audio', 'audio', 'Auriculares, parlantes y equipos de sonido', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', NULL, true, 3),
  ('c0000000-0000-0000-0000-000000000004', 'Gaming', 'gaming', 'Consolas, videojuegos y accesorios gamer', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800', NULL, true, 4),
  ('c0000000-0000-0000-0000-000000000005', 'Accesorios', 'accesorios', 'Cables, cargadores, fundas y más', 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800', NULL, true, 5),

  -- Subcategorías de Computación
  ('c0000000-0000-0000-0000-000000000011', 'Notebooks', 'notebooks', 'Laptops para trabajo y gaming', NULL, 'c0000000-0000-0000-0000-000000000001', true, 1),
  ('c0000000-0000-0000-0000-000000000012', 'Monitores', 'monitores', 'Monitores LED, gaming y profesionales', NULL, 'c0000000-0000-0000-0000-000000000001', true, 2),
  ('c0000000-0000-0000-0000-000000000013', 'Teclados y Mouse', 'teclados-mouse', 'Periféricos para tu computadora', NULL, 'c0000000-0000-0000-0000-000000000001', true, 3),

  -- Subcategorías de Audio
  ('c0000000-0000-0000-0000-000000000031', 'Auriculares', 'auriculares', 'Auriculares in-ear, over-ear y gaming', NULL, 'c0000000-0000-0000-0000-000000000003', true, 1),
  ('c0000000-0000-0000-0000-000000000032', 'Parlantes', 'parlantes', 'Parlantes bluetooth y de escritorio', NULL, 'c0000000-0000-0000-0000-000000000003', true, 2);

-- =====================================================
-- PRODUCTOS
-- =====================================================
INSERT INTO products (id, name, slug, description, price, compare_price, cost_price, images, category_id, is_active, is_featured, track_inventory, stock, low_stock_threshold, metadata, seo_title, seo_description) VALUES
  -- Notebooks
  (
    'd0000000-0000-0000-0000-000000000001',
    'MacBook Air M2',
    'macbook-air-m2',
    'La nueva MacBook Air con chip M2 es increíblemente delgada y cuenta con una pantalla Liquid Retina de 13.6 pulgadas. Batería de hasta 18 horas, cámara FaceTime HD de 1080p y sistema de audio de 4 altavoces.',
    1899999.00,
    2099999.00,
    1500000.00,
    ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'],
    'c0000000-0000-0000-0000-000000000011',
    true,
    true,
    true,
    15,
    3,
    '{"processor": "Apple M2", "ram": "8GB", "storage": "256GB SSD", "display": "13.6 pulgadas Liquid Retina"}',
    'MacBook Air M2 - TechStore',
    'Comprá la nueva MacBook Air M2 al mejor precio'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'Lenovo ThinkPad X1 Carbon',
    'lenovo-thinkpad-x1-carbon',
    'La notebook empresarial definitiva. Intel Core i7 de 12va generación, pantalla 14" 2.8K OLED, 16GB RAM y 512GB SSD. Ultraliviana con solo 1.12kg.',
    1499999.00,
    NULL,
    1200000.00,
    ARRAY['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'],
    'c0000000-0000-0000-0000-000000000011',
    true,
    true,
    true,
    8,
    2,
    '{"processor": "Intel Core i7-1260P", "ram": "16GB", "storage": "512GB SSD", "display": "14 pulgadas 2.8K OLED"}',
    'Lenovo ThinkPad X1 Carbon - TechStore',
    'Notebook empresarial Lenovo ThinkPad X1 Carbon'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'ASUS ROG Strix G15',
    'asus-rog-strix-g15',
    'Notebook gaming con AMD Ryzen 9, NVIDIA RTX 4070, pantalla 15.6" QHD 165Hz. Teclado RGB per-key y sistema de refrigeración avanzado.',
    1799999.00,
    1999999.00,
    1400000.00,
    ARRAY['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'],
    'c0000000-0000-0000-0000-000000000011',
    true,
    true,
    true,
    5,
    2,
    '{"processor": "AMD Ryzen 9 7945HX", "ram": "32GB", "storage": "1TB SSD", "gpu": "NVIDIA RTX 4070"}',
    'ASUS ROG Strix G15 Gaming - TechStore',
    'Notebook gaming ASUS ROG Strix G15 con RTX 4070'
  ),

  -- Celulares
  (
    'd0000000-0000-0000-0000-000000000004',
    'iPhone 15 Pro',
    'iphone-15-pro',
    'El iPhone más avanzado. Chip A17 Pro, cámara de 48MP con zoom óptico 5x, titanio de grado aeroespacial y USB-C. Pantalla Super Retina XDR de 6.1".',
    1599999.00,
    NULL,
    1300000.00,
    ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800'],
    'c0000000-0000-0000-0000-000000000002',
    true,
    true,
    true,
    20,
    5,
    '{"storage": "256GB", "color": "Titanio Natural", "display": "6.1 pulgadas Super Retina XDR"}',
    'iPhone 15 Pro - TechStore',
    'Comprá el iPhone 15 Pro con titanio y chip A17 Pro'
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'Samsung Galaxy S24 Ultra',
    'samsung-galaxy-s24-ultra',
    'El Galaxy más potente. Snapdragon 8 Gen 3, cámara de 200MP, S Pen integrado y pantalla Dynamic AMOLED 2X de 6.8". Inteligencia artificial Galaxy AI.',
    1449999.00,
    1599999.00,
    1150000.00,
    ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'],
    'c0000000-0000-0000-0000-000000000002',
    true,
    true,
    true,
    12,
    3,
    '{"storage": "512GB", "color": "Titanium Gray", "display": "6.8 pulgadas Dynamic AMOLED 2X"}',
    'Samsung Galaxy S24 Ultra - TechStore',
    'Galaxy S24 Ultra con cámara 200MP y Galaxy AI'
  ),

  -- Audio
  (
    'd0000000-0000-0000-0000-000000000006',
    'Sony WH-1000XM5',
    'sony-wh-1000xm5',
    'Los mejores auriculares con cancelación de ruido del mercado. 30 horas de batería, audio de alta resolución LDAC y diseño ultraligero de 250g.',
    449999.00,
    499999.00,
    350000.00,
    ARRAY['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'],
    'c0000000-0000-0000-0000-000000000031',
    true,
    true,
    true,
    25,
    5,
    '{"type": "Over-ear", "wireless": true, "anc": true, "battery": "30 horas"}',
    'Sony WH-1000XM5 - TechStore',
    'Auriculares Sony WH-1000XM5 con cancelación de ruido'
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    'AirPods Pro 2',
    'airpods-pro-2',
    'Los AirPods Pro con chip H2 ofrecen cancelación de ruido 2x más potente, audio espacial personalizado y hasta 6 horas de reproducción.',
    349999.00,
    NULL,
    280000.00,
    ARRAY['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800'],
    'c0000000-0000-0000-0000-000000000031',
    true,
    true,
    true,
    30,
    5,
    '{"type": "In-ear", "wireless": true, "anc": true, "battery": "6 horas"}',
    'AirPods Pro 2 - TechStore',
    'Apple AirPods Pro 2da generación con USB-C'
  ),
  (
    'd0000000-0000-0000-0000-000000000008',
    'JBL Flip 6',
    'jbl-flip-6',
    'Parlante bluetooth portátil con sonido JBL Original Pro. IP67 resistente al agua y polvo, 12 horas de batería y PartyBoost para conectar múltiples parlantes.',
    89999.00,
    109999.00,
    65000.00,
    ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'],
    'c0000000-0000-0000-0000-000000000032',
    true,
    false,
    true,
    40,
    10,
    '{"type": "Portátil", "wireless": true, "waterproof": "IP67", "battery": "12 horas"}',
    'JBL Flip 6 - TechStore',
    'Parlante bluetooth JBL Flip 6 resistente al agua'
  ),

  -- Gaming
  (
    'd0000000-0000-0000-0000-000000000009',
    'PlayStation 5',
    'playstation-5',
    'Experimenta carga ultrarrápida con SSD de alta velocidad, inmersión más profunda con retroalimentación háptica, gatillos adaptables y audio 3D.',
    799999.00,
    NULL,
    650000.00,
    ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'],
    'c0000000-0000-0000-0000-000000000004',
    true,
    true,
    true,
    10,
    2,
    '{"storage": "825GB SSD", "resolution": "4K 120fps", "includes": "Control DualSense"}',
    'PlayStation 5 - TechStore',
    'Consola PlayStation 5 con control DualSense'
  ),
  (
    'd0000000-0000-0000-0000-000000000010',
    'Nintendo Switch OLED',
    'nintendo-switch-oled',
    'Modelo con pantalla OLED de 7 pulgadas con colores vibrantes. Incluye base con puerto LAN, 64GB de almacenamiento interno y altavoces mejorados.',
    499999.00,
    549999.00,
    400000.00,
    ARRAY['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800'],
    'c0000000-0000-0000-0000-000000000004',
    true,
    false,
    true,
    18,
    3,
    '{"storage": "64GB", "display": "7 pulgadas OLED", "modes": "TV, Tabletop, Handheld"}',
    'Nintendo Switch OLED - TechStore',
    'Nintendo Switch modelo OLED con pantalla de 7 pulgadas'
  ),

  -- Monitores
  (
    'd0000000-0000-0000-0000-000000000011',
    'LG UltraGear 27GP850-B',
    'lg-ultragear-27gp850',
    'Monitor gaming 27" QHD Nano IPS, 180Hz, 1ms GtG, G-Sync Compatible y FreeSync Premium. HDR400 y cobertura 98% DCI-P3.',
    549999.00,
    649999.00,
    420000.00,
    ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
    'c0000000-0000-0000-0000-000000000012',
    true,
    false,
    true,
    7,
    2,
    '{"size": "27 pulgadas", "resolution": "2560x1440", "panel": "Nano IPS", "refresh": "180Hz"}',
    'LG UltraGear 27GP850-B - TechStore',
    'Monitor gaming LG UltraGear 27" QHD 180Hz'
  ),
  (
    'd0000000-0000-0000-0000-000000000012',
    'Samsung Odyssey G7',
    'samsung-odyssey-g7',
    'Monitor gaming curvo 32" QHD 1000R, 240Hz, 1ms, QLED con HDR600. G-Sync Compatible y FreeSync Premium Pro.',
    699999.00,
    799999.00,
    550000.00,
    ARRAY['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800'],
    'c0000000-0000-0000-0000-000000000012',
    true,
    true,
    true,
    4,
    2,
    '{"size": "32 pulgadas", "resolution": "2560x1440", "panel": "VA QLED", "refresh": "240Hz", "curve": "1000R"}',
    'Samsung Odyssey G7 - TechStore',
    'Monitor gaming curvo Samsung Odyssey G7 32" 240Hz'
  ),

  -- Accesorios
  (
    'd0000000-0000-0000-0000-000000000013',
    'Logitech MX Master 3S',
    'logitech-mx-master-3s',
    'El mouse más avanzado para productividad. Sensor 8K DPI, scroll electromagnético MagSpeed, Silent Clicks y conexión multi-dispositivo.',
    149999.00,
    NULL,
    110000.00,
    ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'],
    'c0000000-0000-0000-0000-000000000013',
    true,
    false,
    true,
    35,
    5,
    '{"type": "Ergonómico", "sensor": "8000 DPI", "connection": "Bluetooth + USB", "battery": "70 días"}',
    'Logitech MX Master 3S - TechStore',
    'Mouse inalámbrico Logitech MX Master 3S'
  ),
  (
    'd0000000-0000-0000-0000-000000000014',
    'Keychron K2 Pro',
    'keychron-k2-pro',
    'Teclado mecánico inalámbrico 75%, hot-swappable, compatible con Mac/Windows. Switches Gateron Pro y retroiluminación RGB.',
    129999.00,
    149999.00,
    95000.00,
    ARRAY['https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=800'],
    'c0000000-0000-0000-0000-000000000013',
    true,
    false,
    true,
    20,
    5,
    '{"layout": "75%", "switches": "Gateron Pro", "connection": "Bluetooth + USB-C", "rgb": true}',
    'Keychron K2 Pro - TechStore',
    'Teclado mecánico Keychron K2 Pro inalámbrico'
  ),
  (
    'd0000000-0000-0000-0000-000000000015',
    'Cargador Apple MagSafe 15W',
    'cargador-apple-magsafe-15w',
    'Cargador inalámbrico magnético para iPhone 12 en adelante. Alineación perfecta y carga rápida de hasta 15W.',
    59999.00,
    69999.00,
    42000.00,
    ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800'],
    'c0000000-0000-0000-0000-000000000005',
    true,
    false,
    true,
    50,
    10,
    '{"type": "Inalámbrico", "power": "15W", "compatible": "iPhone 12+, AirPods Pro"}',
    'Cargador MagSafe 15W - TechStore',
    'Cargador inalámbrico Apple MagSafe original'
  ),
  (
    'd0000000-0000-0000-0000-000000000016',
    'Cable USB-C Anker 100W',
    'cable-usb-c-anker-100w',
    'Cable USB-C a USB-C de 2 metros con carga rápida de 100W y transferencia de datos de 480Mbps. Nylon trenzado resistente.',
    19999.00,
    24999.00,
    12000.00,
    ARRAY['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'],
    'c0000000-0000-0000-0000-000000000005',
    true,
    false,
    true,
    100,
    20,
    '{"length": "2m", "power": "100W PD", "material": "Nylon trenzado"}',
    'Cable USB-C Anker 100W - TechStore',
    'Cable USB-C Anker 2m con carga rápida 100W'
  );

-- =====================================================
-- VARIANTES DE PRODUCTOS
-- =====================================================
INSERT INTO product_variants (id, product_id, name, sku, price_override, stock, attributes, is_active, sort_order) VALUES
  -- Variantes MacBook Air M2
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Medianoche', 'MBA-M2-256-MID', NULL, 5, '[{"name": "Color", "value": "Medianoche"}]', true, 1),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Plata', 'MBA-M2-256-SIL', NULL, 5, '[{"name": "Color", "value": "Plata"}]', true, 2),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Luz Estelar', 'MBA-M2-256-STA', NULL, 5, '[{"name": "Color", "value": "Luz Estelar"}]', true, 3),

  -- Variantes iPhone 15 Pro
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', '256GB - Titanio Natural', 'IP15P-256-NAT', NULL, 8, '[{"name": "Almacenamiento", "value": "256GB"}, {"name": "Color", "value": "Titanio Natural"}]', true, 1),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', '256GB - Titanio Negro', 'IP15P-256-BLK', NULL, 6, '[{"name": "Almacenamiento", "value": "256GB"}, {"name": "Color", "value": "Titanio Negro"}]', true, 2),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', '512GB - Titanio Natural', 'IP15P-512-NAT', 1799999.00, 4, '[{"name": "Almacenamiento", "value": "512GB"}, {"name": "Color", "value": "Titanio Natural"}]', true, 3),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', '512GB - Titanio Azul', 'IP15P-512-BLU', 1799999.00, 2, '[{"name": "Almacenamiento", "value": "512GB"}, {"name": "Color", "value": "Titanio Azul"}]', true, 4),

  -- Variantes Sony WH-1000XM5
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000006', 'Negro', 'SONY-XM5-BLK', NULL, 15, '[{"name": "Color", "value": "Negro"}]', true, 1),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000006', 'Plata', 'SONY-XM5-SIL', NULL, 10, '[{"name": "Color", "value": "Plata"}]', true, 2),

  -- Variantes JBL Flip 6
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000008', 'Negro', 'JBL-FLIP6-BLK', NULL, 15, '[{"name": "Color", "value": "Negro"}]', true, 1),
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000008', 'Azul', 'JBL-FLIP6-BLU', NULL, 10, '[{"name": "Color", "value": "Azul"}]', true, 2),
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000008', 'Rojo', 'JBL-FLIP6-RED', NULL, 8, '[{"name": "Color", "value": "Rojo"}]', true, 3),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000008', 'Verde', 'JBL-FLIP6-GRN', NULL, 7, '[{"name": "Color", "value": "Verde"}]', true, 4);

-- =====================================================
-- BANNERS
-- =====================================================
INSERT INTO banners (id, title, subtitle, image_url, mobile_image_url, link_url, position, is_active, sort_order) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'Nueva Colección Tech 2024',
    'Descubrí las últimas novedades en tecnología',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800',
    '/products',
    'hero',
    true,
    1
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'Gaming Week',
    'Hasta 30% OFF en consolas y accesorios',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1920',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800',
    '/category/gaming',
    'hero',
    true,
    2
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    'Envío Gratis',
    'En compras mayores a $50.000',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920',
    NULL,
    '/products',
    'secondary',
    true,
    1
  );

-- =====================================================
-- ÓRDENES DE EJEMPLO
-- =====================================================
INSERT INTO orders (id, order_number, status, customer_email, customer_name, customer_phone, shipping_address, subtotal, shipping_cost, discount_amount, total, mp_status, created_at, paid_at) VALUES
  (
    'aa000000-0000-0000-0000-000000000001',
    '250001',
    'delivered',
    'cliente1@email.com',
    'Juan Pérez',
    '+54 11 5555-1234',
    '{"street": "Av. Corrientes 1234", "city": "CABA", "state": "Buenos Aires", "zip": "C1043AAZ", "country": "Argentina"}',
    1949998.00,
    0.00,
    0.00,
    1949998.00,
    'approved',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'aa000000-0000-0000-0000-000000000002',
    '250002',
    'shipped',
    'cliente2@email.com',
    'María García',
    '+54 11 5555-5678',
    '{"street": "Calle Florida 567", "city": "CABA", "state": "Buenos Aires", "zip": "C1005AAM", "country": "Argentina"}',
    449999.00,
    5000.00,
    0.00,
    454999.00,
    'approved',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'aa000000-0000-0000-0000-000000000003',
    '250003',
    'processing',
    'cliente3@email.com',
    'Carlos López',
    '+54 11 5555-9012',
    '{"street": "Av. Santa Fe 2000", "city": "CABA", "state": "Buenos Aires", "zip": "C1123AAB", "country": "Argentina"}',
    1599999.00,
    0.00,
    50000.00,
    1549999.00,
    'approved',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'aa000000-0000-0000-0000-000000000004',
    '250004',
    'pending',
    'cliente4@email.com',
    'Ana Rodríguez',
    '+54 11 5555-3456',
    '{"street": "Av. Rivadavia 8000", "city": "CABA", "state": "Buenos Aires", "zip": "C1406GLS", "country": "Argentina"}',
    179998.00,
    5000.00,
    0.00,
    184998.00,
    NULL,
    NOW(),
    NULL
  );

-- Items de órdenes
INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total_price) VALUES
  -- Orden 1
  ('bb000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'MacBook Air M2', 'Medianoche', 1, 1899999.00, 1899999.00),
  ('bb000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000015', NULL, 'Cargador Apple MagSafe 15W', NULL, 1, 49999.00, 49999.00),

  -- Orden 2
  ('bb000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000008', 'Sony WH-1000XM5', 'Negro', 1, 449999.00, 449999.00),

  -- Orden 3
  ('bb000000-0000-0000-0000-000000000004', 'aa000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'iPhone 15 Pro', '256GB - Titanio Natural', 1, 1599999.00, 1599999.00),

  -- Orden 4
  ('bb000000-0000-0000-0000-000000000005', 'aa000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000010', 'JBL Flip 6', 'Negro', 2, 89999.00, 179998.00);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que los datos se insertaron correctamente
DO $$
DECLARE
  cat_count INTEGER;
  prod_count INTEGER;
  var_count INTEGER;
  order_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM categories;
  SELECT COUNT(*) INTO prod_count FROM products;
  SELECT COUNT(*) INTO var_count FROM product_variants;
  SELECT COUNT(*) INTO order_count FROM orders;

  RAISE NOTICE '✅ Datos de prueba insertados correctamente:';
  RAISE NOTICE '   - Categorías: %', cat_count;
  RAISE NOTICE '   - Productos: %', prod_count;
  RAISE NOTICE '   - Variantes: %', var_count;
  RAISE NOTICE '   - Órdenes: %', order_count;
END $$;
