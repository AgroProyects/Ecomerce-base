'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createVariantSchema,
  updateVariantSchema,
  bulkCreateVariantsSchema,
  type CreateVariantInput,
  type UpdateVariantInput,
  type BulkCreateVariantsInput,
} from '@/schemas/variant.schema'
import type { ApiResponse } from '@/types/api'
import type { ProductVariant } from '@/types/database'

export async function createVariant(
  input: CreateVariantInput
): Promise<ApiResponse<ProductVariant>> {
  try {
    const validationResult = createVariantSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data

    const supabase = createAdminClient()

    // Verificar que el producto exista
    const { data: product } = await supabase
      .from('products')
      .select('id, slug')
      .eq('id', data.product_id)
      .single()

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: data.product_id,
        name: data.name,
        sku: data.sku,
        price_override: data.price_override,
        stock: data.stock,
        attributes: data.attributes,
        is_active: data.is_active,
        sort_order: data.sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating variant:', error)
      return {
        success: false,
        error: 'Error al crear la variante',
      }
    }

    revalidatePath(`/admin/products/${data.product_id}`)
    revalidatePath(`/products/${product.slug}`)

    return {
      success: true,
      data: variant as ProductVariant,
      message: 'Variante creada exitosamente',
    }
  } catch (error) {
    console.error('Error in createVariant:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function updateVariant(
  input: UpdateVariantInput
): Promise<ApiResponse<ProductVariant>> {
  try {
    const validationResult = updateVariantSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, ...data } = validationResult.data

    const supabase = createAdminClient()

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(data)
      .eq('id', id)
      .select('*, products(slug)')
      .single()

    if (error) {
      console.error('Error updating variant:', error)
      return {
        success: false,
        error: 'Error al actualizar la variante',
      }
    }

    revalidatePath(`/admin/products/${variant.product_id}`)

    return {
      success: true,
      data: variant as ProductVariant,
      message: 'Variante actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error in updateVariant:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function deleteVariant(id: string): Promise<ApiResponse<void>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de variante requerido',
      }
    }

    const supabase = createAdminClient()

    // Obtener info de la variante antes de eliminar
    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('id', id)
      .single()

    if (!variant) {
      return {
        success: false,
        error: 'Variante no encontrada',
      }
    }

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting variant:', error)
      return {
        success: false,
        error: 'Error al eliminar la variante',
      }
    }

    revalidatePath(`/admin/products/${variant.product_id}`)

    return {
      success: true,
      message: 'Variante eliminada exitosamente',
    }
  } catch (error) {
    console.error('Error in deleteVariant:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function bulkCreateVariants(
  input: BulkCreateVariantsInput
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    const validationResult = bulkCreateVariantsSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { product_id, variants } = validationResult.data

    const supabase = createAdminClient()

    // Verificar que el producto exista
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single()

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const variantsToInsert = variants.map((v, index) => ({
      product_id,
      name: v.name,
      sku: v.sku,
      price_override: v.price_override,
      stock: v.stock,
      attributes: v.attributes,
      is_active: v.is_active ?? true,
      sort_order: v.sort_order ?? index,
    }))

    const { data: createdVariants, error } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select()

    if (error) {
      console.error('Error creating variants:', error)
      return {
        success: false,
        error: 'Error al crear las variantes',
      }
    }

    revalidatePath(`/admin/products/${product_id}`)

    return {
      success: true,
      data: createdVariants as ProductVariant[],
      message: `${createdVariants.length} variantes creadas exitosamente`,
    }
  } catch (error) {
    console.error('Error in bulkCreateVariants:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
