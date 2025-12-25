# Guía para Clonar la Estructura de Supabase

Esta guía te ayudará a replicar toda la estructura de la base de datos, funciones, triggers, políticas RLS y storage de Supabase en un nuevo proyecto.

## Métodos de Clonación

Hay tres formas de clonar la estructura de Supabase:

1. **Método Recomendado**: Usando las migraciones SQL (más fácil)
2. **Método CLI**: Usando Supabase CLI (más control)
3. **Método Manual**: Copiando desde el dashboard (no recomendado)

---

## Método 1: Usando las Migraciones SQL (Recomendado)

Este es el método más simple y rápido. Todas las migraciones están en la carpeta `supabase/migrations/`.

### Paso 1: Crear un Nuevo Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Espera a que termine de inicializarse
4. Anota las credenciales (URL, Anon Key, Service Role Key)

### Paso 2: Ejecutar las Migraciones

Ve al **SQL Editor** en el dashboard de Supabase y ejecuta cada archivo en orden:

#### Orden de Ejecución

```
1. 001_initial_schema.sql          - Esquema base, tablas principales
2. 002_customer_tables.sql         - Tablas de clientes y direcciones
3. 003_coupons_table.sql           - Sistema de cupones
4. 004_reviews_system.sql          - Sistema de reviews y calificaciones
5. 005_cart_system.sql             - Carrito de compras persistente
6. 006_auth_improvements.sql       - Mejoras de autenticación
7. 007_email_verification_complete.sql - Verificación de email
8. 008_sync_auth_users.sql         - Sincronización de usuarios
9. 009_shipping_costs.sql          - Costos de envío
10. 010_stock_reservations.sql     - Reservas de stock
11. 011_database_indexes.sql       - Índices para performance
```

#### Cómo Ejecutar

1. Abre el archivo de migración en tu editor
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en "Run" o presiona Ctrl+Enter
5. Verifica que no haya errores
6. Repite para cada migración

### Paso 3: Configurar Storage

1. Ejecuta `supabase/storage-setup.sql` en el SQL Editor para crear las políticas
2. Ve a **Storage** en el dashboard
3. Crea los siguientes buckets manualmente:

| Nombre      | Público | Tamaño Máximo | Tipos Permitidos       |
|-------------|---------|---------------|------------------------|
| products    | ✓       | 5MB           | image/*                |
| avatars     | ✓       | 5MB           | image/*                |
| categories  | ✓       | 5MB           | image/*                |
| banners     | ✓       | 5MB           | image/*                |
| documents   | ✗       | 10MB          | application/pdf, etc   |

### Paso 4: Configurar Autenticación

1. Ve a **Authentication > Providers**
2. Habilita **Email**
3. En **URL Configuration**, configura:
   - Site URL: `http://localhost:3000` (o tu dominio)
   - Redirect URLs: agrega `http://localhost:3000/**` (o tu dominio)

### Paso 5: Verificación

Ejecuta esta consulta para verificar que todo se creó correctamente:

```sql
-- Verificar tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debería retornar:
-- banners
-- cart_items
-- categories
-- coupons
-- customer_addresses
-- customer_payment_methods
-- email_verification_tokens
-- order_items
-- orders
-- product_reviews
-- product_variants
-- products
-- review_helpful_votes
-- review_reports
-- shipping_zones
-- stock_reservations
-- store_settings
-- users

-- Verificar funciones
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verificar buckets de storage
SELECT * FROM storage.buckets;
```

---

## Método 2: Usando Supabase CLI (Avanzado)

Este método requiere la instalación de Supabase CLI y es útil si quieres tener control total sobre las migraciones.

### Paso 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Paso 2: Inicializar Supabase en tu Proyecto

```bash
cd tu-proyecto
supabase init
```

### Paso 3: Vincular al Proyecto Remoto

```bash
supabase link --project-ref tu-project-ref
```

El `project-ref` lo encuentras en la URL de tu proyecto: `https://app.supabase.com/project/[project-ref]`

### Paso 4: Hacer Push de las Migraciones

```bash
supabase db push
```

Esto ejecutará todas las migraciones en `supabase/migrations/` en orden.

### Paso 5: Configurar Storage (Manual)

Lamentablemente, el CLI no soporta crear buckets automáticamente. Debes crearlos manualmente como en el Método 1, Paso 3.

---

## Método 3: Exportar/Importar desde el Dashboard (No Recomendado)

Este método es manual y propenso a errores. Solo úsalo si los otros métodos no funcionan.

### Exportar desde el Proyecto Original

1. Ve a **SQL Editor** en el proyecto original
2. Ejecuta este script para obtener el DDL:

```sql
-- Exportar estructura de tablas
SELECT
  'CREATE TABLE ' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || data_type ||
    CASE WHEN character_maximum_length IS NOT NULL
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
```

3. Copia el resultado y guárdalo

### Importar en el Nuevo Proyecto

1. Abre el SQL Editor del nuevo proyecto
2. Pega el DDL exportado
3. Ejecuta

**Nota**: Este método NO copia:
- Triggers
- Funciones
- Políticas RLS
- Índices
- Relaciones (Foreign Keys)

Por eso es mejor usar el Método 1 o 2.

---

## Datos de Prueba (Seed)

Si quieres agregar datos de prueba, ejecuta:

```bash
supabase/seed.sql
```

Este archivo crea:
- Categorías de ejemplo
- Productos de ejemplo
- Configuración inicial de la tienda
- Usuario admin de prueba

---

## Migrar Datos Entre Proyectos

Si necesitas copiar **datos reales** de un proyecto a otro (no solo la estructura):

### Opción 1: Usando el Dashboard

1. Ve a **Table Editor** en el proyecto original
2. Selecciona una tabla
3. Exporta como CSV
4. Importa el CSV en el nuevo proyecto

### Opción 2: Usando SQL

```sql
-- En el proyecto original, exporta a JSON
COPY (SELECT row_to_json(t) FROM (SELECT * FROM products) t)
TO '/tmp/products.json';

-- En el nuevo proyecto, importa
-- (Este método requiere acceso directo a PostgreSQL)
```

### Opción 3: Usando Supabase CLI

```bash
# Hacer backup del proyecto original
supabase db dump -f backup.sql

# Restaurar en el nuevo proyecto
supabase db push -f backup.sql
```

---

## Storage: Copiar Archivos

Los buckets se crean vacíos. Si necesitas copiar archivos:

### Opción 1: Manual

1. Descarga los archivos del bucket original
2. Súbelos al bucket nuevo

### Opción 2: Script de Migración

Puedes crear un script en Node.js:

```javascript
const { createClient } = require('@supabase/supabase-js');

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateStorage(bucketName) {
  const { data: files } = await oldSupabase.storage
    .from(bucketName)
    .list();

  for (const file of files) {
    const { data } = await oldSupabase.storage
      .from(bucketName)
      .download(file.name);

    await newSupabase.storage
      .from(bucketName)
      .upload(file.name, data);
  }
}

migrateStorage('products');
migrateStorage('avatars');
// ... etc
```

---

## Checklist de Clonación

Usa este checklist para asegurarte de que todo está configurado:

### Base de Datos

- [ ] Todas las migraciones ejecutadas sin errores
- [ ] Tablas creadas correctamente
- [ ] Funciones creadas
- [ ] Triggers activos
- [ ] Índices creados
- [ ] Vistas creadas
- [ ] Políticas RLS configuradas

### Storage

- [ ] Bucket `products` creado (público)
- [ ] Bucket `avatars` creado (público)
- [ ] Bucket `categories` creado (público)
- [ ] Bucket `banners` creado (público)
- [ ] Bucket `documents` creado (privado)
- [ ] Políticas de storage configuradas

### Autenticación

- [ ] Provider de Email habilitado
- [ ] URLs de redirect configuradas
- [ ] Templates de email personalizados (opcional)

### Configuración

- [ ] Variables de entorno actualizadas
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada

### Verificación Final

Ejecuta este SQL para verificar:

```sql
-- Contar tablas
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Debe retornar: 18 tablas

-- Contar funciones
SELECT COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_schema = 'public';
-- Debe retornar: varias funciones

-- Contar políticas RLS
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
-- Debe retornar: múltiples políticas

-- Verificar buckets
SELECT name, public FROM storage.buckets;
-- Debe retornar: 5 buckets
```

---

## Troubleshooting

### Error: "relation already exists"

**Causa**: Ya ejecutaste esa migración antes.

**Solución**: Salta esa migración o resetea la base de datos.

### Error: "permission denied"

**Causa**: Las políticas RLS están bloqueando la operación.

**Solución**: Ejecuta el SQL como `service_role` o deshabilita RLS temporalmente:

```sql
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
-- Ejecuta tu operación
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

### Error: "function does not exist"

**Causa**: Ejecutaste las migraciones en desorden.

**Solución**: Ejecuta las migraciones en el orden correcto.

### Buckets no se crean

**Causa**: No hay forma de crear buckets con SQL.

**Solución**: Créalos manualmente desde el dashboard.

---

## Recursos Adicionales

- [Documentación de Supabase CLI](https://supabase.com/docs/guides/cli)
- [Migraciones de Supabase](https://supabase.com/docs/guides/cli/managing-environments)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

---

## Contacto

Si tienes problemas con la clonación, revisa:
1. Los logs de error en el SQL Editor
2. La consola del navegador
3. Los logs de Supabase en el dashboard
