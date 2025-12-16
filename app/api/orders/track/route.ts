import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.tracking.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. Continuar con la lógica normal
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')?.trim()
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Número de pedido y email son requeridos' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar el pedido
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customer_name,
        customer_email,
        subtotal,
        shipping_cost,
        discount_amount,
        total,
        created_at,
        paid_at,
        order_items (
          product_name,
          variant_name,
          quantity,
          unit_price
        )
      `)
      .eq('order_number', orderNumber)
      .ilike('customer_email', email)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'No encontramos un pedido con esos datos' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        ...order,
        items: order.order_items,
      },
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      { error: 'Error al buscar el pedido' },
      { status: 500 }
    )
  }
}
