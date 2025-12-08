import { z } from 'zod';

// Esquema base para productos
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),

  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(200, 'El slug no puede exceder 200 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),

  description: z
    .string()
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional()
    .nullable(),

  price: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(999999.99, 'El precio es demasiado alto'),

  compare_price: z
    .number()
    .min(0, 'El precio de comparación no puede ser negativo')
    .max(999999.99, 'El precio es demasiado alto')
    .optional()
    .nullable(),

  cost_price: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .max(999999.99, 'El costo es demasiado alto')
    .optional()
    .nullable(),

  images: z
    .array(z.string().url('URL de imagen inválida'))
    .min(1, 'Debes agregar al menos una imagen')
    .max(10, 'Máximo 10 imágenes permitidas'),

  category_id: z
    .string()
    .uuid('ID de categoría inválido')
    .optional()
    .nullable(),

  is_active: z.boolean().default(true),

  is_featured: z.boolean().default(false),

  track_inventory: z.boolean().default(true),

  stock: z
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .default(0),

  low_stock_threshold: z
    .number()
    .int('El umbral debe ser un número entero')
    .min(0, 'El umbral no puede ser negativo')
    .default(10),

  seo_title: z
    .string()
    .max(60, 'El título SEO no puede exceder 60 caracteres')
    .optional()
    .nullable(),

  seo_description: z
    .string()
    .max(160, 'La descripción SEO no puede exceder 160 caracteres')
    .optional()
    .nullable(),

  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Esquema para crear producto
export const createProductSchema = productSchema;

// Esquema para actualizar producto (todos los campos opcionales)
export const updateProductSchema = productSchema.partial();

// Esquema para actualizar solo el stock
export const updateStockSchema = z.object({
  stock: z.number().int().min(0),
  track_inventory: z.boolean().optional(),
});

// Esquema para actualizar solo el estado
export const updateStatusSchema = z.object({
  is_active: z.boolean(),
});

// Esquema para filtros de productos
export const productFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'created_at', 'stock']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  lowStock: z.boolean().optional(),
});

// Tipos TypeScript derivados de los esquemas
export type ProductFormData = z.infer<typeof productSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type UpdateStockData = z.infer<typeof updateStockSchema>;
export type UpdateStatusData = z.infer<typeof updateStatusSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;

// Validación personalizada para compare_price
export const validateComparePriceAgainstPrice = (data: { price: number; compare_price?: number | null }) => {
  if (data.compare_price && data.compare_price <= data.price) {
    return false;
  }
  return true;
};

// Validación de imágenes
export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  position: z.number().int().min(0).default(0),
});

export type ImageData = z.infer<typeof imageSchema>;
