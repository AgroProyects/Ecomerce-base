-- =====================================================
-- SEED DATA - TIENDA DE ROPA URUGUAYA
-- =====================================================
-- Este script carga datos iniciales para una tienda de ropa con precios uruguayos
-- Ejecutar DESPUÉS de reset_database.sql

-- =====================================================
-- 1. CATEGORÍAS
-- =====================================================
INSERT INTO public.categories (name, slug, description, image_url) VALUES
('Remeras', 'remeras', 'Remeras y camisetas para todos los estilos', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'),
('Camisas', 'camisas', 'Camisas formales y casuales', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'),
('Pantalones', 'pantalones', 'Pantalones de vestir, jeans y joggers', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'),
('Vestidos', 'vestidos', 'Vestidos para todas las ocasiones', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'),
('Buzos', 'buzos', 'Buzos y sweaters para el invierno', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'),
('Camperas', 'camperas', 'Camperas y abrigos', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'),
('Shorts', 'shorts', 'Shorts para el verano uruguayo', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'),
('Accesorios', 'accesorios', 'Gorros, bufandas y accesorios', 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?w=800');

-- =====================================================
-- 2. PRODUCTOS - REMERAS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Remera Lisa Básica',
  'remera-lisa-basica',
  'Remera 100% algodón, perfecta para el día a día. Corte regular y suave al tacto.',
  890,
  (SELECT id FROM categories WHERE slug = 'remeras'),
  100,
  true,
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800']
),
(
  'Remera Oversize Urban',
  'remera-oversize-urban',
  'Remera estilo oversize con estampado urbano. Ideal para un look relajado.',
  1290,
  (SELECT id FROM categories WHERE slug = 'remeras'),
  75,
  true,
  ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800', 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800']
),
(
  'Remera Rayada Náutica',
  'remera-rayada-nautica',
  'Remera con rayas estilo marinero. Clásica y versátil.',
  1150,
  (SELECT id FROM categories WHERE slug = 'remeras'),
  60,
  false,
  ARRAY['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800']
),
(
  'Remera Estampada Floral',
  'remera-estampada-floral',
  'Remera con estampado floral primaveral. Perfecta para la temporada.',
  1390,
  (SELECT id FROM categories WHERE slug = 'remeras'),
  45,
  false,
  ARRAY['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800']
);

-- =====================================================
-- 3. PRODUCTOS - CAMISAS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Camisa Lino Blanca',
  'camisa-lino-blanca',
  'Camisa de lino 100% natural. Fresca y elegante para el verano uruguayo.',
  2490,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  40,
  true,
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800']
),
(
  'Camisa Jean Clásica',
  'camisa-jean-clasica',
  'Camisa de jean stonewashed. Un clásico que nunca pasa de moda.',
  2190,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  55,
  false,
  ARRAY['https://images.unsplash.com/photo-1598032895397-d9c0fcae8c35?w=800']
),
(
  'Camisa Cuadros Franela',
  'camisa-cuadros-franela',
  'Camisa de franela a cuadros. Perfecta para el otoño uruguayo.',
  1990,
  (SELECT id FROM categories WHERE slug = 'camisas'),
  50,
  false,
  ARRAY['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800', 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800']
);

-- =====================================================
-- 4. PRODUCTOS - PANTALONES
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Jean Skinny Negro',
  'jean-skinny-negro',
  'Jean negro de corte skinny. Elegante y versátil para cualquier ocasión.',
  3290,
  (SELECT id FROM categories WHERE slug = 'pantalones'),
  65,
  true,
  ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800']
),
(
  'Jean Mom Fit Celeste',
  'jean-mom-fit-celeste',
  'Jean mom fit de tiro alto. Cómodo y a la moda.',
  3490,
  (SELECT id FROM categories WHERE slug = 'pantalones'),
  50,
  true,
  ARRAY['https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800']
),
(
  'Pantalón Cargo Beige',
  'pantalon-cargo-beige',
  'Pantalón cargo con múltiples bolsillos. Estilo urbano y funcional.',
  2990,
  (SELECT id FROM categories WHERE slug = 'pantalones'),
  45,
  false,
  ARRAY['https://images.unsplash.com/photo-1624378440070-7b44c01f5b44?w=800']
),
(
  'Jogger Deportivo',
  'jogger-deportivo',
  'Jogger deportivo con cintura elástica. Comodidad máxima.',
  2290,
  (SELECT id FROM categories WHERE slug = 'pantalones'),
  70,
  false,
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800']
);

-- =====================================================
-- 5. PRODUCTOS - VESTIDOS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Vestido Midi Floreado',
  'vestido-midi-floreado',
  'Vestido midi con estampado floral. Ideal para ocasiones especiales.',
  3990,
  (SELECT id FROM categories WHERE slug = 'vestidos'),
  30,
  true,
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800']
),
(
  'Vestido Corto Negro',
  'vestido-corto-negro',
  'Vestido corto negro básico. Elegante y atemporal.',
  2890,
  (SELECT id FROM categories WHERE slug = 'vestidos'),
  40,
  false,
  ARRAY['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800']
),
(
  'Vestido Largo Bohemio',
  'vestido-largo-bohemio',
  'Vestido largo estilo bohemio con estampado étnico. Perfecto para el verano.',
  4290,
  (SELECT id FROM categories WHERE slug = 'vestidos'),
  25,
  true,
  ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800']
);

-- =====================================================
-- 6. PRODUCTOS - BUZOS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Buzo Canguro Gris',
  'buzo-canguro-gris',
  'Buzo con capucha y bolsillo canguro. Abrigado y cómodo.',
  2790,
  (SELECT id FROM categories WHERE slug = 'buzos'),
  80,
  true,
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800']
),
(
  'Sweater Cuello Alto',
  'sweater-cuello-alto',
  'Sweater de lana con cuello alto. Elegante y abrigado.',
  3490,
  (SELECT id FROM categories WHERE slug = 'buzos'),
  45,
  false,
  ARRAY['https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800']
),
(
  'Buzo Oversize Crema',
  'buzo-oversize-crema',
  'Buzo oversize de algodón premium. Suave y tendencia.',
  3190,
  (SELECT id FROM categories WHERE slug = 'buzos'),
  55,
  true,
  ARRAY['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800', 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=800']
);

-- =====================================================
-- 7. PRODUCTOS - CAMPERAS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Campera Puffer Negra',
  'campera-puffer-negra',
  'Campera acolchada tipo puffer. Máximo abrigo para el invierno uruguayo.',
  5990,
  (SELECT id FROM categories WHERE slug = 'camperas'),
  35,
  true,
  ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800']
),
(
  'Campera Jean Oversize',
  'campera-jean-oversize',
  'Campera de jean con corte oversize. Clásica y versátil.',
  4490,
  (SELECT id FROM categories WHERE slug = 'camperas'),
  40,
  true,
  ARRAY['https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800']
),
(
  'Campera Rompeviento',
  'campera-rompeviento',
  'Campera liviana rompeviento. Ideal para días ventosos.',
  3790,
  (SELECT id FROM categories WHERE slug = 'camperas'),
  50,
  false,
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', 'https://images.unsplash.com/photo-1548126032-079d06f0c333?w=800']
);

-- =====================================================
-- 8. PRODUCTOS - SHORTS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Short Jean Celeste',
  'short-jean-celeste',
  'Short de jean con ruedo deshilachado. Fresco para el verano.',
  1990,
  (SELECT id FROM categories WHERE slug = 'shorts'),
  60,
  false,
  ARRAY['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800']
),
(
  'Short Deportivo',
  'short-deportivo',
  'Short deportivo con tecnología dry-fit. Ideal para entrenar.',
  1590,
  (SELECT id FROM categories WHERE slug = 'shorts'),
  75,
  false,
  ARRAY['https://images.unsplash.com/photo-1519235106638-30cc49b5dbc5?w=800', 'https://images.unsplash.com/photo-1591195850636-d8f1d380c160?w=800']
);

-- =====================================================
-- 9. PRODUCTOS - ACCESORIOS
-- =====================================================
INSERT INTO public.products (name, slug, description, price, category_id, stock, is_featured, images) VALUES
(
  'Gorro Beanie Negro',
  'gorro-beanie-negro',
  'Gorro de lana tipo beanie. Abrigado y con estilo.',
  890,
  (SELECT id FROM categories WHERE slug = 'accesorios'),
  100,
  false,
  ARRAY['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800']
),
(
  'Bufanda Lana Gris',
  'bufanda-lana-gris',
  'Bufanda tejida de lana suave. Perfecta para el invierno.',
  1290,
  (SELECT id FROM categories WHERE slug = 'accesorios'),
  80,
  false,
  ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800']
),
(
  'Gorra Trucker Negra',
  'gorra-trucker-negra',
  'Gorra trucker con malla trasera. Estilo urbano.',
  790,
  (SELECT id FROM categories WHERE slug = 'accesorios'),
  90,
  false,
  ARRAY['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800']
);

-- =====================================================
-- 10. VARIANTES DE PRODUCTOS (Talles y Colores)
-- =====================================================

-- Remera Lisa Básica - Variantes por Talle
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Talle S', 'REM-BAS-S', 25, '[{"name": "Talle", "value": "S"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Talle M', 'REM-BAS-M', 30, '[{"name": "Talle", "value": "M"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Talle L', 'REM-BAS-L', 25, '[{"name": "Talle", "value": "L"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Talle XL', 'REM-BAS-XL', 20, '[{"name": "Talle", "value": "XL"}]'::jsonb);

-- Remera Lisa Básica - Variantes por Color
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Blanco', 'REM-BAS-BLA', 30, '[{"name": "Color", "value": "Blanco"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Negro', 'REM-BAS-NEG', 35, '[{"name": "Color", "value": "Negro"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'remera-lisa-basica'), 'Gris', 'REM-BAS-GRI', 35, '[{"name": "Color", "value": "Gris"}]'::jsonb);

-- Jean Skinny Negro - Variantes por Talle
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'jean-skinny-negro'), 'Talle 38', 'JEAN-SKI-38', 15, '[{"name": "Talle", "value": "38"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'jean-skinny-negro'), 'Talle 40', 'JEAN-SKI-40', 20, '[{"name": "Talle", "value": "40"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'jean-skinny-negro'), 'Talle 42', 'JEAN-SKI-42', 15, '[{"name": "Talle", "value": "42"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'jean-skinny-negro'), 'Talle 44', 'JEAN-SKI-44', 10, '[{"name": "Talle", "value": "44"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'jean-skinny-negro'), 'Talle 46', 'JEAN-SKI-46', 5, '[{"name": "Talle", "value": "46"}]'::jsonb);

-- Vestido Midi Floreado - Variantes por Talle
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'vestido-midi-floreado'), 'Talle S', 'VEST-MID-S', 10, '[{"name": "Talle", "value": "S"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'vestido-midi-floreado'), 'Talle M', 'VEST-MID-M', 12, '[{"name": "Talle", "value": "M"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'vestido-midi-floreado'), 'Talle L', 'VEST-MID-L', 8, '[{"name": "Talle", "value": "L"}]'::jsonb);

-- Buzo Canguro - Variantes por Talle
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Talle S', 'BUZO-CAN-S', 20, '[{"name": "Talle", "value": "S"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Talle M', 'BUZO-CAN-M', 25, '[{"name": "Talle", "value": "M"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Talle L', 'BUZO-CAN-L', 20, '[{"name": "Talle", "value": "L"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Talle XL', 'BUZO-CAN-XL', 15, '[{"name": "Talle", "value": "XL"}]'::jsonb);

-- Buzo Canguro - Variantes por Color
INSERT INTO public.product_variants (product_id, name, sku, stock, attributes) VALUES
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Gris', 'BUZO-CAN-GRI', 40, '[{"name": "Color", "value": "Gris"}]'::jsonb),
((SELECT id FROM products WHERE slug = 'buzo-canguro-gris'), 'Negro', 'BUZO-CAN-NEG', 40, '[{"name": "Color", "value": "Negro"}]'::jsonb);

-- =====================================================
-- 11. CUPONES DE DESCUENTO
-- =====================================================
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_purchase_amount, usage_limit, expires_at, is_active) VALUES
('BIENVENIDA10', '10% descuento para nuevos clientes', 'percentage', 10, 0, 100, NOW() + INTERVAL '30 days', true),
('VERANO2025', '15% descuento en compras mayores a $2000', 'percentage', 15, 2000, 50, NOW() + INTERVAL '60 days', true),
('ENVIOGRATIS', '$200 de descuento en envío', 'fixed', 200, 3000, 200, NOW() + INTERVAL '90 days', true),
('PRIMERACOMPRA', '20% descuento en tu primera compra', 'percentage', 20, 1500, 150, NOW() + INTERVAL '45 days', true);

-- =====================================================
-- 12. USUARIOS DE PRUEBA
-- =====================================================
-- IMPORTANTE: Estos usuarios deben crearse en Supabase Auth
-- Aquí solo dejamos comentado el SQL de ejemplo

/*
-- Usuario Admin (crear en Supabase Dashboard o via auth.admin.createUser)
-- Email: admin@tienda.com
-- Password: Admin123!

-- Usuario Cliente (crear en Supabase Dashboard o via auth.admin.createUser)
-- Email: cliente@ejemplo.com
-- Password: Cliente123!
*/

-- =====================================================
-- 13. ÓRDENES DE EJEMPLO
-- =====================================================
-- Nota: Estas órdenes requieren que los usuarios existan primero en auth.users
-- Descomentar después de crear los usuarios

/*
INSERT INTO public.orders (user_id, total, status, payment_method, shipping_address) VALUES
(
  (SELECT id FROM auth.users WHERE email = 'cliente@ejemplo.com'),
  4180,
  'delivered',
  'mercadopago',
  jsonb_build_object(
    'name', 'Juan Pérez',
    'street', 'Av. 18 de Julio 1234',
    'city', 'Montevideo',
    'state', 'Montevideo',
    'zip', '11200',
    'phone', '099123456'
  )
);

-- Items de la orden
INSERT INTO public.order_items (order_id, product_id, quantity, price) VALUES
(
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM products WHERE slug = 'remera-lisa-basica'),
  2,
  890
),
(
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM products WHERE slug = 'jean-skinny-negro'),
  1,
  3290
);
*/

-- =====================================================
-- 14. RESEÑAS DE PRODUCTOS
-- =====================================================
-- Nota: Requieren usuarios y productos existentes
-- Descomentar después de crear usuarios

/*
INSERT INTO public.reviews (product_id, user_id, rating, comment) VALUES
(
  (SELECT id FROM products WHERE slug = 'remera-lisa-basica'),
  (SELECT id FROM auth.users WHERE email = 'cliente@ejemplo.com'),
  5,
  'Excelente calidad, muy cómoda y el talle es perfecto. La recomiendo!'
),
(
  (SELECT id FROM products WHERE slug = 'jean-skinny-negro'),
  (SELECT id FROM auth.users WHERE email = 'cliente@ejemplo.com'),
  4,
  'Buen jean, queda bien pero el negro se desteñe un poco con los lavados.'
);
*/

-- =====================================================
-- 15. CONFIGURACIÓN DE ENVÍOS (Departamentos de Uruguay)
-- =====================================================
INSERT INTO public.shipping_costs (department, cost, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active) VALUES
('Montevideo', 200, 3000, 1, 2, true),
('Canelones', 250, 3500, 1, 3, true),
('Maldonado', 300, 4000, 2, 4, true),
('Colonia', 350, 4000, 2, 4, true),
('San José', 280, 3500, 2, 3, true),
('Florida', 320, 3800, 2, 4, true),
('Lavalleja', 350, 4000, 2, 4, true),
('Rocha', 380, 4200, 3, 5, true),
('Treinta y Tres', 400, 4500, 3, 5, true),
('Cerro Largo', 420, 4500, 3, 5, true),
('Rivera', 450, 5000, 3, 6, true),
('Tacuarembó', 430, 4800, 3, 5, true),
('Salto', 460, 5000, 3, 6, true),
('Artigas', 480, 5200, 4, 6, true),
('Paysandú', 400, 4500, 3, 5, true),
('Río Negro', 380, 4300, 2, 4, true),
('Soriano', 360, 4200, 2, 4, true),
('Durazno', 350, 4000, 2, 4, true),
('Flores', 340, 3900, 2, 4, true);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
-- Mostrar resumen de datos cargados

SELECT
  'RESUMEN DE SEED' as info,
  (SELECT COUNT(*) FROM categories) as categorias,
  (SELECT COUNT(*) FROM products) as productos,
  (SELECT COUNT(*) FROM product_variants) as variantes,
  (SELECT COUNT(*) FROM coupons) as cupones,
  (SELECT COUNT(*) FROM shipping_costs) as costos_envio;

-- Mostrar productos por categoría
SELECT
  c.name as categoria,
  COUNT(p.id) as cantidad_productos,
  MIN(p.price) as precio_minimo,
  MAX(p.price) as precio_maximo,
  AVG(p.price)::integer as precio_promedio
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name
ORDER BY c.name;

SELECT '✓ Seed completado exitosamente!' as resultado;
