'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createPreference } from '@/lib/mercadopago/checkout'
import { processCheckoutSchema, type ProcessCheckoutInput } from '@/schemas/checkout.schema'
import { checkEmailVerified } from '@/actions/auth/verification'
import { auth } from '@/lib/auth/config'
import type { ApiResponse } from '@/types/api'
import type { CheckoutResult } from '@/types/cart'

export async function processCheckout(
  input: ProcessCheckoutInput
): Promise<ApiResponse<CheckoutResult>> {
  try {
    console.log('🚀 [CHECKOUT] Iniciando proceso de checkout:', {
      customer: input.customer,
      itemsCount: input.items?.length || 0,
      coupon: input.coupon,
    })

    // Check if user is authenticated and email is verified
    const session = await auth()
    if (session?.user?.id) {
      const verificationResult = await checkEmailVerified(session.user.id)

      if (!verificationResult.verified) {
        console.log('❌ [CHECKOUT] Email no verificado para usuario:', session.user.id)
        return {
          success: false,
          error: 'Debes verificar tu email antes de realizar una compra. Revisa tu bandeja de entrada.',
        }
      }

      console.log('✅ [CHECKOUT] Email verificado para usuario:', session.user.id)
    }

    // Validar input
    const validationResult = processCheckoutSchema.safeParse(input)

    if (!validationResult.success) {
      console.error('❌ [CHECKOUT] Validación fallida:', validationResult.error.issues)
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { customer, items, coupon } = validationResult.data

    console.log('✅ [CHECKOUT] Validación exitosa:', {
      paymentMethod: customer.paymentMethod,
      itemsCount: items.length,
    })

    const supabase = createAdminClient()

    // Obtener información de productos y validar stock
    const productIds = items.map((item) => item.productId)
    const variantIds = items
      .filter((item) => item.variantId)
      .map((item) => item.variantId!)

    console.log('📦 [CHECKOUT] IDs extraídos:', {
      productIds,
      variantIds,
    })

    // Obtener productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, price, stock, track_inventory, images')
      .in('id', productIds)

    if (productsError || !products) {
      console.error('❌ [CHECKOUT] Error obteniendo productos:', productsError)
      return {
        success: false,
        error: 'Error al obtener información de productos',
      }
    }

    console.log('✅ [CHECKOUT] Productos obtenidos:', products.length)

    // Obtener variantes si hay
    let variants: Array<{
      id: string
      name: string
      price_override: number | null
      stock: number
      product_id: string
    }> = []

    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('id, name, price_override, stock, product_id')
        .in('id', variantIds)

      variants = variantsData || []
    }

    // Construir items de la orden y validar stock
    const orderItems = []
    const cartItemsForMP = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)

      if (!product) {
        return {
          success: false,
          error: `Producto no encontrado: ${item.productId}`,
        }
      }

      let unitPrice = product.price
      let variantName: string | null = null
      let variantId: string | null = null

      if (item.variantId) {
        const variant = variants.find((v) => v.id === item.variantId)

        if (!variant) {
          return {
            success: false,
            error: `Variante no encontrada: ${item.variantId}`,
          }
        }

        // Validar stock de variante
        if (variant.stock < item.quantity) {
          return {
            success: false,
            error: `Stock insuficiente para ${product.name} - ${variant.name}`,
          }
        }

        unitPrice = variant.price_override ?? product.price
        variantName = variant.name
        variantId = variant.id
      } else {
        // Validar stock de producto
        if (product.track_inventory && product.stock < item.quantity) {
          return {
            success: false,
            error: `Stock insuficiente para ${product.name}`,
          }
        }
      }

      const totalPrice = unitPrice * item.quantity

      orderItems.push({
        product_id: product.id,
        variant_id: variantId,
        product_name: product.name,
        variant_name: variantName,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      })

      cartItemsForMP.push({
        id: variantId || product.id,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          images: product.images,
          stock: product.stock,
          track_inventory: product.track_inventory,
        },
        variant: variantId
          ? {
              id: variantId,
              name: variantName!,
              price_override: unitPrice !== product.price ? unitPrice : null,
              stock: variants.find((v) => v.id === variantId)!.stock,
            }
          : null,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      })
    }

    // Calcular totales
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)
    const shippingCost = 0 // Implementar lógica de envío
    const discountAmount = coupon?.discountAmount || 0
    const total = subtotal + shippingCost - discountAmount

    // Generar número de orden
    const { data: orderNumber } = await supabase.rpc('generate_order_number')

    // Determinar estado inicial según método de pago
    let initialStatus: 'pending' | 'pending_payment' = 'pending'
    if (customer.paymentMethod === 'bank_transfer') {
      initialStatus = 'pending_payment'
    }

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber || `${Date.now()}`,
        status: initialStatus,
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        shipping_address: customer.address,
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total,
        notes: customer.notes,
        coupon_id: coupon?.id || null,
        coupon_code: coupon?.code || null,
        payment_method: customer.paymentMethod,
        payment_proof_url: customer.paymentProofUrl || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return {
        success: false,
        error: 'Error al crear la orden',
      }
    }

    // Crear items de la orden
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Eliminar la orden
      await supabase.from('orders').delete().eq('id', order.id)
      return {
        success: false,
        error: 'Error al crear los items de la orden',
      }
    }

    // Registrar uso del cupón si aplica
    if (coupon) {
      // Registrar uso
      await supabase.from('coupon_usages').insert({
        coupon_id: coupon.id,
        user_email: customer.email,
        order_id: order.id,
        discount_applied: discountAmount,
      })

      // Incrementar contador de uso del cupón
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('usage_count')
        .eq('id', coupon.id)
        .single()

      if (currentCoupon) {
        await supabase
          .from('coupons')
          .update({ usage_count: (currentCoupon.usage_count || 0) + 1 })
          .eq('id', coupon.id)
      }
    }

    // Procesar según método de pago
    if (customer.paymentMethod === 'mercadopago') {
      console.log('💳 [CHECKOUT] Procesando pago con Mercado Pago')
      // Crear preferencia de Mercado Pago
      try {
        console.log('🔄 [CHECKOUT] Creando preferencia de MP con:', {
          orderId: order.id,
          orderNumber: order.order_number,
          itemsCount: cartItemsForMP.length,
          shippingCost,
        })

        const preference = await createPreference({
          orderId: order.id,
          orderNumber: order.order_number,
          items: cartItemsForMP,
          customer,
          shippingCost,
        })

        console.log('✅ [CHECKOUT] Preferencia creada:', {
          preferenceId: preference.id,
          initPoint: preference.initPoint,
        })

        // Actualizar orden con ID de preferencia
        await supabase
          .from('orders')
          .update({ mp_preference_id: preference.id })
          .eq('id', order.id)

        return {
          success: true,
          data: {
            success: true,
            orderId: order.id,
            orderNumber: order.order_number,
            paymentMethod: 'mercadopago',
            preferenceId: preference.id,
            initPoint: preference.initPoint,
          },
        }
      } catch (mpError) {
        console.error('❌ [CHECKOUT] Error creando preferencia de MP:', mpError)
        console.error('❌ [CHECKOUT] Stack trace:', mpError instanceof Error ? mpError.stack : 'No stack')
        // Marcar la orden como fallida pero no eliminarla
        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            notes: 'Error al crear preferencia de pago',
          })
          .eq('id', order.id)

        return {
          success: false,
          error: 'Error al procesar el pago. Por favor, intenta nuevamente.',
        }
      }
    } else if (customer.paymentMethod === 'bank_transfer') {
      // Transferencia bancaria - orden creada en estado pending_payment
      return {
        success: true,
        data: {
          success: true,
          orderId: order.id,
          orderNumber: order.order_number,
          paymentMethod: 'bank_transfer',
          redirectUrl: `/orders/${order.id}/payment-instructions`,
        },
      }
    } else if (customer.paymentMethod === 'cash_on_delivery') {
      // Efectivo contra entrega - orden creada en estado pending
      return {
        success: true,
        data: {
          success: true,
          orderId: order.id,
          orderNumber: order.order_number,
          paymentMethod: 'cash_on_delivery',
          redirectUrl: `/orders/${order.id}/confirmation`,
        },
      }
    } else {
      return {
        success: false,
        error: 'Método de pago no válido',
      }
    }
  } catch (error) {
    console.error('Error in processCheckout:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
