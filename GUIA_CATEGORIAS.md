# Sistema de Categorías - Guía Completa

## Índice
1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Backend (Server Actions)](#backend-server-actions)
4. [Componentes del Frontend](#componentes-del-frontend)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Características Principales](#características-principales)

---

## Descripción General

El sistema de categorías permite organizar productos en una estructura jerárquica (árbol) con categorías padre e hijas. Incluye funcionalidades completas de CRUD (Crear, Leer, Actualizar, Eliminar) con una interfaz administrativa intuitiva.

### Características Principales
- ✅ Estructura jerárquica (categorías padre e hijas)
- ✅ Imágenes por categoría con upload a Supabase Storage
- ✅ Slugs automáticos para SEO
- ✅ Estados activo/inactivo
- ✅ Orden personalizable
- ✅ Vista en grid y tabla
- ✅ Visualización de árbol jerárquico
- ✅ Validación de referencias circulares

---

## Estructura de Base de Datos

### Tabla: `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR | Nombre de la categoría |
| `slug` | VARCHAR | URL amigable (único) |
| `description` | TEXT | Descripción opcional |
| `parent_id` | UUID | ID de categoría padre (NULL si es raíz) |
| `image_url` | TEXT | URL de imagen en Supabase Storage |
| `is_active` | BOOLEAN | Estado activo/inactivo |
| `sort_order` | INTEGER | Orden de visualización |

---

## Backend (Server Actions)

### Ubicación
```
actions/
├── categories/
│   ├── index.ts          # Exportaciones
│   ├── queries.ts        # Consultas
│   └── mutations.ts      # Mutaciones (CREATE, UPDATE, DELETE)
```

### Queries (`actions/categories/queries.ts`)

#### `getCategories(activeOnly?: boolean)`
Obtiene todas las categorías.

```typescript
const categories = await getCategories(false); // Todas
const activeCategories = await getCategories(true); // Solo activas
```

#### `getCategoryById(id: string)`
Obtiene una categoría por su ID.

```typescript
const category = await getCategoryById('uuid-here');
```

#### `getCategoryBySlug(slug: string)`
Obtiene una categoría por su slug.

```typescript
const category = await getCategoryBySlug('electronica');
```

#### `getCategoriesTree()`
Obtiene las categorías en estructura de árbol.

```typescript
const tree = await getCategoriesTree();
// [
//   { id: '1', name: 'Electrónica', children: [...] },
//   { id: '2', name: 'Ropa', children: [...] }
// ]
```

#### `getSubcategories(parentId: string)`
Obtiene las subcategorías de una categoría.

```typescript
const subcategories = await getSubcategories('parent-uuid');
```

### Mutations (`actions/categories/mutations.ts`)

#### `createCategory(data: CreateCategoryInput)`
Crea una nueva categoría.

```typescript
const result = await createCategory({
  name: 'Electrónica',
  slug: 'electronica',
  description: 'Productos electrónicos',
  parent_id: null,
  image_url: 'https://...',
  is_active: true,
  sort_order: 0
});

if (result.success) {
  console.log(result.data); // Categoría creada
} else {
  console.error(result.error);
}
```

#### `updateCategory(data: UpdateCategoryInput)`
Actualiza una categoría existente.

```typescript
const result = await updateCategory({
  id: 'category-uuid',
  name: 'Electrónica Actualizada',
  // ... otros campos
});
```

#### `deleteCategory(id: string)`
Elimina una categoría.

```typescript
const result = await deleteCategory('category-uuid');
```

**⚠️ Nota**: Si la categoría tiene subcategorías, estas quedarán huérfanas (parent_id = NULL).

---

## Componentes del Frontend

### 1. CategoryForm (`components/admin/CategoryForm.tsx`)

Formulario completo para crear/editar categorías.

#### Props
```typescript
interface CategoryFormProps {
  category?: Category;      // Para edición (undefined para crear)
  categories: Category[];   // Todas las categorías (para selector padre)
}
```

#### Características
- Validación con Zod y React Hook Form
- Upload de imágenes a Supabase Storage
- Generación automática de slug desde el nombre
- Selector de categoría padre (con prevención de referencias circulares)
- Estado activo/inactivo
- Orden personalizable

#### Ejemplo de uso
```tsx
// Crear nueva categoría
<CategoryForm categories={allCategories} />

// Editar categoría existente
<CategoryForm category={existingCategory} categories={allCategories} />
```

### 2. CategoryList (`components/admin/CategoryList.tsx`)

Lista de categorías con vista grid/tabla.

#### Props
```typescript
interface CategoryListProps {
  categories: Category[];
}
```

#### Características
- **Vista Grid**: Tarjetas con imagen, descripción y subcategorías
- **Vista Tabla**: Tabla con estructura de árbol
- Indicadores de estado (activo/inactivo)
- Contador de subcategorías
- Acciones: Editar y Eliminar
- Diálogo de confirmación para eliminar

#### Ejemplo de uso
```tsx
<CategoryList categories={categories} />
```

### 3. Páginas del Admin

#### Lista de Categorías (`app/(admin)/admin/categories/page.tsx`)
```tsx
export default async function CategoriesPage() {
  const categories = await getCategories(false);
  return <CategoryList categories={categories} />;
}
```

**URL**: `/admin/categories`

#### Nueva Categoría (`app/(admin)/admin/categories/new/page.tsx`)
```tsx
export default async function NewCategoryPage() {
  const categories = await getCategories(false);
  return (
    <div className="space-y-6">
      <h1>Nueva Categoría</h1>
      <CategoryForm categories={categories} />
    </div>
  );
}
```

**URL**: `/admin/categories/new`

#### Editar Categoría (`app/(admin)/admin/categories/[id]/page.tsx`)
```tsx
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategoryById(id),
    getCategories(false),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1>Editar Categoría</h1>
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
```

**URL**: `/admin/categories/[id]`

---

## Flujos de Usuario

### Crear una Categoría

1. Usuario navega a `/admin/categories`
2. Clic en "Nueva Categoría"
3. Completa el formulario:
   - Nombre (obligatorio)
   - Slug (auto-generado, editable)
   - Descripción
   - Imagen (opcional)
   - Categoría padre (opcional)
   - Estado activo/inactivo
   - Orden
4. Clic en "Crear Categoría"
5. Redirección a `/admin/categories`

### Editar una Categoría

1. Usuario navega a `/admin/categories`
2. Clic en "Editar" en una categoría
3. Modifica los campos deseados
4. Clic en "Actualizar Categoría"
5. Redirección a `/admin/categories`

### Eliminar una Categoría

1. Usuario navega a `/admin/categories`
2. Clic en icono de "Eliminar" (papelera)
3. Diálogo de confirmación:
   - Muestra nombre de categoría
   - Advierte si tiene subcategorías
4. Confirmar eliminación
5. Categoría eliminada, lista actualizada

### Cambiar Vista (Grid/Tabla)

1. Usuario navega a `/admin/categories`
2. Clic en botón "Ver Tabla" o "Ver Tarjetas"
3. La vista cambia instantáneamente

---

## Características Principales

### 1. Estructura Jerárquica

Las categorías pueden tener relaciones padre-hijo:

```
Electrónica (padre)
  ├── Computadoras (hijo)
  ├── Celulares (hijo)
  └── Accesorios (hijo)
      └── Cables (nieto)
```

**Código de ejemplo** (construcción de árbol):
```typescript
const buildTree = (parentId: string | null = null): CategoryWithChildren[] => {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildTree(cat.id),
    }));
};

const rootCategories = buildTree(null);
```

### 2. Upload de Imágenes

Utiliza el hook `useFileUpload` para subir imágenes a Supabase Storage.

```typescript
const { upload, isUploading, progress } = useFileUpload({
  bucket: STORAGE_BUCKETS.CATEGORIES,
  maxSize: 5, // MB
  allowedTypes: ['image/*'],
  onSuccess: (result) => {
    setImageUrl(result.publicUrl);
  },
});
```

**Bucket**: `categories`

### 3. Slugificación Automática

Convierte el nombre en un slug SEO-friendly:

```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Ejemplo:
generateSlug('Electrónica & Accesorios') // => 'electronica-accesorios'
```

### 4. Prevención de Referencias Circulares

El formulario valida que una categoría no pueda ser su propio padre o descendiente:

```typescript
const availableParents = categories.filter((cat) => {
  if (category && cat.id === category.id) return false;
  if (category && isDescendant(cat.id, category.id, categories)) return false;
  return true;
});
```

### 5. Estados Activo/Inactivo

Las categorías pueden estar activas o inactivas:

- **Activas**: Visibles en el frontend
- **Inactivas**: Ocultas en el frontend, visibles en admin

```typescript
const activeCategories = await getCategories(true);
const allCategories = await getCategories(false);
```

### 6. Vista Grid vs Tabla

**Grid**: Ideal para ver imágenes y descripciones
- Tarjetas con imagen destacada
- Descripción visible
- Badges de subcategorías

**Tabla**: Ideal para operaciones masivas
- Estructura de árbol visible (con indentación)
- Más compacta
- Mejor para grandes cantidades de categorías

---

## Validación de Datos

### Schema Zod (`schemas/category.schema.ts`)

```typescript
export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  slug: z.string().min(1, 'El slug es requerido').max(255),
  description: z.string().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url('URL de imagen inválida').optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});
```

### Mensajes de Error

- **Nombre vacío**: "El nombre es requerido"
- **Slug vacío**: "El slug es requerido"
- **Slug duplicado**: "Ya existe una categoría con este slug"
- **URL de imagen inválida**: "URL de imagen inválida"
- **Referencia circular**: Prevención en frontend

---

## Mejores Prácticas

### 1. Organización de Categorías

- Mantener la jerarquía poco profunda (máximo 3 niveles)
- Usar nombres descriptivos y cortos
- Evitar duplicados semánticos

### 2. Imágenes

- Tamaño recomendado: 800x600px
- Formato: JPG o PNG
- Peso máximo: 5MB
- Usar imágenes representativas

### 3. Slugs

- Dejar que se generen automáticamente
- Solo editar si es necesario para SEO
- Evitar cambios frecuentes (afecta URLs)

### 4. Estados

- Usar "Inactivo" en lugar de eliminar categorías con productos
- Activar/desactivar según temporadas o disponibilidad

---

## Integración con Productos

### Relación con Productos

Los productos se asocian a categorías mediante:

```typescript
// En la tabla products
category_id: UUID REFERENCES categories(id)
```

### Obtener Productos de una Categoría

```typescript
const products = await supabase
  .from('products')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_active', true);
```

### Mostrar Categorías en el Frontend

```typescript
// Obtener categorías activas para navegación
const categories = await getCategories(true);

// Construir menú de navegación
<nav>
  {categories.map((category) => (
    <Link key={category.id} href={`/categories/${category.slug}`}>
      {category.name}
    </Link>
  ))}
</nav>
```

---

## Próximas Mejoras Sugeridas

1. **Importación/Exportación CSV**
   - Exportar todas las categorías a CSV
   - Importar categorías masivamente

2. **Reordenamiento Drag & Drop**
   - Arrastrar y soltar para cambiar orden
   - Mover categorías entre padres

3. **Metadatos SEO**
   - Meta title personalizado
   - Meta description
   - Keywords

4. **Estadísticas**
   - Número de productos por categoría
   - Categorías más visitadas
   - Tendencias

5. **Filtros y Búsqueda**
   - Buscar categorías por nombre
   - Filtrar por estado (activo/inactivo)
   - Filtrar por categoría padre

---

## Troubleshooting

### Error: "Ya existe una categoría con este slug"
**Solución**: Cambiar el slug a uno único o modificar el nombre para que genere un slug diferente.

### Error: Imagen no se muestra
**Solución**: Verificar que:
1. El bucket 'categories' existe en Supabase Storage
2. Las políticas RLS permiten lectura pública
3. La URL es válida y accesible

### Error: No se puede eliminar categoría
**Solución**: Verificar que no haya restricciones de base de datos. Si tiene productos asociados, considerar desactivar en lugar de eliminar.

### Categorías no aparecen en orden correcto
**Solución**: Ajustar el campo `sort_order`. Valores más bajos aparecen primero.

---

## Resumen

El sistema de categorías proporciona una solución completa y robusta para organizar productos en tu e-commerce. Con funcionalidades de CRUD completas, soporte para jerarquías, imágenes, y una interfaz intuitiva, permite gestionar eficientemente la taxonomía de productos.

**Archivos clave**:
- `actions/categories/queries.ts` - Consultas
- `actions/categories/mutations.ts` - Mutaciones
- `components/admin/CategoryForm.tsx` - Formulario
- `components/admin/CategoryList.tsx` - Lista
- `app/(admin)/admin/categories/` - Páginas del admin
