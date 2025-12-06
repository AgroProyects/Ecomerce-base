'use server'

import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/database'

export async function getCategories(onlyActive: boolean = true): Promise<Category[]> {
  const supabase = await createClient()

  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Error al obtener categorías')
  }

  return data as Category[]
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching category:', error)
    throw new Error('Error al obtener la categoría')
  }

  return data as Category
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching category:', error)
    throw new Error('Error al obtener la categoría')
  }

  return data as Category
}

export async function getCategoriesTree(): Promise<CategoryWithChildren[]> {
  const categories = await getCategories(true)
  return buildCategoryTree(categories)
}

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

function buildCategoryTree(
  categories: Category[],
  parentId: string | null = null
): CategoryWithChildren[] {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }))
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching subcategories:', error)
    throw new Error('Error al obtener subcategorías')
  }

  return data as Category[]
}
