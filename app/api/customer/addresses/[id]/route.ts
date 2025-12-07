import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateSchema = z.object({
  label: z.string().optional(),
  recipient_name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  street: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  floor: z.string().optional().nullable(),
  apartment: z.string().optional().nullable(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postal_code: z.string().min(1).optional(),
  additional_info: z.string().optional().nullable(),
  is_default: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // If setting as default, unset others
    if (result.data.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .update(result.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar dirección' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar dirección' },
      { status: 500 }
    )
  }
}
