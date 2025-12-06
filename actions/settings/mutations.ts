'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  updateStoreSettingsSchema,
  type UpdateStoreSettingsInput,
} from '@/schemas/settings.schema'
import type { ApiResponse } from '@/types/api'
import type { StoreSettings, Banner } from '@/types/database'

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput
): Promise<ApiResponse<StoreSettings>> {
  try {
    const validationResult = updateStoreSettingsSchema.safeParse(input)

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      }
    }

    const { id, ...data } = validationResult.data

    const supabase = createAdminClient()

    const { data: settings, error } = await supabase
      .from('store_settings')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating store settings:', error)
      return {
        success: false,
        error: 'Error al actualizar la configuración',
      }
    }

    // Revalidar todas las páginas ya que la config afecta todo el sitio
    revalidatePath('/', 'layout')

    return {
      success: true,
      data: settings as StoreSettings,
      message: 'Configuración actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error in updateStoreSettings:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function createBanner(
  input: Omit<Banner, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Banner>> {
  try {
    const supabase = createAdminClient()

    const { data: banner, error } = await supabase
      .from('banners')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('Error creating banner:', error)
      return {
        success: false,
        error: 'Error al crear el banner',
      }
    }

    revalidatePath('/')
    revalidatePath('/admin/banners')

    return {
      success: true,
      data: banner as Banner,
      message: 'Banner creado exitosamente',
    }
  } catch (error) {
    console.error('Error in createBanner:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function updateBanner(
  id: string,
  input: Partial<Omit<Banner, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Banner>> {
  try {
    const supabase = createAdminClient()

    const { data: banner, error } = await supabase
      .from('banners')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating banner:', error)
      return {
        success: false,
        error: 'Error al actualizar el banner',
      }
    }

    revalidatePath('/')
    revalidatePath('/admin/banners')

    return {
      success: true,
      data: banner as Banner,
      message: 'Banner actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error in updateBanner:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}

export async function deleteBanner(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting banner:', error)
      return {
        success: false,
        error: 'Error al eliminar el banner',
      }
    }

    revalidatePath('/')
    revalidatePath('/admin/banners')

    return {
      success: true,
      message: 'Banner eliminado exitosamente',
    }
  } catch (error) {
    console.error('Error in deleteBanner:', error)
    return {
      success: false,
      error: 'Error interno del servidor',
    }
  }
}
