'use server'

import { createClient } from '@/lib/supabase/server'
import type { StoreSettings, Banner } from '@/types/database'

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    // Retornar null si no hay resultados o la tabla no existe
    if (error.code === 'PGRST116' || error.code === 'PGRST205') {
      return null
    }
    console.error('Error fetching store settings:', error)
    throw new Error('Error al obtener configuración de la tienda')
  }

  return data as StoreSettings
}

type BannerPosition = 'hero' | 'secondary' | 'footer' | 'popup'

export async function getBanners(position?: BannerPosition): Promise<Banner[]> {
  const supabase = await createClient()

  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (position) {
    query = query.eq('position', position)
  }

  // Filtrar por fechas
  const now = new Date().toISOString()
  query = query.or(`starts_at.is.null,starts_at.lte.${now}`)
  query = query.or(`ends_at.is.null,ends_at.gte.${now}`)

  const { data, error } = await query

  if (error) {
    // Retornar array vacío si la tabla no existe
    if (error.code === 'PGRST205') return []
    console.error('Error fetching banners:', error)
    return []
  }

  return data as Banner[]
}

export async function getHeroBanners(): Promise<Banner[]> {
  return getBanners('hero')
}
