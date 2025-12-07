import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, phone, dni, birth_date, avatar_url, created_at')
      .eq('id', session.user.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Clean empty strings to null
    const cleanData = {
      name: result.data.name,
      phone: result.data.phone || null,
      dni: result.data.dni || null,
      birth_date: result.data.birth_date || null,
    }

    const { data, error } = await supabase
      .from('users')
      .update(cleanData)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
