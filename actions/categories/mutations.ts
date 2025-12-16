'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/schemas/category.schema'
import { invalidateCache, CacheKey } from '@/lib/cache/redis'
import { slugify } from '@/lib/utils/slug'
import type { ApiResponse } from '@/types/api'
import type { Category } from '@/types/database'

export async function createCategory(
  input: CreateCategoryInput
): Promise<ApiResponse<Category>> {
  try {
    const validationResult = createCategorySchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data
    const slug = data.slug || slugify(data.name)

    const supabase = createAdminClient()

    // Verificar que el slug no exista
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCategory) {
      return {
        success: false,
        error: 'Ya existe una categoría con ese slug',
      }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        image_url: data.image_url,
        parent_id: data.parent_id,
        is_active: data.is_active,
        sort_order: data.sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return {
        success: false,
        error: 'Error al crear la categoría',
      }
    }

    // Invalidar cache de categorías y productos (las categorías afectan productos)
    await invalidateCache(`${CacheKey.CATEGORIES}:*`)
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    // Invalidar cache de categorías y productos
    await invalidateCache(`${CacheKey.CATEGORIES}:*`)
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    revalidatePath('/admin/categories')
    revalidatePath('/category')
    revalidatePath('/')

    return {
      success: true,
      data: category as Category,
      message: 'Categoría creada exitosamente',
    }
  } catch (error) {
    console.error('Error in createCategory:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ApiResponse<Category>> {
  try {
    const validationResult = updateCategorySchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, ...data } = validationResult.data

    const supabase = createAdminClient()

    // Verificar que la categoría exista
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('id', id)
      .single()

    if (!existingCategory) {
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // Si se cambia el slug, verificar que no exista
    if (data.slug && data.slug !== existingCategory.slug) {
      const { data: categoryWithSlug } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single()

      if (categoryWithSlug) {
        return {
          success: false,
          error: 'Ya existe una categoría con ese slug',
        }
      }
    }

    // Evitar ciclos en parent_id
    if (data.parent_id === id) {
      return {
        success: false,
        error: 'Una categoría no puede ser su propia padre',
      }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return {
        success: false,
        error: 'Error al actualizar la categoría',
      }
    }

    // Invalidar cache de categorías y productos
    await invalidateCache(`${CacheKey.CATEGORIES}:*`)
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    revalidatePath('/admin/categories')
    revalidatePath('/category')
    revalidatePath('/')

    return {
      success: true,
      data: category as Category,
      message: 'Categoría actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error in updateCategory:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse<void>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de categoría requerido',
      }
    }

    const supabase = createAdminClient()

    // Verificar que la categoría exista
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingCategory) {
      return {
        success: false,
        error: 'Categoría no encontrada',
      }
    }

    // Verificar que no tenga productos asociados
    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (productsCount && productsCount > 0) {
      return {
        success: false,
        error: `La categoría tiene ${productsCount} productos asociados. Elimine o reasigne los productos primero.`,
      }
    }

    // Las subcategorías tendrán parent_id = NULL después de eliminar
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return {
        success: false,
        error: 'Error al eliminar la categoría',
      }
    }

    // Invalidar cache de categorías y productos
    await invalidateCache(`${CacheKey.CATEGORIES}:*`)
    await invalidateCache(`${CacheKey.PRODUCTS}:*`)

    revalidatePath('/admin/categories')
    revalidatePath('/category')
    revalidatePath('/')

    return {
      success: true,
      message: 'Categoría eliminada exitosamente',
    }
  } catch (error) {
    console.error('Error in deleteCategory:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
