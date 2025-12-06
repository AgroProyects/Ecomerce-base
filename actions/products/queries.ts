'use server'

import { createClient } from '@/lib/supabase/server'
import type { Product, ProductVariant } from '@/types/database'
import type { ProductsQueryParams, PaginatedResponse } from '@/types/api'
import { PAGINATION } from '@/lib/constants/config'

export async function getProducts(
  params: ProductsQueryParams = {}
): Promise<PaginatedResponse<Product>> {
  const supabase = await createClient()

  const {
    page = 1,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    categoryId,
    categorySlug,
    search,
    minPrice,
    maxPrice,
    sortBy = 'created_at',
    sortOrder = 'desc',
    isActive = true,
    isFeatured,
  } = params

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select('*, categories(name, slug)', { count: 'exact' })

  // Filtros
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  if (isFeatured !== undefined) {
    query = query.eq('is_featured', isFeatured)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice)
  }

  // Ordenamiento
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Paginación
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching products:', error)
    throw new Error('Error al obtener productos')
  }

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    data: data as Product[],
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching product:', error)
    throw new Error('Error al obtener el producto')
  }

  return data as Product
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching product:', error)
    throw new Error('Error al obtener el producto')
  }

  return data as Product
}

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching variants:', error)
    throw new Error('Error al obtener variantes')
  }

  return data as ProductVariant[]
}

export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    throw new Error('Error al obtener productos destacados')
  }

  return data as Product[]
}

export async function getNewArrivals(limit: number = 8): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching new arrivals:', error)
    throw new Error('Error al obtener nuevos productos')
  }

  return data as Product[]
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit: number = 4
): Promise<Product[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .neq('id', productId)
    .limit(limit)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching related products:', error)
    return []
  }

  return data as Product[]
}

export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, images')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data as Product[]
}
