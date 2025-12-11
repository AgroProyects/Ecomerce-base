import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_LIMIT = 50
const MAX_QUERY_LENGTH = 200

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()?.slice(0, MAX_QUERY_LENGTH)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, MAX_LIMIT)

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], categories: [] })
    }

    const supabase = createAdminClient()
    const searchPattern = `%${query}%`

    // Buscar productos
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_price, images, category:categories(name, slug)')
      .eq('is_active', true)
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('is_featured', { ascending: false })
      .limit(limit)

    // Buscar categorías
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .eq('is_active', true)
      .ilike('name', searchPattern)
      .order('sort_order')
      .limit(5)

    return NextResponse.json({
      products: products || [],
      categories: categories || [],
      query,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
