'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createPreference } from '@/lib/mercadopago/checkout'
import { processCheckoutSchema, type ProcessCheckoutInput } from '@/schemas/checkout.schema'
// import { checkEmailVerified } from '@/actions/auth/verification' // TODO: Habilitar más tarde
import { calculateShippingServer } from '@/actions/shipping'
import { auth } from '@/lib/auth/config'
import type { ApiResponse } from '@/types/api'
import type { CheckoutResult } from '@/types/cart'
import * as Sentry from '@sentry/nextjs'
import {
  reserveCartStock,
  completeCartReservations,
  checkStockAvailability,
} from '@/lib/stock/reservations'
import { randomUUID } from 'crypto'

export async function processCheckout(
  input: ProcessCheckoutInput
): Promise<ApiResponse<CheckoutResult>> {
  try {
    // Check if user is authenticated and email is verified
    const session = await auth()
    const userRole = session?.user?.role || 'customer'
    const isAdmin = userRole === 'admin' || userRole === 'super_admin'

    // TODO: Habilitar verificación de email más tarde
    // Skip email verification for admins
    /* if (session?.user?.id && !isAdmin) {
      const verificationResult = await checkEmailVerified(session.user.id)

      if (!verificationResult.verified) {
        return {
          success: false,
          error: 'Debes verificar tu email antes de realizar una compra. Revisa tu bandeja de entrada.',
        }
      }
    } */

    // Validar input
    const validationResult = processCheckoutSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { customer, items, coupon } = validationResult.data

    const supabase = createAdminClient()

    // Obtener información de productos y validar stock
    const productIds = items.map((item) => item.productId)
    const variantIds = items
      .filter((item) => item.variantId)
      .map((item) => item.variantId!)

    // Obtener productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, price, stock, track_inventory, images')
      .in('id', productIds)

    if (productsError || !products) {
      return {
        success: false,
        error: 'Error al obtener información de productos',
      }
    }

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

    // =========================================
    // PASO 1: Verificar disponibilidad de stock
    // =========================================
    const stockCheck = await checkStockAvailability(
      items.map((item) => ({
        productId: item.variantId ? undefined : item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }))
    )

    if (!stockCheck.available) {
      const unavailable = stockCheck.unavailableItems[0]
      const product = products.find(
        (p) => p.id === (unavailable.productId || unavailable.variantId)
      )
      return {
        success: false,
        error: `Stock insuficiente para ${product?.name || 'producto'}. Disponible: ${unavailable.available}, Solicitado: ${unavailable.requested}`,
      }
    }

    // =========================================
    // PASO 2: Reservar stock (15 minutos)
    // =========================================
    const sessionId = randomUUID() // Para usuarios no autenticados
    let reservationIds: string[] = []

    try {
      reservationIds = await reserveCartStock({
        items: items.map((item) => ({
          productId: item.variantId ? undefined : item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        userId: session?.user?.id,
        sessionId: session?.user?.id ? undefined : sessionId,
        expiresInMinutes: 15,
      })

      console.log(`✓ Reserved stock for ${reservationIds.length} items`)
    } catch (error) {
      console.error('Error reserving stock:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al reservar stock. Por favor intenta nuevamente.',
      }
    }

    // =========================================
    // PASO 3: Construir items de la orden
    // =========================================
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

        unitPrice = variant.price_override ?? product.price
        variantName = variant.name
        variantId = variant.id
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

    // Calcular costo de envío basado en el departamento
    let shippingCost = 0
    if (customer.address?.state) {
      const shippingResult = await calculateShippingServer(
        customer.address.state,
        subtotal
      )
      if (shippingResult) {
        shippingCost = shippingResult.cost
      }
    }

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
      // Eliminar la orden
      await supabase.from('orders').delete().eq('id', order.id)
      return {
        success: false,
        error: 'Error al crear los items de la orden',
      }
    }

    // =========================================
    // PASO 4: Completar reservas de stock
    // =========================================
    try {
      await completeCartReservations(reservationIds, order.id)
      console.log(`✓ Completed ${reservationIds.length} stock reservations`)
    } catch (error) {
      console.error('Error completing reservations:', error)
      // Log error but don't fail the checkout
      // Stock ya está reservado y se liberará automáticamente si no se completa
      Sentry.captureException(error, {
        tags: {
          module: 'checkout',
          action: 'complete_reservations',
        },
        extra: {
          orderId: order.id,
          reservationIds,
        },
      })
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
      // Crear preferencia de Mercado Pago
      try {
        console.log('=== INICIANDO CREACIÓN DE PREFERENCIA DE MERCADO PAGO ===')
        console.log('Order ID:', order.id)
        console.log('Order Number:', order.order_number)
        console.log('Items count:', cartItemsForMP.length)
        console.log('Shipping cost:', shippingCost)
        console.log('Total:', total)

        const preference = await createPreference({
          orderId: order.id,
          orderNumber: order.order_number,
          items: cartItemsForMP,
          customer,
          shippingCost,
        })

        console.log('✓ Preferencia creada exitosamente')
        console.log('Preference ID:', preference.id)
        console.log('Init Point:', preference.initPoint)

        // Actualizar orden con ID de preferencia
        await supabase
          .from('orders')
          .update({ mp_preference_id: preference.id })
          .eq('id', order.id)

        console.log('✓ Orden actualizada con preference_id')

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
      } catch (error) {
        console.error('=== ERROR AL CREAR PREFERENCIA DE MERCADO PAGO ===')
        console.error('Error completo:', error)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

        // Si el error tiene información adicional de Mercado Pago
        if (error && typeof error === 'object' && 'cause' in error) {
          console.error('Error cause:', error.cause)
        }

        // Capturar error en Sentry
        Sentry.captureException(error, {
          tags: {
            module: 'checkout',
            action: 'processCheckout',
            payment_method: 'mercadopago',
            error_type: 'preference_creation',
          },
          extra: {
            orderId: order.id,
            orderNumber: order.order_number,
            itemsCount: items.length,
            totalAmount: total,
          },
          level: 'error',
        })

        // Marcar la orden como fallida pero no eliminarla
        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            notes: `Error al crear preferencia de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          })
          .eq('id', order.id)

        return {
          success: false,
          error: `Error al procesar el pago con Mercado Pago: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta nuevamente.`,
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
    console.error('Error crítico en processCheckout:', error)

    // Capturar error crítico en Sentry
    Sentry.captureException(error, {
      tags: {
        module: 'checkout',
        action: 'processCheckout',
      },
      level: 'error',
    })

    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
