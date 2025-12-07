import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient()

    // Verificar si el código ya existe
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .ilike('code', body.code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un cupón con este código' },
        { status: 400 }
      )
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: body.code.toUpperCase(),
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_purchase_amount: body.min_purchase_amount || 0,
        max_discount_amount: body.max_discount_amount || null,
        usage_limit: body.usage_limit || null,
        usage_limit_per_user: body.usage_limit_per_user || 1,
        starts_at: body.starts_at || null,
        expires_at: body.expires_at || null,
        first_purchase_only: body.first_purchase_only || false,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ error: 'Error al crear cupón' }, { status: 500 })
  }
}
