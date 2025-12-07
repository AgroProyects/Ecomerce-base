import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json({ error: 'Error al obtener cupón' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    // Verificar si el código ya existe (excluyendo el actual)
    if (body.code) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .ilike('code', body.code)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe otro cupón con este código' },
          { status: 400 }
        )
      }
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update({
        code: body.code?.toUpperCase(),
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        min_purchase_amount: body.min_purchase_amount,
        max_discount_amount: body.max_discount_amount,
        usage_limit: body.usage_limit,
        usage_limit_per_user: body.usage_limit_per_user,
        starts_at: body.starts_at || null,
        expires_at: body.expires_at || null,
        first_purchase_only: body.first_purchase_only,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ error: 'Error al eliminar cupón' }, { status: 500 })
  }
}
