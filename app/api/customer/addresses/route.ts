import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const addressSchema = z.object({
  user_id: z.string(),
  label: z.string().default('Casa'),
  recipient_name: z.string().min(2),
  phone: z.string().optional().nullable(),
  street: z.string().min(1),
  number: z.string().min(1),
  floor: z.string().optional().nullable(),
  apartment: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().default('Uruguay'),
  additional_info: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get addresses error:', error)
    return NextResponse.json(
      { error: 'Error al obtener direcciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = addressSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    // Verify user owns this address
    if (result.data.user_id !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // If this is set as default, unset other defaults
    if (result.data.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert(result.data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json(
      { error: 'Error al crear dirección' },
      { status: 500 }
    )
  }
}
