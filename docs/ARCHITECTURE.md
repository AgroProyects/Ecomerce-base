# 🏗️ Arquitectura del E-Commerce Flexible

## Visión General

Este documento describe la arquitectura de un sistema e-commerce **reutilizable, modular y escalable** diseñado para servir como base para múltiples tipos de tiendas online.

---

## 📐 Principios de Diseño

### 1. **Separación de Responsabilidades**
- **Presentación**: Componentes UI puros y reutilizables
- **Lógica de Negocio**: Server Actions y servicios
- **Datos**: Supabase con tipos fuertemente tipados
- **Estado**: React Query para cache + Zustand para estado global

### 2. **Modularidad**
- Cada feature es un módulo independiente
- Los módulos pueden activarse/desactivarse
- Configuración centralizada por tienda

### 3. **Type-Safety**
- TypeScript estricto en todo el proyecto
- Zod para validación runtime
- Tipos generados desde Supabase

### 4. **Escalabilidad**
- Preparado para multi-tenant
- Arquitectura stateless
- Cache estratégico con React Query

---

## 🗂️ Estructura de Carpetas

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   │
│   ├── (store)/                  # Tienda pública (cliente final)
│   │   ├── page.tsx              # Home de la tienda
│   │   ├── products/
│   │   │   ├── page.tsx          # Catálogo
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Detalle producto
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Productos por categoría
│   │   ├── cart/
│   │   │   └── page.tsx          # Carrito
│   │   ├── checkout/
│   │   │   ├── page.tsx          # Checkout
│   │   │   ├── success/
│   │   │   │   └── page.tsx      # Pago exitoso
│   │   │   └── failure/
│   │   │       └── page.tsx      # Pago fallido
│   │   └── layout.tsx            # Layout de tienda
│   │
│   ├── (admin)/                  # Panel administrativo
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── products/
│   │   │   ├── page.tsx          # Lista productos
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Crear producto
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Editar producto
│   │   ├── categories/
│   │   │   └── page.tsx          # Gestión categorías
│   │   ├── orders/
│   │   │   ├── page.tsx          # Lista órdenes
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle orden
│   │   ├── settings/
│   │   │   ├── page.tsx          # Config general
│   │   │   ├── appearance/
│   │   │   │   └── page.tsx      # Tema y colores
│   │   │   ├── payments/
│   │   │   │   └── page.tsx      # Config Mercado Pago
│   │   │   └── seo/
│   │   │       └── page.tsx      # Config SEO
│   │   ├── analytics/
│   │   │   └── page.tsx          # Estadísticas
│   │   └── layout.tsx            # Layout admin
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth handler
│   │   ├── webhooks/
│   │   │   └── mercadopago/
│   │   │       └── route.ts      # Webhook MP
│   │   ├── upload/
│   │   │   └── route.ts          # Upload imágenes
│   │   └── revalidate/
│   │       └── route.ts          # Revalidación cache
│   │
│   ├── layout.tsx                # Root layout
│   ├── globals.css
│   └── not-found.tsx
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes UI base (Button, Input, etc.)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── dropdown.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── spinner.tsx
│   │   └── index.ts
│   │
│   ├── layout/                   # Componentes de layout
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── nav-link.tsx
│   │   └── mobile-menu.tsx
│   │
│   ├── store/                    # Componentes de la tienda
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-gallery.tsx
│   │   ├── variant-selector.tsx
│   │   ├── add-to-cart-button.tsx
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   ├── category-nav.tsx
│   │   ├── search-bar.tsx
│   │   ├── price-display.tsx
│   │   ├── stock-badge.tsx
│   │   └── banner-carousel.tsx
│   │
│   ├── admin/                    # Componentes del admin
│   │   ├── stats-card.tsx
│   │   ├── orders-table.tsx
│   │   ├── product-form.tsx
│   │   ├── variant-form.tsx
│   │   ├── category-tree.tsx
│   │   ├── image-uploader.tsx
│   │   ├── rich-text-editor.tsx
│   │   ├── color-picker.tsx
│   │   ├── sales-chart.tsx
│   │   └── recent-orders.tsx
│   │
│   ├── forms/                    # Formularios reutilizables
│   │   ├── login-form.tsx
│   │   ├── checkout-form.tsx
│   │   └── contact-form.tsx
│   │
│   └── providers/                # Context providers
│       ├── query-provider.tsx    # React Query
│       ├── cart-provider.tsx     # Carrito
│       ├── theme-provider.tsx    # Tema
│       └── toast-provider.tsx    # Notificaciones
│
├── lib/                          # Lógica core
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server
│   │   ├── admin.ts              # Cliente admin (service role)
│   │   └── middleware.ts         # Middleware auth
│   │
│   ├── auth/
│   │   ├── config.ts             # Config NextAuth
│   │   ├── providers.ts          # Providers de auth
│   │   └── utils.ts              # Helpers de auth
│   │
│   ├── mercadopago/
│   │   ├── client.ts             # Cliente MP
│   │   ├── checkout.ts           # Crear preferencia
│   │   ├── webhooks.ts           # Procesar webhooks
│   │   └── types.ts              # Tipos MP
│   │
│   ├── utils/
│   │   ├── format.ts             # Formateo (moneda, fecha)
│   │   ├── slug.ts               # Generación slugs
│   │   ├── validation.ts         # Helpers validación
│   │   └── cn.ts                 # Classnames helper
│   │
│   └── constants/
│       ├── routes.ts             # Rutas de la app
│       ├── config.ts             # Configuración global
│       └── messages.ts           # Mensajes/textos
│
├── actions/                      # Server Actions
│   ├── products/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── delete.ts
│   │   └── queries.ts
│   │
│   ├── variants/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   │
│   ├── categories/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   │
│   ├── orders/
│   │   ├── create.ts
│   │   ├── update-status.ts
│   │   └── queries.ts
│   │
│   ├── cart/
│   │   ├── add-item.ts
│   │   ├── update-quantity.ts
│   │   ├── remove-item.ts
│   │   └── clear.ts
│   │
│   ├── checkout/
│   │   ├── create-preference.ts
│   │   └── process-payment.ts
│   │
│   ├── settings/
│   │   ├── update-store.ts
│   │   ├── update-theme.ts
│   │   └── update-seo.ts
│   │
│   └── upload/
│       ├── image.ts
│       └── delete-image.ts
│
├── hooks/                        # Custom React Hooks
│   ├── use-cart.ts               # Estado del carrito
│   ├── use-products.ts           # Query productos
│   ├── use-categories.ts         # Query categorías
│   ├── use-orders.ts             # Query órdenes
│   ├── use-store-settings.ts     # Query settings
│   ├── use-analytics.ts          # Query analytics
│   ├── use-upload.ts             # Hook upload
│   ├── use-debounce.ts           # Debounce
│   ├── use-local-storage.ts      # LocalStorage
│   └── use-media-query.ts        # Responsive
│
├── types/                        # TypeScript Types
│   ├── database.ts               # Tipos generados de Supabase
│   ├── product.ts                # Tipos de producto
│   ├── order.ts                  # Tipos de orden
│   ├── cart.ts                   # Tipos de carrito
│   ├── store.ts                  # Tipos de config tienda
│   └── api.ts                    # Tipos de API responses
│
├── schemas/                      # Zod Schemas
│   ├── product.schema.ts
│   ├── variant.schema.ts
│   ├── category.schema.ts
│   ├── order.schema.ts
│   ├── checkout.schema.ts
│   └── settings.schema.ts
│
├── services/                     # Servicios externos
│   ├── email/
│   │   ├── client.ts             # Cliente email (Resend/etc)
│   │   ├── templates/
│   │   │   ├── order-confirmation.tsx
│   │   │   ├── payment-success.tsx
│   │   │   └── shipping-update.tsx
│   │   └── send.ts
│   │
│   └── storage/
│       ├── upload.ts             # Upload a Supabase Storage
│       ├── delete.ts             # Eliminar archivos
│       └── optimize.ts           # Optimización imágenes
│
├── config/                       # Configuración
│   ├── site.ts                   # Metadata del sitio
│   ├── dashboard.ts              # Config del dashboard
│   └── navigation.ts             # Menús de navegación
│
├── middleware.ts                 # Next.js Middleware
│
├── supabase/                     # Supabase local
│   ├── migrations/               # Migraciones SQL
│   │   └── 001_initial_schema.sql
│   └── seed.sql                  # Datos de prueba
│
└── public/
    ├── images/
    │   ├── placeholder.png
    │   └── logo.svg
    └── icons/
```

---

## 🗄️ Modelo de Base de Datos

### Diagrama ER

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    categories   │     │     products     │     │ product_variants│
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ category_id (FK) │     │ id (PK)         │
│ name            │     │ id (PK)          │◄────┤ product_id (FK) │
│ slug            │     │ name             │     │ name            │
│ description     │     │ slug             │     │ sku             │
│ image_url       │     │ description      │     │ price_override  │
│ parent_id (FK)  │─┐   │ price            │     │ stock           │
│ is_active       │ │   │ compare_price    │     │ attributes      │
│ sort_order      │ │   │ images           │     │ is_active       │
│ created_at      │ │   │ is_active        │     │ created_at      │
│ updated_at      │ │   │ is_featured      │     │ updated_at      │
└─────────────────┘ │   │ metadata         │     └─────────────────┘
        ▲           │   │ seo_title        │
        └───────────┘   │ seo_description  │
                        │ created_at       │
                        │ updated_at       │
                        └──────────────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     orders      │     │   order_items    │     │ store_settings  │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ order_id (FK)    │     │ id (PK)         │
│ order_number    │     │ id (PK)          │     │ store_name      │
│ status          │     │ product_id (FK)  │     │ store_slug      │
│ customer_email  │     │ variant_id (FK)  │     │ description     │
│ customer_name   │     │ product_name     │     │ logo_url        │
│ customer_phone  │     │ variant_name     │     │ favicon_url     │
│ shipping_address│     │ quantity         │     │ primary_color   │
│ subtotal        │     │ unit_price       │     │ secondary_color │
│ shipping_cost   │     │ total_price      │     │ accent_color    │
│ total           │     │ created_at       │     │ social_links    │
│ notes           │     └──────────────────┘     │ contact_email   │
│ mp_payment_id   │                              │ contact_phone   │
│ mp_status       │     ┌──────────────────┐     │ address         │
│ mp_detail       │     │      users       │     │ currency        │
│ created_at      │     ├──────────────────┤     │ timezone        │
│ updated_at      │     │ id (PK)          │     │ homepage_config │
│ paid_at         │     │ email            │     │ seo_config      │
└─────────────────┘     │ name             │     │ created_at      │
                        │ role             │     │ updated_at      │
                        │ avatar_url       │     └─────────────────┘
                        │ is_active        │
                        │ created_at       │     ┌─────────────────┐
                        │ updated_at       │     │     banners     │
                        └──────────────────┘     ├─────────────────┤
                                                 │ id (PK)         │
                                                 │ title           │
                                                 │ subtitle        │
                                                 │ image_url       │
                                                 │ link_url        │
                                                 │ position        │
                                                 │ is_active       │
                                                 │ sort_order      │
                                                 │ created_at      │
                                                 └─────────────────┘
```

---

## 🔄 Flujos de Datos

### 1. Flujo de Compra (Checkout)

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌────────────┐
│ Carrito │───►│Checkout │───►│  MP API  │───►│  Redirect  │
│  Local  │    │  Form   │    │Preference│    │ to MP Page │
└─────────┘    └─────────┘    └──────────┘    └────────────┘
                                                     │
     ┌───────────────────────────────────────────────┘
     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ MP Page  │───►│ Webhook  │───►│ Update   │───►│  Email   │
│ Payment  │    │ Received │    │  Order   │    │  Sent    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │
                                     ▼
                              ┌──────────┐
                              │  Update  │
                              │  Stock   │
                              └──────────┘
```

### 2. Flujo de Server Actions vs API Routes

| Operación | Tipo | Razón |
|-----------|------|-------|
| CRUD Productos | Server Action | Mutación simple, revalidación automática |
| CRUD Categorías | Server Action | Mutación simple |
| CRUD Órdenes | Server Action | Mutación simple |
| Crear Preferencia MP | Server Action | Necesita datos del form |
| Webhook MP | API Route | Llamada externa, requiere respuesta HTTP |
| Upload imágenes | API Route | Streams, archivos grandes |
| Auth NextAuth | API Route | Requerido por NextAuth |

### 3. Estrategia de Cache (React Query)

```typescript
// Productos públicos - cache largo, prefetch
{ staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 }

// Dashboard - cache corto, background refetch
{ staleTime: 30 * 1000, refetchInterval: 60 * 1000 }

// Carrito - sin cache, siempre fresh
{ staleTime: 0, gcTime: 0 }

// Settings - cache muy largo
{ staleTime: 60 * 60 * 1000 }
```

---

## 🔐 Seguridad

### Capas de Seguridad

1. **Middleware**: Protege rutas admin, verifica sesión
2. **Server Actions**: Valida permisos antes de mutaciones
3. **RLS (Supabase)**: Última línea de defensa en BD
4. **Zod**: Validación de inputs en todas las acciones
5. **CSRF**: Protección automática con Server Actions

### Roles de Usuario

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',  // Acceso total
  ADMIN = 'admin',               // Gestión de tienda
  EDITOR = 'editor',             // Solo productos
  VIEWER = 'viewer'              // Solo lectura
}
```

---

## 📦 Componentes vs Server Components

### Server Components (Por defecto)
- Páginas de catálogo
- Detalle de producto
- Lista de categorías
- Dashboard (datos iniciales)
- Cualquier componente sin interactividad

### Client Components ("use client")
- Carrito (estado local)
- Formularios
- Selectores de variante
- Modales
- Dropdowns
- Toast notifications
- Cualquier cosa con useState, useEffect, handlers

---

## 🚀 Preparación Multi-Tenant

El sistema está preparado para escalar a multi-tenant con estos cambios:

### Opción A: Subdominio por Tienda
```
tienda1.midominio.com
tienda2.midominio.com
```
- Middleware detecta subdominio
- Inyecta `store_id` en contexto
- Queries filtran por `store_id`

### Opción B: Tabla de Tiendas
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT,
  owner_id UUID REFERENCES users(id),
  settings JSONB,
  plan TEXT,
  is_active BOOLEAN
);

-- Todas las tablas tendrán store_id
ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id);
```

### Opción C: Base de Datos por Tienda
- Cada tienda tiene su propia BD en Supabase
- Más aislamiento, más complejidad
- Útil para clientes enterprise

---

## 📊 Monitoreo y Analytics

### Métricas a Trackear

```typescript
interface StoreAnalytics {
  // Ventas
  totalRevenue: number;
  ordersCount: number;
  averageOrderValue: number;

  // Productos
  topSellingProducts: Product[];
  lowStockProducts: Product[];

  // Tráfico
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;

  // Por período
  dailyStats: DailyStat[];
  monthlyStats: MonthlyStat[];
}
```

---

## 🔧 Configuración por Entorno

```env
# .env.local (desarrollo)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# Opcional
RESEND_API_KEY=
UPLOADTHING_SECRET=
```

---

## 📝 Convenciones de Código

### Nombres de Archivos
- Componentes: `kebab-case.tsx` (ej: `product-card.tsx`)
- Hooks: `use-nombre.ts` (ej: `use-cart.ts`)
- Actions: `verbo.ts` (ej: `create.ts`, `update.ts`)
- Types: `nombre.ts` (ej: `product.ts`)

### Imports
```typescript
// 1. React/Next
import { useState } from 'react'
import Image from 'next/image'

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query'

// 3. Componentes locales
import { Button } from '@/components/ui/button'

// 4. Hooks/Utils
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

// 5. Types
import type { Product } from '@/types/product'
```

### Server Actions
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({...})

export async function createProduct(formData: FormData) {
  // 1. Validar auth
  // 2. Validar input con Zod
  // 3. Ejecutar operación
  // 4. Revalidar cache
  // 5. Retornar resultado
}
```
