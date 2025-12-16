# Guía de Reset y Seed de Base de Datos

Esta guía te ayudará a resetear completamente la base de datos y cargar datos iniciales de una tienda de ropa uruguaya.

## Archivos Disponibles

- `reset_database.sql` - Limpia completamente la base de datos
- `seed.sql` - Carga datos iniciales de productos de ropa con precios uruguayos
- `add_email_verification_tokens.sql` - Migración para tokens de verificación de email (si no está aplicada)

## Paso 1: Backup (Recomendado)

Antes de proceder, es recomendable hacer un backup de tu base de datos actual desde el panel de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Settings → Database → Backups
3. Crea un backup manual antes de proceder

## Paso 2: Ejecutar Reset de Base de Datos

### Opción A: Desde Supabase SQL Editor (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Click en "SQL Editor" en el menú lateral
3. Click en "New Query"
4. Copia y pega el contenido completo de `reset_database.sql`
5. Click en "Run" o presiona `Ctrl + Enter`
6. Verifica que la salida muestre: `✓ Base de datos reseteada completamente!`

### Opción B: Desde CLI de Supabase

```bash
# Asegúrate de estar en el directorio del proyecto
cd "c:\Users\EnzoP\OneDrive\Escritorio\Proyectos 2026 ENZO - VALE\eccomerce_base"

# Ejecuta el reset
supabase db reset --db-url "postgresql://postgres:[TU_PASSWORD]@[TU_HOST]:5432/postgres"

# O si tienes supabase CLI configurado con tu proyecto:
npx supabase db push --file supabase/reset_database.sql
```

## Paso 3: Aplicar Migración de Email Verification (Si es necesario)

Si aún no aplicaste la migración de tokens de verificación de email:

1. En Supabase SQL Editor, crea una nueva query
2. Copia y pega el contenido de `add_email_verification_tokens.sql`
3. Ejecuta la query

## Paso 4: Cargar Datos Iniciales (Seed)

### Desde Supabase SQL Editor:

1. En SQL Editor, crea una nueva query
2. Copia y pega el contenido completo de `seed.sql`
3. Click en "Run"
4. Verifica la salida:
   - Deberías ver un resumen con cantidades de registros insertados
   - Tabla de productos por categoría con precios
   - Mensaje: `✓ Seed completado exitosamente!`

### Verificación de Datos Cargados:

Ejecuta esta query para verificar:

```sql
-- Ver resumen de datos
SELECT
  'RESUMEN' as tipo,
  (SELECT COUNT(*) FROM categories) as categorias,
  (SELECT COUNT(*) FROM products) as productos,
  (SELECT COUNT(*) FROM product_variants) as variantes,
  (SELECT COUNT(*) FROM coupons) as cupones,
  (SELECT COUNT(*) FROM shipping_zones) as zonas_envio;

-- Ver productos por categoría
SELECT
  c.name as categoria,
  COUNT(p.id) as cantidad,
  MIN(p.price) as precio_min,
  MAX(p.price) as precio_max
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name
ORDER BY c.name;
```

Deberías ver:
- 8 Categorías (Remeras, Camisas, Pantalones, Vestidos, Buzos, Camperas, Shorts, Accesorios)
- 24 Productos
- 24 Variantes (talles y colores)
- 4 Cupones activos
- 19 Zonas de envío (todos los departamentos de Uruguay)

## Paso 5: Crear Usuarios de Prueba

Los datos de seed NO incluyen usuarios porque deben crearse en Supabase Auth. Puedes crearlos de 2 formas:

### Opción A: Desde Supabase Dashboard (Más Fácil)

1. Ve a Authentication → Users
2. Click "Add user"
3. Crea estos usuarios:

**Usuario Admin:**
- Email: `admin@tienda.com`
- Password: `Admin123!`
- Marca "Auto Confirm User" ✓

**Usuario Cliente:**
- Email: `cliente@ejemplo.com`
- Password: `Cliente123!`
- Marca "Auto Confirm User" ✓

### Opción B: Desde la Aplicación

Simplemente usa la funcionalidad de registro de tu aplicación. El sistema de verificación de email está configurado y funcionando.

## Paso 6: (Opcional) Cargar Órdenes y Reseñas de Ejemplo

Una vez que tengas usuarios creados, puedes descomentar y ejecutar las secciones 13 y 14 del archivo `seed.sql`:

1. Abre `seed.sql`
2. Busca las secciones comentadas:
   - `-- 13. ÓRDENES DE EJEMPLO`
   - `-- 14. RESEÑAS DE PRODUCTOS`
3. Quita los `/*` y `*/` para descomentar
4. Ejecuta solo esas secciones en SQL Editor

## Datos Cargados en el Seed

### Categorías (8)
- Remeras
- Camisas
- Pantalones
- Vestidos
- Buzos
- Camperas
- Shorts
- Accesorios

### Productos por Categoría (24 total)

**Remeras (4 productos)**
- Remera Lisa Básica - $890
- Remera Oversize Urban - $1,290
- Remera Rayada Náutica - $1,150
- Remera Estampada Floral - $1,390

**Camisas (3 productos)**
- Camisa Lino Blanca - $2,490
- Camisa Jean Clásica - $2,190
- Camisa Cuadros Franela - $1,990

**Pantalones (4 productos)**
- Jean Skinny Negro - $3,290
- Jean Mom Fit Celeste - $3,490
- Pantalón Cargo Beige - $2,990
- Jogger Deportivo - $2,290

**Vestidos (3 productos)**
- Vestido Midi Floreado - $3,990
- Vestido Corto Negro - $2,890
- Vestido Largo Bohemio - $4,290

**Buzos (3 productos)**
- Buzo Canguro Gris - $2,790
- Sweater Cuello Alto - $3,490
- Buzo Oversize Crema - $3,190

**Camperas (3 productos)**
- Campera Puffer Negra - $5,990
- Campera Jean Oversize - $4,490
- Campera Rompeviento - $3,790

**Shorts (2 productos)**
- Short Jean Celeste - $1,990
- Short Deportivo - $1,590

**Accesorios (3 productos)**
- Gorro Beanie Negro - $890
- Bufanda Lana Gris - $1,290
- Gorra Trucker Negra - $790

### Cupones de Descuento (4)
- `BIENVENIDA10` - 10% descuento, mín $0
- `VERANO2025` - 15% descuento, mín $2,000
- `ENVIOGRATIS` - $200 descuento fijo, mín $3,000
- `PRIMERACOMPRA` - 20% descuento, mín $1,500

### Zonas de Envío (19 departamentos)
Todos los departamentos de Uruguay con costos realistas:
- Montevideo: $200 envío / Gratis desde $3,000
- Canelones: $250 envío / Gratis desde $3,500
- Maldonado: $300 envío / Gratis desde $4,000
- ... (todos los departamentos configurados)

## Troubleshooting

### Error: "relation does not exist"
- Asegúrate de ejecutar primero `reset_database.sql` antes de `seed.sql`
- Verifica que estés conectado a la base de datos correcta

### Error: "foreign key violation"
- Ejecuta los scripts en orden: reset → migrations → seed
- No modifiques el orden de los INSERT en seed.sql

### Los productos no se ven en la aplicación
- Verifica que las imágenes existen en `/public/images/`
- O actualiza las URLs de imágenes en seed.sql antes de ejecutar

### No puedo login con usuarios de prueba
- Recuerda que los usuarios deben crearse manualmente en Supabase Auth
- No se pueden crear usuarios directamente en SQL por seguridad

## Próximos Pasos

1. Actualiza las URLs de las imágenes en `seed.sql` con tus propias imágenes
2. Ajusta los precios según tu mercado objetivo
3. Modifica las descripciones de productos según tu marca
4. Configura las políticas RLS si es necesario
5. Prueba el flujo completo de compra con los datos de prueba

## Notas Importantes

- **Todos los precios están en pesos uruguayos (UYU)**
- Los productos son ejemplos de ropa básica adaptada al mercado uruguayo
- Las zonas de envío cubren todos los departamentos de Uruguay
- Los cupones tienen fecha de expiración relativa (30-90 días desde hoy)
- Las variantes incluyen talles (S, M, L, XL) y colores comunes

---

**¿Necesitas ayuda?** Revisa los logs de Supabase en Database → Logs para más detalles sobre errores.
