import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/actions/products/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 12
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const sortBy = (searchParams.get('sortBy') || 'created_at') as 'name' | 'price' | 'created_at' | 'stock'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    const result = await getProducts({
      page,
      pageSize,
      search,
      categorySlug: category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      isActive: true,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in /api/products:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos', data: [], pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 } },
      { status: 500 }
    )
  }
}
