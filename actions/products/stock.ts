'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse } from '@/types/api';
import { z } from 'zod';

// Esquema para actualizar stock
const updateStockSchema = z.object({
  productId: z.string().uuid(),
  stock: z.number().int().min(0),
  track_inventory: z.boolean().optional(),
});

// Esquema para ajuste de stock
const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  adjustment: z.number().int(),
  reason: z.string().optional(),
});

export async function updateProductStock(
  input: z.infer<typeof updateStockSchema>
): Promise<ApiResponse<{ stock: number }>> {
  try {
    const validationResult = updateStockSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { productId, stock, track_inventory } = validationResult.data;
    const supabase = createAdminClient();

    const updateData: any = { stock, updated_at: new Date().toISOString() };
    if (track_inventory !== undefined) {
      updateData.track_inventory = track_inventory;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('stock')
      .single();

    if (error) {
      console.error('Error updating stock:', error);
      return {
        success: false,
        error: 'Error al actualizar el stock',
      };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: { stock: data.stock },
      message: 'Stock actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error in updateProductStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export async function adjustProductStock(
  input: z.infer<typeof adjustStockSchema>
): Promise<ApiResponse<{ stock: number }>> {
  try {
    const validationResult = adjustStockSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { productId, adjustment, reason } = validationResult.data;
    const supabase = createAdminClient();

    // Obtener stock actual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, track_inventory')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      };
    }

    if (!product.track_inventory) {
      return {
        success: false,
        error: 'Este producto no tiene seguimiento de inventario activado',
      };
    }

    const newStock = Math.max(0, product.stock + adjustment);

    // Actualizar stock
    const { data, error } = await supabase
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('stock')
      .single();

    if (error) {
      console.error('Error adjusting stock:', error);
      return {
        success: false,
        error: 'Error al ajustar el stock',
      };
    }

    // TODO: Registrar el ajuste en un log de inventario si existe esa tabla

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: { stock: data.stock },
      message: `Stock ajustado: ${adjustment > 0 ? '+' : ''}${adjustment} unidades. Nuevo stock: ${data.stock}`,
    };
  } catch (error) {
    console.error('Error in adjustProductStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export async function getLowStockProducts(): Promise<
  ApiResponse<Array<{ id: string; name: string; stock: number; low_stock_threshold: number }>>
> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, low_stock_threshold')
      .eq('track_inventory', true)
      .eq('is_active', true)
      .filter('stock', 'lte', 'low_stock_threshold')
      .order('stock', { ascending: true });

    if (error) {
      console.error('Error fetching low stock products:', error);
      return {
        success: false,
        error: 'Error al obtener productos con stock bajo',
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in getLowStockProducts:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export async function getOutOfStockProducts(): Promise<
  ApiResponse<Array<{ id: string; name: string; stock: number }>>
> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('track_inventory', true)
      .eq('is_active', true)
      .eq('stock', 0)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching out of stock products:', error);
      return {
        success: false,
        error: 'Error al obtener productos sin stock',
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in getOutOfStockProducts:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}
