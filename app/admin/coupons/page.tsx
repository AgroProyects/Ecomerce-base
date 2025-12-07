'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Copy, Check, Tag, Percent, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { CouponDialog } from './coupon-dialog'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  usage_limit_per_user: number
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  first_purchase_only: boolean
  created_at: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      toast.error('Error al cargar los cupones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Código copiado')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Cupón eliminado')
        fetchCoupons()
      } else {
        toast.error('Error al eliminar el cupón')
      }
    } catch (error) {
      toast.error('Error al eliminar el cupón')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (response.ok) {
        toast.success(coupon.is_active ? 'Cupón desactivado' : 'Cupón activado')
        fetchCoupons()
      }
    } catch (error) {
      toast.error('Error al actualizar el cupón')
    }
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false
    return new Date(coupon.expires_at) < new Date()
  }

  const isNotStarted = (coupon: Coupon) => {
    if (!coupon.starts_at) return false
    return new Date(coupon.starts_at) > new Date()
  }

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>
    }
    if (isExpired(coupon)) {
      return <Badge variant="destructive">Expirado</Badge>
    }
    if (isNotStarted(coupon)) {
      return <Badge variant="outline">Programado</Badge>
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return <Badge variant="secondary">Agotado</Badge>
    }
    return <Badge className="bg-green-500">Activo</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones de Descuento</h1>
          <p className="text-sm text-zinc-500">Gestiona los cupones promocionales</p>
        </div>
        <Button onClick={() => { setEditingCoupon(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cupón
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <Tag className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="text-lg font-medium">No hay cupones</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Crea tu primer cupón de descuento
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Cupón
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {coupon.discount_type === 'percentage' ? (
                    <Percent className="h-5 w-5 text-zinc-600" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-zinc-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="flex items-center gap-1 font-mono text-lg font-bold hover:text-primary"
                    >
                      {coupon.code}
                      {copiedCode === coupon.code ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>
                    {getStatusBadge(coupon)}
                  </div>
                  <p className="text-sm text-zinc-500">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}% de descuento`
                      : `${formatPrice(coupon.discount_value)} de descuento`}
                    {coupon.min_purchase_amount > 0 &&
                      ` (mín. ${formatPrice(coupon.min_purchase_amount)})`}
                  </p>
                  {coupon.description && (
                    <p className="text-xs text-zinc-400">{coupon.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {coupon.usage_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''} usos
                  </p>
                  {coupon.expires_at && (
                    <p className="text-xs text-zinc-500">
                      Expira: {new Date(coupon.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(coupon)}
                  >
                    <span className={`h-3 w-3 rounded-full ${coupon.is_active ? 'bg-green-500' : 'bg-zinc-300'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditingCoupon(coupon); setDialogOpen(true) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CouponDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={editingCoupon}
        onSuccess={() => {
          setDialogOpen(false)
          fetchCoupons()
        }}
      />
    </div>
  )
}
