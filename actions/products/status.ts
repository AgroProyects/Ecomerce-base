'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse } from '@/types/api';
import { z } from 'zod';

const toggleStatusSchema = z.object({
  productId: z.string().uuid(),
  is_active: z.boolean().optional(),
});

const toggleFeaturedSchema = z.object({
  productId: z.string().uuid(),
  is_featured: z.boolean().optional(),
});

export async function toggleProductStatus(
  input: z.infer<typeof toggleStatusSchema>
): Promise<ApiResponse<{ is_active: boolean }>> {
  try {
    const validationResult = toggleStatusSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { productId, is_active } = validationResult.data;
    const supabase = createAdminClient();

    // Si no se proporciona is_active, obtener el estado actual y alternarlo
    let newStatus = is_active;
    if (newStatus === undefined) {
      const { data: product } = await supabase
        .from('products')
        .select('is_active')
        .eq('id', productId)
        .single();

      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      newStatus = !product.is_active;
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('is_active')
      .single();

    if (error) {
      console.error('Error toggling product status:', error);
      return {
        success: false,
        error: 'Error al cambiar el estado del producto',
      };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/products');
    revalidatePath('/');

    return {
      success: true,
      data: { is_active: data.is_active },
      message: `Producto ${data.is_active ? 'activado' : 'desactivado'} exitosamente`,
    };
  } catch (error) {
    console.error('Error in toggleProductStatus:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export async function toggleProductFeatured(
  input: z.infer<typeof toggleFeaturedSchema>
): Promise<ApiResponse<{ is_featured: boolean }>> {
  try {
    const validationResult = toggleFeaturedSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { productId, is_featured } = validationResult.data;
    const supabase = createAdminClient();

    // Si no se proporciona is_featured, obtener el estado actual y alternarlo
    let newStatus = is_featured;
    if (newStatus === undefined) {
      const { data: product } = await supabase
        .from('products')
        .select('is_featured')
        .eq('id', productId)
        .single();

      if (!product) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      newStatus = !product.is_featured;
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        is_featured: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('is_featured')
      .single();

    if (error) {
      console.error('Error toggling featured status:', error);
      return {
        success: false,
        error: 'Error al cambiar el estado destacado del producto',
      };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/');

    return {
      success: true,
      data: { is_featured: data.is_featured },
      message: `Producto ${data.is_featured ? 'marcado como destacado' : 'desmarcado como destacado'} exitosamente`,
    };
  } catch (error) {
    console.error('Error in toggleProductFeatured:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export async function bulkUpdateStatus(
  productIds: string[],
  is_active: boolean
): Promise<ApiResponse<{ updatedCount: number }>> {
  try {
    if (!productIds || productIds.length === 0) {
      return {
        success: false,
        error: 'Debes seleccionar al menos un producto',
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .in('id', productIds)
      .select('id');

    if (error) {
      console.error('Error bulk updating status:', error);
      return {
        success: false,
        error: 'Error al actualizar productos',
      };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');

    return {
      success: true,
      data: { updatedCount: data.length },
      message: `${data.length} producto(s) ${is_active ? 'activado(s)' : 'desactivado(s)'} exitosamente`,
    };
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}
