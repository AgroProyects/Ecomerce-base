import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ratelimit, getIdentifier } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 1. Aplicar rate limiting
    const identifier = await getIdentifier(request)
    const { success, limit, reset, remaining } = await ratelimit.coupon.limit(identifier)

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
    const body = await request.json()
    const { code, email, subtotal } = body

    if (!code || !email || subtotal === undefined) {
      return NextResponse.json(
        { error: 'Código, email y subtotal son requeridos' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar el cupón
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json(
        { valid: false, error: 'Cupón no válido' },
        { status: 200 }
      )
    }

    // Verificar fechas
    const now = new Date()
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json(
        { valid: false, error: 'El cupón aún no está activo' },
        { status: 200 }
      )
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json(
        { valid: false, error: 'El cupón ha expirado' },
        { status: 200 }
      )
    }

    // Verificar límite total de usos
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { valid: false, error: 'El cupón ha alcanzado su límite de uso' },
        { status: 200 }
      )
    }

    // Verificar límite por usuario
    const { count: userUsageCount } = await supabase
      .from('coupon_usages')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_email', email)

    if (coupon.usage_limit_per_user !== null && (userUsageCount || 0) >= coupon.usage_limit_per_user) {
      return NextResponse.json(
        { valid: false, error: 'Ya has utilizado este cupón' },
        { status: 200 }
      )
    }

    // Verificar monto mínimo
    if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
      return NextResponse.json(
        {
          valid: false,
          error: `El monto mínimo de compra es $${coupon.min_purchase_amount.toLocaleString()}`
        },
        { status: 200 }
      )
    }

    // Verificar primera compra
    if (coupon.first_purchase_only) {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', email)
        .not('status', 'in', '("cancelled","refunded")')

      if (orderCount && orderCount > 0) {
        return NextResponse.json(
          { valid: false, error: 'Este cupón es solo para primera compra' },
          { status: 200 }
        )
      }
    }

    // Calcular descuento
    let discountAmount: number
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (coupon.discount_value / 100)
      // Aplicar límite máximo si existe
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount
      }
    } else {
      discountAmount = coupon.discount_value
    }

    // El descuento no puede ser mayor que el subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Error al validar el cupón' },
      { status: 500 }
    )
  }
}
