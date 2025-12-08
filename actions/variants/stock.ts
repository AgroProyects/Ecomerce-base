'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  updateVariantStockSchema,
  adjustVariantStockSchema,
  type UpdateVariantStockInput,
  type AdjustVariantStockInput,
} from '@/schemas/variant.schema';
import type { ApiResponse } from '@/types/api';
import type { ProductVariant } from '@/types/database';

// Actualizar stock de variante directamente
export async function updateVariantStock(
  input: UpdateVariantStockInput
): Promise<ApiResponse<ProductVariant>> {
  try {
    const validationResult = updateVariantStockSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { id, stock } = validationResult.data;

    const supabase = createAdminClient();

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update({
        stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating variant stock:', error);
      return {
        success: false,
        error: 'Error al actualizar el stock de la variante',
      };
    }

    if (!variant) {
      return {
        success: false,
        error: 'Variante no encontrada',
      };
    }

    revalidatePath(`/admin/products/${variant.product_id}`);

    return {
      success: true,
      data: variant as ProductVariant,
      message: 'Stock actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error in updateVariantStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

// Ajustar stock de variante (incrementar o decrementar)
export async function adjustVariantStock(
  input: AdjustVariantStockInput
): Promise<ApiResponse<ProductVariant>> {
  try {
    const validationResult = adjustVariantStockSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { id, adjustment, reason } = validationResult.data;

    const supabase = createAdminClient();

    // Obtener el stock actual
    const { data: currentVariant, error: fetchError } = await supabase
      .from('product_variants')
      .select('stock, product_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentVariant) {
      return {
        success: false,
        error: 'Variante no encontrada',
      };
    }

    const newStock = (currentVariant.stock || 0) + adjustment;

    if (newStock < 0) {
      return {
        success: false,
        error: 'El stock no puede ser negativo',
      };
    }

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error adjusting variant stock:', error);
      return {
        success: false,
        error: 'Error al ajustar el stock de la variante',
      };
    }

    revalidatePath(`/admin/products/${currentVariant.product_id}`);

    const message = adjustment > 0
      ? `Stock incrementado en ${adjustment} unidades`
      : `Stock decrementado en ${Math.abs(adjustment)} unidades`;

    return {
      success: true,
      data: variant as ProductVariant,
      message: reason ? `${message}. Razón: ${reason}` : message,
    };
  } catch (error) {
    console.error('Error in adjustVariantStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

// Obtener variantes con stock bajo
export async function getLowStockVariants(
  productId?: string
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('product_variants')
      .select('*')
      .eq('is_active', true)
      .or('stock.eq.0,stock.lte.5');

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.order('stock', { ascending: true });

    if (error) {
      console.error('Error fetching low stock variants:', error);
      return {
        success: false,
        error: 'Error al obtener variantes con stock bajo',
        data: [],
      };
    }

    return {
      success: true,
      data: (data as ProductVariant[]) || [],
    };
  } catch (error) {
    console.error('Error in getLowStockVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Obtener variantes sin stock
export async function getOutOfStockVariants(
  productId?: string
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('product_variants')
      .select('*')
      .eq('is_active', true)
      .eq('stock', 0);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching out of stock variants:', error);
      return {
        success: false,
        error: 'Error al obtener variantes sin stock',
        data: [],
      };
    }

    return {
      success: true,
      data: (data as ProductVariant[]) || [],
    };
  } catch (error) {
    console.error('Error in getOutOfStockVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Actualizar stock masivamente
export async function bulkUpdateVariantStock(
  updates: Array<{ id: string; stock: number }>
): Promise<ApiResponse<void>> {
  try {
    const supabase = createAdminClient();

    // Validar que todos los IDs sean válidos
    if (!updates || updates.length === 0) {
      return {
        success: false,
        error: 'No se proporcionaron actualizaciones',
      };
    }

    // Actualizar cada variante
    const updatePromises = updates.map(({ id, stock }) =>
      supabase
        .from('product_variants')
        .update({
          stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);

    const hasErrors = results.some((result) => result.error);

    if (hasErrors) {
      return {
        success: false,
        error: 'Error al actualizar algunas variantes',
      };
    }

    // Revalidar rutas
    revalidatePath('/admin/products');

    return {
      success: true,
      message: `${updates.length} variantes actualizadas exitosamente`,
    };
  } catch (error) {
    console.error('Error in bulkUpdateVariantStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}
