import { NextRequest, NextResponse } from 'next/server'
import { getAvailableStock } from '@/lib/stock/reservations'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/products/[slug]/stock
 * Obtiene stock disponible de un producto (público)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Obtener producto por slug
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, slug, stock, track_inventory')
      .eq('slug', slug)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Si no tracking inventory, retornar stock infinito
    if (!product.track_inventory) {
      return NextResponse.json({
        productId: product.id,
        productName: product.name,
        trackInventory: false,
        totalStock: null,
        availableStock: 999999, // Stock "infinito"
        reservedStock: 0,
        stockStatus: 'in_stock',
      })
    }

    // Obtener stock disponible (considerando reservas)
    const availableStock = await getAvailableStock({
      productId: product.id,
    })

    const reservedStock = product.stock - availableStock

    // Determinar status
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
    if (availableStock === 0) {
      stockStatus = 'out_of_stock'
    } else if (availableStock <= 5) {
      // Threshold de stock bajo
      stockStatus = 'low_stock'
    }

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      trackInventory: true,
      totalStock: product.stock,
      availableStock,
      reservedStock,
      stockStatus,
    })
  } catch (error) {
    console.error('Error getting product stock:', error)
    return NextResponse.json(
      { error: 'Error al obtener stock' },
      { status: 500 }
    )
  }
}
