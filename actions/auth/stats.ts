'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface EmailVerificationStats {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  verificationRate: number
  recentUnverifiedUsers: Array<{
    id: string
    name: string | null
    email: string
    created_at: string
  }>
}

/**
 * Get email verification statistics for admin dashboard
 */
export async function getEmailVerificationStats(): Promise<EmailVerificationStats> {
  try {
    const supabase = createAdminClient()

    // Get total users count (using schema to bypass types)
    const { count: totalUsers } = await (supabase.schema('public') as any)
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Get verified users count
    const { count: verifiedUsers } = await (supabase.schema('public') as any)
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('email_verified', true)

    // Get recent unverified users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentUnverified } = await (supabase.schema('public') as any)
      .from('customers')
      .select('id, name, email, created_at')
      .eq('email_verified', false)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const total = totalUsers || 0
    const verified = verifiedUsers || 0
    const unverified = total - verified
    const verificationRate = total > 0 ? (verified / total) * 100 : 0

    return {
      totalUsers: total,
      verifiedUsers: verified,
      unverifiedUsers: unverified,
      verificationRate: Math.round(verificationRate),
      recentUnverifiedUsers: recentUnverified || [],
    }
  } catch (error) {
    console.error('Error getting email verification stats:', error)
    return {
      totalUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      verificationRate: 0,
      recentUnverifiedUsers: [],
    }
  }
}
