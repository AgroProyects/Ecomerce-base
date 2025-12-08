'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse } from '@/types/api';
import type { ProductVariant } from '@/types/database';

// Obtener todas las variantes de un producto (para admin - incluye inactivas)
export async function getAllProductVariants(
  productId: string
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
        data: [],
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error);
      return {
        success: false,
        error: 'Error al obtener las variantes',
        data: [],
      };
    }

    return {
      success: true,
      data: (data as ProductVariant[]) || [],
    };
  } catch (error) {
    console.error('Error in getProductVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Obtener variante por ID
export async function getVariantById(
  id: string
): Promise<ApiResponse<ProductVariant | null>> {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID de variante requerido',
        data: null,
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching variant:', error);
      return {
        success: false,
        error: 'Error al obtener la variante',
        data: null,
      };
    }

    return {
      success: true,
      data: data as ProductVariant,
    };
  } catch (error) {
    console.error('Error in getVariantById:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: null,
    };
  }
}

// Obtener variantes activas de un producto
export async function getActiveProductVariants(
  productId: string
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
        data: [],
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching active variants:', error);
      return {
        success: false,
        error: 'Error al obtener las variantes activas',
        data: [],
      };
    }

    return {
      success: true,
      data: (data as ProductVariant[]) || [],
    };
  } catch (error) {
    console.error('Error in getActiveProductVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Obtener variantes con stock disponible
export async function getVariantsInStock(
  productId: string
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'ID de producto requerido',
        data: [],
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching variants in stock:', error);
      return {
        success: false,
        error: 'Error al obtener las variantes con stock',
        data: [],
      };
    }

    return {
      success: true,
      data: (data as ProductVariant[]) || [],
    };
  } catch (error) {
    console.error('Error in getVariantsInStock:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Obtener variante por SKU
export async function getVariantBySku(
  sku: string
): Promise<ApiResponse<ProductVariant | null>> {
  try {
    if (!sku) {
      return {
        success: false,
        error: 'SKU requerido',
        data: null,
      };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) {
      console.error('Error fetching variant by SKU:', error);
      return {
        success: false,
        error: 'Error al obtener la variante',
        data: null,
      };
    }

    return {
      success: true,
      data: data as ProductVariant,
    };
  } catch (error) {
    console.error('Error in getVariantBySku:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: null,
    };
  }
}
