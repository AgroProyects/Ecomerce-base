'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  generateVariantsSchema,
  type GenerateVariantsInput,
} from '@/schemas/variant.schema';
import type { ApiResponse } from '@/types/api';
import type { ProductVariant } from '@/types/database';

// Generar todas las combinaciones posibles de atributos
function generateCombinations(
  attributes: Array<{ name: string; values: string[] }>
): Array<Array<{ name: string; value: string }>> {
  if (attributes.length === 0) return [[]];

  const [first, ...rest] = attributes;
  const restCombinations = generateCombinations(rest);

  const combinations: Array<Array<{ name: string; value: string }>> = [];

  for (const value of first.values) {
    for (const restCombination of restCombinations) {
      combinations.push([
        { name: first.name, value },
        ...restCombination,
      ]);
    }
  }

  return combinations;
}

// Generar nombre de variante desde atributos
function generateVariantName(
  attributes: Array<{ name: string; value: string }>
): string {
  return attributes.map((attr) => attr.value).join(' / ');
}

// Generar SKU desde atributos (opcional)
function generateVariantSku(
  productId: string,
  attributes: Array<{ name: string; value: string }>
): string {
  const attributePart = attributes
    .map((attr) => attr.value.substring(0, 3).toUpperCase())
    .join('-');

  const productPart = productId.substring(0, 8).toUpperCase();

  return `${productPart}-${attributePart}`;
}

// Generar variantes automáticamente desde atributos
export async function generateVariants(
  input: GenerateVariantsInput
): Promise<ApiResponse<ProductVariant[]>> {
  try {
    const validationResult = generateVariantsSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
        data: [],
      };
    }

    const { product_id, attributes, base_price, base_stock } = validationResult.data;

    const supabase = createAdminClient();

    // Verificar que el producto exista
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return {
        success: false,
        error: 'Producto no encontrado',
        data: [],
      };
    }

    // Generar todas las combinaciones de atributos
    const combinations = generateCombinations(attributes);

    if (combinations.length === 0) {
      return {
        success: false,
        error: 'No se generaron combinaciones',
        data: [],
      };
    }

    // Crear array de variantes a insertar
    const variantsToInsert = combinations.map((combination, index) => ({
      product_id,
      name: generateVariantName(combination),
      sku: generateVariantSku(product_id, combination),
      price_override: base_price,
      stock: base_stock || 0,
      attributes: combination,
      is_active: true,
      sort_order: index,
    }));

    // Insertar todas las variantes
    const { data: createdVariants, error } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select();

    if (error) {
      console.error('Error generating variants:', error);
      return {
        success: false,
        error: 'Error al generar las variantes',
        data: [],
      };
    }

    revalidatePath(`/admin/products/${product_id}`);

    return {
      success: true,
      data: (createdVariants as ProductVariant[]) || [],
      message: `${createdVariants.length} variantes generadas exitosamente`,
    };
  } catch (error) {
    console.error('Error in generateVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}

// Obtener preview de variantes a generar (sin insertar)
export async function previewGeneratedVariants(
  input: GenerateVariantsInput
): Promise<ApiResponse<Array<{
  name: string;
  sku: string;
  attributes: Array<{ name: string; value: string }>;
}>>> {
  try {
    const validationResult = generateVariantsSchema.safeParse(input);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
        data: [],
      };
    }

    const { product_id, attributes } = validationResult.data;

    // Generar todas las combinaciones de atributos
    const combinations = generateCombinations(attributes);

    const preview = combinations.map((combination) => ({
      name: generateVariantName(combination),
      sku: generateVariantSku(product_id, combination),
      attributes: combination,
    }));

    return {
      success: true,
      data: preview,
      message: `Se generarán ${preview.length} variantes`,
    };
  } catch (error) {
    console.error('Error in previewGeneratedVariants:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: [],
    };
  }
}
