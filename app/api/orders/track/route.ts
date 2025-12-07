import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
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
