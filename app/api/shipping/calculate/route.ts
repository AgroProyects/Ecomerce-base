import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { department, subtotal } = body

    if (!department) {
      return NextResponse.json(
        { error: 'Departamento es requerido' },
        { status: 400 }
      )
    }

    if (subtotal === undefined || subtotal < 0) {
      return NextResponse.json(
        { error: 'Subtotal inválido' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar el costo de envío para el departamento
    const { data: shippingCost, error } = await supabase
      .from('shipping_costs')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .single()

    if (error || !shippingCost) {
      // Si no existe configuración, retornar un costo por defecto
      return NextResponse.json({
        success: true,
        data: {
          cost: 250, // Costo por defecto
          isFreeShipping: false,
          estimatedDaysMin: 2,
          estimatedDaysMax: 5,
          department,
          isDefault: true,
        },
      })
    }

    // Verificar si aplica envío gratis
    const isFreeShipping =
      shippingCost.free_shipping_threshold !== null &&
      subtotal >= shippingCost.free_shipping_threshold

    return NextResponse.json({
      success: true,
      data: {
        cost: isFreeShipping ? 0 : shippingCost.cost,
        isFreeShipping,
        estimatedDaysMin: shippingCost.estimated_days_min,
        estimatedDaysMax: shippingCost.estimated_days_max,
        department: shippingCost.department,
        freeShippingThreshold: shippingCost.free_shipping_threshold,
        isDefault: false,
      },
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { error: 'Error al calcular el costo de envío' },
      { status: 500 }
    )
  }
}

// GET para obtener todos los costos de envío (útil para mostrar info)
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: shippingCosts, error } = await supabase
      .from('shipping_costs')
      .select('department, cost, free_shipping_threshold, estimated_days_min, estimated_days_max')
      .eq('is_active', true)
      .order('department', { ascending: true })

    if (error) {
      console.error('Error fetching shipping costs:', error)
      return NextResponse.json(
        { error: 'Error al obtener costos de envío' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: shippingCosts || [],
    })
  } catch (error) {
    console.error('Error in GET shipping costs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
