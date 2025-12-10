'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@/lib/auth/config'
import type { ApiResponse } from '@/types/api'
import {
  addToCartSchema,
  type AddToCartInput,
  updateCartItemSchema,
  type UpdateCartItemInput,
  syncCartSchema,
  type SyncCartInput,
  type Cart,
  type CartSyncResult,
} from '@/schemas/cart.schema'
import { v4 as uuid } from 'uuid'

/**
 * Obtener o crear session ID para invitados
 */
async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('cart_session_id')?.value

  if (!sessionId) {
    sessionId = uuid()
    cookieStore.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    })
  }

  return sessionId
}

/**
 * Sincronizar carrito de localStorage con base de datos
 */
export async function syncCart(
  input: SyncCartInput
): Promise<ApiResponse<CartSyncResult>> {
  try {
    // Validar input
    const validationResult = syncCartSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data
    const session = await auth()
    const supabase = createAdminClient()

    // Obtener user_id o session_id
    const userId = session?.user?.id || null
    const sessionId = userId ? null : await getOrCreateSessionId()

    // Validar stock y precios para cada item
    const validatedItems = []
    const outOfStockItems: string[] = []
    const lowStockItems: Array<any> = []
    const priceChanges: Array<any> = []

    for (const item of data.items) {
      // Obtener producto actual
      const { data: product } = await supabase
        .from('products')
        .select('id, name, slug, price, stock, track_inventory, images')
        .eq('id', item.productId)
        .single()

      if (!product) {
        outOfStockItems.push(item.productId)
        continue
      }

      // Obtener variante si existe
      let variant = null
      let currentPrice = product.price
      let currentStock = product.stock

      if (item.variantId) {
        const { data: variantData } = await supabase
          .from('product_variants')
          .select('id, name, price_override, stock')
          .eq('id', item.variantId)
          .single()

        variant = variantData
        if (variant) {
          currentPrice = variant.price_override || product.price
          currentStock = variant.stock || 0
        }
      }

      // Validar stock disponible (considerando reservas)
      const { data: availableStockData } = await supabase.rpc(
        'get_available_stock',
        {
          p_product_id: item.productId,
          p_variant_id: item.variantId || null,
        }
      )

      const availableStock = availableStockData || 0

      // Verificar si hay stock suficiente
      if (product.track_inventory && availableStock < item.quantity) {
        if (availableStock === 0) {
          outOfStockItems.push(product.name)
        } else {
          lowStockItems.push({
            itemId: item.id,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock,
          })
        }
        continue
      }

      // Detectar cambios de precio
      if (Math.abs(currentPrice - item.unitPrice) > 0.01) {
        priceChanges.push({
          itemId: item.id,
          productName: product.name,
          oldPrice: item.unitPrice,
          newPrice: currentPrice,
        })
      }

      // Agregar item validado
      validatedItems.push({
        id: item.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0] || '',
        variantId: variant?.id || null,
        variantName: variant?.name || null,
        quantity: Math.min(item.quantity, availableStock),
        unitPrice: currentPrice,
        totalPrice: currentPrice * Math.min(item.quantity, availableStock),
        inStock: true,
        availableStock,
      })
    }

    // Calcular totales
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )

    // TODO: Aplicar cupón si existe
    const discount = 0
    const total = subtotal - discount

    // Guardar carrito en BD
    const { data: cartId } = await supabase.rpc('upsert_cart', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_items: validatedItems,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_coupon_id: null,
      p_coupon_code: data.couponCode || null,
    })

    // Obtener carrito guardado
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('id', cartId)
      .single()

    revalidatePath('/cart')

    return {
      success: true,
      data: {
        cart: cart as Cart,
        outOfStockItems,
        lowStockItems,
        priceChanges,
      },
    }
  } catch (error) {
    console.error('Error in syncCart:', error)
    return {
      success: false,
      error: 'Error al sincronizar carrito',
    }
  }
}

/**
 * Agregar item al carrito (con validación de stock)
 */
export async function addToCart(
  input: AddToCartInput
): Promise<ApiResponse<{ availableStock: number; addedQuantity: number }>> {
  try {
    // Validar input
    const validationResult = addToCartSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const data = validationResult.data
    const supabase = createAdminClient()

    // Obtener producto
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, stock, track_inventory, is_active')
      .eq('id', data.productId)
      .single()

    if (!product) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    if (!product.is_active) {
      return {
        success: false,
        error: 'Este producto no está disponible',
      }
    }

    // Validar stock disponible
    const { data: availableStockData } = await supabase.rpc(
      'get_available_stock',
      {
        p_product_id: data.productId,
        p_variant_id: data.variantId || null,
      }
    )

    const availableStock = availableStockData || 0

    if (product.track_inventory && availableStock < data.quantity) {
      return {
        success: false,
        error:
          availableStock === 0
            ? 'Producto sin stock'
            : `Solo hay ${availableStock} unidades disponibles`,
        data: {
          availableStock,
          addedQuantity: 0,
        },
      }
    }

    // Stock suficiente
    return {
      success: true,
      data: {
        availableStock,
        addedQuantity: data.quantity,
      },
      message: 'Producto agregado al carrito',
    }
  } catch (error) {
    console.error('Error in addToCart:', error)
    return {
      success: false,
      error: 'Error al agregar producto',
    }
  }
}

/**
 * Validar stock antes del checkout
 */
export async function validateCartStock(
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>
): Promise<ApiResponse<{ valid: boolean; issues: any[] }>> {
  try {
    const supabase = createAdminClient()
    const issues = []

    for (const item of items) {
      // Validar stock disponible
      const { data: availableStock } = await supabase.rpc('get_available_stock', {
        p_product_id: item.productId,
        p_variant_id: item.variantId || null,
      })

      const available = availableStock || 0

      if (available < item.quantity) {
        // Obtener nombre del producto para el mensaje
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.productId)
          .single()

        issues.push({
          productId: item.productId,
          productName: product?.name || 'Producto',
          requestedQuantity: item.quantity,
          availableStock: available,
          message:
            available === 0
              ? 'Sin stock'
              : `Solo ${available} unidades disponibles`,
        })
      }
    }

    return {
      success: true,
      data: {
        valid: issues.length === 0,
        issues,
      },
    }
  } catch (error) {
    console.error('Error in validateCartStock:', error)
    return {
      success: false,
      error: 'Error al validar stock',
    }
  }
}

/**
 * Limpiar carrito del usuario/sesión
 */
export async function clearCart(): Promise<ApiResponse<void>> {
  try {
    const session = await auth()
    const supabase = createAdminClient()

    const userId = session?.user?.id || null
    const sessionId = userId ? null : await getOrCreateSessionId()

    // Marcar carrito como convertido (no eliminar para historial)
    if (userId) {
      await supabase
        .from('shopping_carts')
        .update({ status: 'converted', items: [] })
        .eq('user_id', userId)
        .eq('status', 'active')
    } else if (sessionId) {
      await supabase
        .from('shopping_carts')
        .update({ status: 'converted', items: [] })
        .eq('session_id', sessionId)
        .eq('status', 'active')
    }

    revalidatePath('/cart')

    return {
      success: true,
      message: 'Carrito limpiado',
    }
  } catch (error) {
    console.error('Error in clearCart:', error)
    return {
      success: false,
      error: 'Error al limpiar carrito',
    }
  }
}

/**
 * Merge de carritos al hacer login
 */
export async function mergeCarts(): Promise<ApiResponse<Cart>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Usuario no autenticado',
      }
    }

    const sessionId = await getOrCreateSessionId()
    const supabase = createAdminClient()

    // Llamar función SQL de merge
    const { data: cartId } = await supabase.rpc('merge_carts', {
      p_user_id: session.user.id,
      p_session_id: sessionId,
    })

    if (!cartId) {
      return {
        success: true,
        data: null as any,
        message: 'No hay carritos para combinar',
      }
    }

    // Obtener carrito merged
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('id', cartId)
      .single()

    revalidatePath('/cart')

    return {
      success: true,
      data: cart as Cart,
      message: 'Carritos combinados',
    }
  } catch (error) {
    console.error('Error in mergeCarts:', error)
    return {
      success: false,
      error: 'Error al combinar carritos',
    }
  }
}
