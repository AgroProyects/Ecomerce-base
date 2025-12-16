# Guía del Panel de Administración de Productos

Sistema completo de administración de productos para tu e-commerce.

## Arquitectura Implementada

### Server Actions ([actions/products/](actions/products/))

#### Queries (queries.ts)
- `getProducts()` - Listar productos con filtros y paginación
- `getProductById()` - Obtener producto por ID
- `getProductBySlug()` - Obtener producto por slug
- `getFeaturedProducts()` - Productos destacados
- `getNewArrivals()` - Nuevos productos
- `getRelatedProducts()` - Productos relacionados
- `searchProducts()` - Búsqueda de productos

#### Create (create.ts)
- `createProduct()` - Crear nuevo producto con validación

#### Update (update.ts)
- `updateProduct()` - Actualizar producto existente

#### Delete (delete.ts)
- `deleteProduct()` - Eliminar producto

#### Stock Management (stock.ts) ✨ NUEVO
- `updateProductStock()` - Actualizar stock directamente
- `adjustProductStock()` - Ajustar stock (incrementar/decrementar)
- `getLowStockProducts()` - Productos con stock bajo
- `getOutOfStockProducts()` - Productos sin stock

#### Status Management (status.ts) ✨ NUEVO
- `toggleProductStatus()` - Activar/desactivar producto
- `toggleProductFeatured()` - Marcar/desmarcar como destacado
- `bulkUpdateStatus()` - Actualización masiva de estado

### Componentes de Admin

#### ProductForm ([components/admin/ProductForm.tsx](components/admin/ProductForm.tsx))
Formulario completo con todas las funcionalidades:
- Información básica (nombre, slug, descripción, categoría)
- Gestión de imágenes con drag & drop
- Precios (precio, precio de comparación, costo)
- Inventario (stock, umbral de stock bajo)
- SEO (título SEO, descripción SEO)
- Estado (activo, destacado)

#### ProductImageManager ([components/admin/ProductImageManager.tsx](components/admin/ProductImageManager.tsx))
Gestor de imágenes integrado con Supabase Storage:
- Upload múltiple de imágenes
- Drag & drop para reordenar
- Preview en tiempo real
- Eliminación de imágenes
- Marcado de imagen principal
- Límite de 10 imágenes por producto

### Validaciones

El sistema usa Zod para validación robusta:

```typescript
// schemas/product.schema.ts
- Nombre: 2-200 caracteres
- Slug: formato válido (a-z, 0-9, guiones)
- Precio: 0-99,999,999.99
- Imágenes: al menos 1, máximo 10
- Stock: número entero no negativo
- SEO Title: máximo 70 caracteres
- SEO Description: máximo 160 caracteres
```

## Uso del Sistema

### 1. Crear un Producto

```typescript
// En tu página de admin
import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/actions/categories';

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nuevo Producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
```

### 2. Editar un Producto

```typescript
import { ProductForm } from '@/components/admin/ProductForm';
import { getProductById } from '@/actions/products';
import { getCategories } from '@/actions/categories';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    getProductById(params.id),
    getCategories(),
  ]);

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Producto</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
```

### 3. Gestión de Stock

```typescript
'use client';

import { updateProductStock, adjustProductStock } from '@/actions/products';
import { toast } from 'sonner';

export function StockManager({ productId, currentStock }: Props) {
  const handleUpdateStock = async (newStock: number) => {
    const result = await updateProductStock({
      productId,
      stock: newStock,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const handleAdjustStock = async (adjustment: number) => {
    const result = await adjustProductStock({
      productId,
      adjustment,
      reason: 'Ajuste manual',
    });

    if (result.success) {
      toast.success(result.message);
    }
  };

  return (
    <div>
      {/* UI para gestionar stock */}
    </div>
  );
}
```

### 4. Cambiar Estado del Producto

```typescript
'use client';

import { toggleProductStatus, toggleProductFeatured } from '@/actions/products';

export function ProductActions({ productId, isActive, isFeatured }: Props) {
  const handleToggleActive = async () => {
    const result = await toggleProductStatus({ productId });
    // Manejar resultado
  };

  const handleToggleFeatured = async () => {
    const result = await toggleProductFeatured({ productId });
    // Manejar resultado
  };

  return (
    <div>
      <button onClick={handleToggleActive}>
        {isActive ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={handleToggleFeatured}>
        {isFeatured ? 'Quitar destacado' : 'Destacar'}
      </button>
    </div>
  );
}
```

### 5. Obtener Productos con Stock Bajo

```typescript
import { getLowStockProducts } from '@/actions/products';

export async function LowStockAlert() {
  const result = await getLowStockProducts();

  if (result.success && result.data.length > 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">
          ⚠️ Productos con stock bajo
        </h3>
        <ul>
          {result.data.map((product) => (
            <li key={product.id}>
              {product.name}: {product.stock} unidades
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
```

## Flujos Principales

### Flujo de Creación de Producto

1. Usuario accede a `/admin/products/new`
2. Completa el formulario ProductForm
3. Sube imágenes (se suben a Supabase Storage automáticamente)
4. Envía el formulario
5. `createProduct()` valida los datos
6. Verifica que el slug no exista
7. Crea el producto en la base de datos
8. Revalida cache
9. Redirige a la lista de productos

### Flujo de Gestión de Stock

1. Usuario accede al detalle del producto
2. Actualiza el stock manualmente o hace ajuste
3. `updateProductStock()` o `adjustProductStock()`
4. Se actualiza el stock en la base de datos
5. Si el stock llega al umbral, se marca como "stock bajo"
6. Revalida cache

### Flujo de Activación/Desactivación

1. Usuario hace clic en toggle de estado
2. `toggleProductStatus()` se ejecuta
3. Cambia el estado en la base de datos
4. Revalida todas las rutas relevantes:
   - `/admin/products`
   - `/products`
   - `/` (página principal)

## Estructura de Rutas Sugerida

```
app/(admin)/admin/products/
├── page.tsx                    # Lista de productos
├── new/
│   └── page.tsx               # Crear producto
├── [id]/
│   ├── page.tsx               # Ver/Editar producto
│   └── stock/
│       └── page.tsx           # Gestión de stock
```

## Características Implementadas

✅ CRUD completo de productos
✅ Gestión de imágenes con Supabase Storage
✅ Validación con Zod
✅ Gestión de stock e inventario
✅ Cambio de estado (activo/inactivo)
✅ Marcado como destacado
✅ SEO optimizado
✅ Actualización masiva
✅ Alertas de stock bajo
✅ Revalidación automática de cache
✅ Manejo de errores robusto
✅ Formulario con React Hook Form
✅ Toast notifications

## Próximos Pasos Sugeridos

1. **Variantes de Producto**
   - Crear sistema de variantes (talla, color, etc.)
   - Gestionar stock por variante

2. **Historial de Stock**
   - Tabla de logs de ajustes de inventario
   - Reportes de movimientos de stock

3. **Importación/Exportación**
   - Importar productos desde CSV/Excel
   - Exportar catálogo completo

4. **Duplicación de Productos**
   - Acción para duplicar un producto existente

5. **Productos Relacionados**
   - Gestionar productos relacionados manualmente

6. **Descuentos y Promociones**
   - Sistema de descuentos por producto
   - Precios especiales por fecha

7. **Análisis de Productos**
   - Productos más vendidos
   - Productos con mejor margen
   - Productos sin ventas

## Recomendaciones de Uso

### Buenas Prácticas

1. **Imágenes**
   - Usar imágenes optimizadas (WebP recomendado)
   - Resolución recomendada: 1200x1200px
   - Primera imagen siempre debe ser la más representativa

2. **SEO**
   - Completar siempre título y descripción SEO
   - Usar palabras clave relevantes en el slug

3. **Stock**
   - Mantener umbrales de stock actualizados
   - Revisar regularmente productos con stock bajo

4. **Categorización**
   - Asignar categorías apropiadas
   - Usar categorías consistentes

5. **Precios**
   - Siempre incluir precio de costo para análisis de margen
   - Usar precio de comparación solo cuando haya descuento real

### Seguridad

- Todas las actions validan datos con Zod
- Solo usuarios admin pueden acceder (implementar middleware)
- Las imágenes se suben a Storage con políticas RLS
- Revalidación automática previene datos desactualizados

## Troubleshooting

### Problema: Imágenes no se suben

**Solución**:
1. Verificar que el bucket `products` exista en Supabase
2. Revisar políticas de Storage
3. Verificar límites de tamaño (máx. 5MB)

### Problema: Error al crear producto

**Solución**:
1. Verificar que todos los campos obligatorios estén completados
2. Revisar que el slug no exista
3. Verificar conexión a Supabase
4. Revisar logs del servidor

### Problema: Stock no se actualiza

**Solución**:
1. Verificar que `track_inventory` esté activado
2. Revisar permisos de base de datos
3. Verificar que el producto exista

## Soporte y Documentación

Para más información, consulta:
- [GUIA_STORAGE.md](GUIA_STORAGE.md) - Guía de Supabase Storage
- [schemas/product.schema.ts](schemas/product.schema.ts) - Esquemas de validación
- [actions/products/](actions/products/) - Server Actions
