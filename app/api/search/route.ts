import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const limit = parseInt(searchParams.get('limit') || '10')

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
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
