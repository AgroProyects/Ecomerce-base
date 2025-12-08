# Guía del Sistema de Variantes de Producto

Sistema completo para gestionar variantes de productos (tallas, colores, etc.) con stock independiente por variante.

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Base de Datos](#base-de-datos)
- [Server Actions](#server-actions)
- [Componentes de Admin](#componentes-de-admin)
- [Uso del Sistema](#uso-del-sistema)
- [Ejemplos de Código](#ejemplos-de-código)

---

## Arquitectura

El sistema de variantes permite crear múltiples versiones de un producto, cada una con:
- **Atributos únicos** (ej: Talla M, Color Rojo)
- **Stock independiente**
- **Precio opcional** (override del precio base)
- **SKU único**
- **Estado activo/inactivo**

### Estructura de Datos

```typescript
interface ProductVariant {
  id: string;
  product_id: string;
  name: string;                    // ej: "Talla M / Rojo"
  sku: string | null;              // ej: "PROD-M-RED"
  price_override: number | null;   // Precio específico (opcional)
  stock: number;                   // Stock de esta variante
  attributes: Array<{              // Atributos estructurados
    name: string;                  // ej: "Talla"
    value: string;                 // ej: "M"
  }>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

---

## Base de Datos

### Tabla: `product_variants`

```sql
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text null unique,
  price_override numeric(10, 2) null check (price_override >= 0),
  stock integer not null default 0 check (stock >= 0),
  attributes jsonb null default '[]'::jsonb,
  is_active boolean null default true,
  sort_order integer null default 0,
  created_at timestamptz null default now(),
  updated_at timestamptz null default now()
);

-- Índices
create index idx_variants_product on product_variants(product_id);
create index idx_variants_sku on product_variants(sku);
create index idx_variants_active on product_variants(is_active);
```

### Políticas RLS (Row Level Security)

```sql
-- Política para lectura pública (solo activas)
create policy "Public read active variants"
on product_variants for select
using (is_active = true);

-- Política para admin (CRUD completo)
create policy "Admin full access"
on product_variants for all
using (auth.role() = 'authenticated');
```

---

## Server Actions

### Ubicación

Todas las actions están en [`actions/variants/`](actions/variants/)

### Queries ([`queries.ts`](actions/variants/queries.ts))

```typescript
// Obtener todas las variantes (admin - incluye inactivas)
getAllProductVariants(productId: string): Promise<ApiResponse<ProductVariant[]>>

// Obtener variante por ID
getVariantById(id: string): Promise<ApiResponse<ProductVariant | null>>

// Obtener solo variantes activas
getActiveProductVariants(productId: string): Promise<ApiResponse<ProductVariant[]>>

// Obtener variantes con stock disponible
getVariantsInStock(productId: string): Promise<ApiResponse<ProductVariant[]>>

// Obtener variante por SKU
getVariantBySku(sku: string): Promise<ApiResponse<ProductVariant | null>>
```

### Mutations ([`mutations.ts`](actions/variants/mutations.ts))

```typescript
// Crear variante
createVariant(input: CreateVariantInput): Promise<ApiResponse<ProductVariant>>

// Actualizar variante
updateVariant(input: UpdateVariantInput): Promise<ApiResponse<ProductVariant>>

// Eliminar variante
deleteVariant(id: string): Promise<ApiResponse<void>>

// Crear múltiples variantes
bulkCreateVariants(input: BulkCreateVariantsInput): Promise<ApiResponse<ProductVariant[]>>
```

### Stock Management ([`stock.ts`](actions/variants/stock.ts))

```typescript
// Actualizar stock directamente
updateVariantStock(input: { id: string; stock: number }): Promise<ApiResponse<ProductVariant>>

// Ajustar stock (incrementar/decrementar)
adjustVariantStock(input: { id: string; adjustment: number; reason?: string }): Promise<ApiResponse<ProductVariant>>

// Obtener variantes con stock bajo
getLowStockVariants(productId?: string): Promise<ApiResponse<ProductVariant[]>>

// Obtener variantes sin stock
getOutOfStockVariants(productId?: string): Promise<ApiResponse<ProductVariant[]>>

// Actualización masiva de stock
bulkUpdateVariantStock(updates: Array<{ id: string; stock: number }>): Promise<ApiResponse<void>>
```

### Generación Automática ([`generate.ts`](actions/variants/generate.ts))

```typescript
// Generar variantes automáticamente desde atributos
generateVariants(input: GenerateVariantsInput): Promise<ApiResponse<ProductVariant[]>>

// Vista previa de variantes a generar
previewGeneratedVariants(input: GenerateVariantsInput): Promise<ApiResponse<VariantPreview[]>>
```

---

## Componentes de Admin

### ProductVariantManager

**Ubicación:** [`components/admin/ProductVariantManager.tsx`](components/admin/ProductVariantManager.tsx)

Componente principal para gestionar variantes en el panel de administración.

**Características:**
- ✅ Crear, editar y eliminar variantes
- ✅ Actualización rápida de stock
- ✅ Gestión de atributos
- ✅ Vista en tabla con filtros
- ✅ Indicadores de estado y stock

**Uso:**

```tsx
import { ProductVariantManager } from '@/components/admin/ProductVariantManager';
import { getAllProductVariants } from '@/actions/variants';

export default async function ProductPage({ productId }: Props) {
  const variantsResult = await getAllProductVariants(productId);
  const variants = variantsResult.success ? variantsResult.data : [];

  return (
    <ProductVariantManager
      productId={productId}
      variants={variants}
      onUpdate={() => router.refresh()}
    />
  );
}
```

### VariantGenerator

**Ubicación:** [`components/admin/VariantGenerator.tsx`](components/admin/VariantGenerator.tsx)

Componente para generar variantes automáticamente desde combinaciones de atributos.

**Características:**
- ✅ Generación automática de todas las combinaciones
- ✅ Vista previa antes de crear
- ✅ Configuración de precio y stock base
- ✅ Generación de SKUs automáticos
- ✅ Cálculo de cantidad de variantes

**Uso:**

```tsx
import { VariantGenerator } from '@/components/admin/VariantGenerator';

<VariantGenerator
  productId={productId}
  onGenerated={() => loadVariants()}
/>
```

**Ejemplo de uso:**
1. Definir atributos:
   - **Talla:** S, M, L, XL
   - **Color:** Rojo, Azul, Negro
2. Resultado: 12 variantes generadas automáticamente (4 tallas × 3 colores)

---

## Uso del Sistema

### 1. Crear Variantes Manualmente

```typescript
'use server';

import { createVariant } from '@/actions/variants';

export async function createProductVariant() {
  const result = await createVariant({
    product_id: 'product-uuid',
    name: 'Talla M - Rojo',
    sku: 'PROD-M-RED',
    price_override: 29.99, // Opcional
    stock: 100,
    attributes: [
      { name: 'Talla', value: 'M' },
      { name: 'Color', value: 'Rojo' },
    ],
    is_active: true,
    sort_order: 0,
  });

  if (result.success) {
    console.log('Variante creada:', result.data);
  }
}
```

### 2. Generar Variantes Automáticamente

```typescript
import { generateVariants } from '@/actions/variants';

const result = await generateVariants({
  product_id: 'product-uuid',
  attributes: [
    {
      name: 'Talla',
      values: ['S', 'M', 'L', 'XL'],
    },
    {
      name: 'Color',
      values: ['Rojo', 'Azul', 'Negro'],
    },
  ],
  base_price: null,  // Usa el precio del producto
  base_stock: 50,    // 50 unidades por variante
});

// Genera 12 variantes (4 tallas × 3 colores)
```

### 3. Actualizar Stock de Variante

```typescript
'use client';

import { updateVariantStock } from '@/actions/variants';

async function handleStockUpdate(variantId: string, newStock: number) {
  const result = await updateVariantStock({
    id: variantId,
    stock: newStock,
  });

  if (result.success) {
    toast.success('Stock actualizado');
  }
}
```

### 4. Obtener Variantes Disponibles (Frontend)

```typescript
import { getProductVariants } from '@/actions/products'; // Función pública

export async function ProductPage({ slug }: Props) {
  const product = await getProductBySlug(slug);
  const variants = await getProductVariants(product.id); // Solo activas

  return (
    <div>
      <h1>{product.name}</h1>

      {/* Selector de variantes */}
      <VariantSelector variants={variants} />
    </div>
  );
}
```

---

## Ejemplos de Código

### Componente Selector de Variantes (Frontend)

```tsx
'use client';

import { useState } from 'react';
import type { ProductVariant } from '@/types/database';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Agrupar variantes por atributos
  const attributeGroups = groupVariantsByAttributes(variants);

  const handleSelect = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      setSelected(variantId);
      onSelect(variant);
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(attributeGroups).map(([attributeName, values]) => (
        <div key={attributeName}>
          <label className="font-medium">{attributeName}</label>
          <div className="flex gap-2 mt-2">
            {values.map((value) => (
              <button
                key={value}
                onClick={() => handleSelect(findVariantByAttribute(variants, attributeName, value)!.id)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helpers
function groupVariantsByAttributes(variants: ProductVariant[]) {
  const groups: Record<string, Set<string>> = {};

  variants.forEach(variant => {
    variant.attributes.forEach(attr => {
      if (!groups[attr.name]) {
        groups[attr.name] = new Set();
      }
      groups[attr.name].add(attr.value);
    });
  });

  return Object.fromEntries(
    Object.entries(groups).map(([name, set]) => [name, Array.from(set)])
  );
}

function findVariantByAttribute(
  variants: ProductVariant[],
  attributeName: string,
  attributeValue: string
) {
  return variants.find(v =>
    v.attributes.some(a => a.name === attributeName && a.value === attributeValue)
  );
}
```

### Agregar al Carrito con Variante

```typescript
'use client';

import { addToCart } from '@/actions/cart';

async function handleAddToCart(productId: string, variantId: string, quantity: number) {
  const result = await addToCart({
    product_id: productId,
    variant_id: variantId,  // ← Especificar variante
    quantity,
  });

  if (result.success) {
    toast.success('Agregado al carrito');
  } else {
    toast.error(result.error);
  }
}
```

### Verificar Stock de Variante

```typescript
import { getVariantById } from '@/actions/variants';

export async function checkVariantStock(variantId: string, requestedQty: number) {
  const result = await getVariantById(variantId);

  if (!result.success || !result.data) {
    return { available: false, error: 'Variante no encontrada' };
  }

  const variant = result.data;

  if (!variant.is_active) {
    return { available: false, error: 'Variante no disponible' };
  }

  if (variant.stock < requestedQty) {
    return {
      available: false,
      error: `Solo quedan ${variant.stock} unidades disponibles`,
    };
  }

  return { available: true };
}
```

---

## Flujos Principales

### Flujo de Creación de Producto con Variantes

1. **Crear producto base** → Guardar producto
2. **Acceder a edición** → Ir a `/admin/products/{id}`
3. **Generar variantes**:
   - Opción A: Manual (una por una)
   - Opción B: Automática (desde atributos)
4. **Ajustar stock** de cada variante
5. **Activar/desactivar** variantes según disponibilidad

### Flujo de Compra con Variantes

1. Usuario ve producto
2. Selecciona variante (talla, color, etc.)
3. Sistema verifica stock de la variante
4. Agrega al carrito con `variant_id`
5. Al checkout, se descuenta stock de la variante específica

---

## Características Implementadas

✅ CRUD completo de variantes
✅ Generación automática desde atributos
✅ Gestión de stock independiente
✅ Actualización masiva de stock
✅ Vista previa de generación
✅ SKUs automáticos
✅ Precios override opcionales
✅ Filtros y búsqueda
✅ Indicadores de stock bajo
✅ Revalidación automática de cache

---

## Funcionalidades Frontend Implementadas

### 1. Selector de Variantes ([`components/product/VariantSelector.tsx`](components/product/VariantSelector.tsx))

Componente inteligente para seleccionar variantes en la página del producto:

**Características:**
- ✅ Agrupación automática por atributos
- ✅ Validación de disponibilidad en tiempo real
- ✅ Deshabilitación de combinaciones sin stock
- ✅ Indicadores visuales de selección
- ✅ Información de stock disponible
- ✅ Soporte para precios override

**Uso:**
```tsx
import { VariantSelector } from '@/components/product/VariantSelector';

<VariantSelector
  variants={variants}
  onVariantChange={(variant) => setSelectedVariant(variant)}
/>
```

### 2. Detalles de Producto con Variantes ([`components/product/ProductDetailsWithVariants.tsx`](components/product/ProductDetailsWithVariants.tsx))

Componente completo para mostrar producto con variantes:

**Características:**
- ✅ Galería de imágenes con miniaturas
- ✅ Selector de variantes integrado
- ✅ Cambio automático de imagen por variante
- ✅ Control de cantidad con validación
- ✅ Precio dinámico según variante
- ✅ Integración con carrito
- ✅ Estados de disponibilidad

### 3. Sistema de Carrito con Variantes ([`lib/cart/index.ts`](lib/cart/index.ts))

Store de Zustand con soporte completo para variantes:

**Características:**
- ✅ Gestión independiente por variante
- ✅ Validación de stock máximo
- ✅ Persistencia en localStorage
- ✅ Cálculos de totales
- ✅ Interfaz TypeScript completa

**Estructura del Cart Item:**
```typescript
{
  product_id: string;
  variant_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  variant_name?: string | null;  // ej: "M / Rojo"
  max_stock: number;
}
```

### 4. Imágenes por Variante

**Características:**
- ✅ Campo `image_url` en el schema de variantes
- ✅ Soporte en formularios de admin
- ✅ Cambio automático de imagen al seleccionar variante
- ✅ Fallback a imágenes del producto si la variante no tiene imagen

### 5. Importación/Exportación CSV ([`components/admin/VariantImportExport.tsx`](components/admin/VariantImportExport.tsx))

Sistema completo de importación y exportación:

**Características:**
- ✅ Exportar todas las variantes a CSV
- ✅ Descargar plantilla de ejemplo
- ✅ Importar variantes desde CSV
- ✅ Vista previa antes de importar
- ✅ Validación de formato
- ✅ Soporte para atributos JSON
- ✅ Manejo de errores

**Formato del CSV:**
```csv
name,sku,price_override,stock,attributes,image_url,is_active,sort_order
Talla M / Rojo,PROD-M-RED,29.99,100,"[{""name"":""Talla"",""value"":""M""},{""name"":""Color"",""value"":""Rojo""}]",https://...,true,0
```

## Próximas Mejoras Sugeridas

1. **Historial de Stock**
   - Registro de cambios de stock
   - Auditoría de ajustes

2. **Descuentos por Variante**
   - Precios promocionales específicos
   - Descuentos temporales

3. **Notificaciones**
   - Alerta cuando variante llegue a stock bajo
   - Notificar cuando variante esté disponible nuevamente

4. **Búsqueda y Filtros**
   - Filtrar productos por atributos de variantes
   - Búsqueda avanzada en admin

---

## Troubleshooting

### Problema: Variantes no aparecen en el frontend

**Solución:**
- Verificar que `is_active = true`
- Verificar que el producto padre esté activo
- Revisar políticas RLS de Supabase

### Problema: Stock no se actualiza

**Solución:**
- Verificar permisos de actualización
- Revisar que el ID de variante sea correcto
- Comprobar que `stock >= 0`

### Problema: Generación masiva falla

**Solución:**
- Verificar que cada atributo tenga al menos un valor
- Revisar que el `product_id` exista
- Verificar límites de la base de datos

---

## Soporte y Documentación

Para más información, consulta:
- [ADMIN_PRODUCTOS_GUIA.md](ADMIN_PRODUCTOS_GUIA.md) - Guía de productos
- [schemas/variant.schema.ts](schemas/variant.schema.ts) - Esquemas de validación
- [actions/variants/](actions/variants/) - Server Actions
