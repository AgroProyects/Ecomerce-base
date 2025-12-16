'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiResponse } from '@/types/api'
import { invalidateCache, CacheKey } from '@/lib/cache/redis'

export async function deleteProduct(id: string): Promise<ApiResponse<void>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de producto requerido',
      }
    }

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

    // Eliminar producto (las variantes se eliminan en cascada)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return {
        success: false,
        error: 'Error al eliminar el producto',
      }
    }

    // Invalidar cache de productos
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    // Revalidar cache
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    }
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function deleteProducts(ids: string[]): Promise<ApiResponse<void>> {
  try {
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: 'IDs de productos requeridos',
      }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error deleting products:', error)
      return {
        success: false,
        error: 'Error al eliminar los productos',
      }
    }

    // Invalidar cache de productos
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    // Revalidar cache
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      success: true,
      message: `${ids.length} productos eliminados exitosamente`,
    }
  } catch (error) {
    console.error('Error in deleteProducts:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
