'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createProductSchema, type CreateProductInput } from '@/schemas/product.schema'
import { slugify } from '@/lib/utils/slug'
import type { ApiResponse } from '@/types/api'
import type { Product, Json } from '@/types/database'
import { invalidateCache, CacheKey } from '@/lib/cache/redis'

export async function createProduct(
  input: CreateProductInput
): Promise<ApiResponse<Product>> {
  try {
    console.log('🚀 [CREATE PRODUCT] Input recibido:', input)
    console.log('🚀 [CREATE PRODUCT] category_id:', input.category_id, 'tipo:', typeof input.category_id)

    // Validar input
    const validationResult = createProductSchema.safeParse(input)

    if (!validationResult.success) {
      console.error('❌ [CREATE PRODUCT] Validación fallida:', validationResult.error.issues)
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    console.log('✅ [CREATE PRODUCT] Validación exitosa')
    const data = validationResult.data
    console.log('📦 [CREATE PRODUCT] Data validada:', data)
    console.log('📦 [CREATE PRODUCT] category_id validado:', data.category_id)

    // Generar slug si no se proporciona
    const slug = data.slug || slugify(data.name)

    const supabase = createAdminClient()

    // Verificar que el slug no exista
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingProduct) {
      return {
        success: false,
        error: 'Ya existe un producto con ese slug',
      }
    }

    // Crear producto
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        compare_price: data.compare_price,
        cost_price: data.cost_price,
        images: data.images,
        category_id: data.category_id,
        is_active: data.is_active,
        is_featured: data.is_featured,
        track_inventory: data.track_inventory,
        stock: data.stock,
        low_stock_threshold: data.low_stock_threshold,
        metadata: data.metadata as Json,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return {
        success: false,
        error: 'Error al crear el producto',
      }
    }

    // Invalidar cache de productos
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    // Revalidar cache de Next.js
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      success: true,
      data: product as Product,
      message: 'Producto creado exitosamente',
    }
  } catch (error) {
    console.error('Error in createProduct:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
