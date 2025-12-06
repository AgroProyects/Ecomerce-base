'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateProductSchema, type UpdateProductInput } from '@/schemas/product.schema'
import type { ApiResponse } from '@/types/api'
import type { Product, Json } from '@/types/database'

export async function updateProduct(
  input: UpdateProductInput
): Promise<ApiResponse<Product>> {
  try {
    // Validar input
    const validationResult = updateProductSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, metadata, ...rest } = validationResult.data
    const data = { ...rest, metadata: metadata as Json }

    const supabase = createAdminClient()

    // Verificar que el producto exista
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, slug')
      .eq('id', id)
      .single()

    if (!existingProduct) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    // Si se cambia el slug, verificar que no exista
    if (data.slug && data.slug !== existingProduct.slug) {
      const { data: productWithSlug } = await supabase
        .from('products')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single()

      if (productWithSlug) {
        return {
          success: false,
          error: 'Ya existe un producto con ese slug',
        }
      }
    }

    // Actualizar producto
    const { data: product, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return {
        success: false,
        error: 'Error al actualizar el producto',
      }
    }

    // Revalidar cache
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)
    revalidatePath('/products')
    revalidatePath(`/products/${product.slug}`)
    revalidatePath('/')

    return {
      success: true,
      data: product as Product,
      message: 'Producto actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function toggleProductStatus(
  id: string,
  isActive: boolean
): Promise<ApiResponse<Product>> {
  return updateProduct({ id, is_active: isActive })
}

export async function toggleProductFeatured(
  id: string,
  isFeatured: boolean
): Promise<ApiResponse<Product>> {
  return updateProduct({ id, is_featured: isFeatured })
}

export async function updateProductStock(
  id: string,
  stock: number
): Promise<ApiResponse<Product>> {
  return updateProduct({ id, stock })
}
