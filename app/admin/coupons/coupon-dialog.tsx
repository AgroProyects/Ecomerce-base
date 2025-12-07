'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const couponSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').max(50),
  description: z.string().max(255).optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0.01, 'El valor debe ser mayor a 0'),
  min_purchase_amount: z.number().min(0).optional(),
  max_discount_amount: z.number().min(0).optional().nullable(),
  usage_limit: z.number().min(1).optional().nullable(),
  usage_limit_per_user: z.number().min(1).optional(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  first_purchase_only: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

type CouponFormData = z.infer<typeof couponSchema>

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
}

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
  onSuccess: () => void
}

export function CouponDialog({ open, onOpenChange, coupon, onSuccess }: CouponDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discount_type: 'percentage',
      is_active: true,
      usage_limit_per_user: 1,
      min_purchase_amount: 0,
      first_purchase_only: false,
    },
  })

  const discountType = watch('discount_type')
  const firstPurchaseOnly = watch('first_purchase_only')

  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase_amount: coupon.min_purchase_amount,
        max_discount_amount: coupon.max_discount_amount,
        usage_limit: coupon.usage_limit,
        usage_limit_per_user: coupon.usage_limit_per_user,
        starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : null,
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : null,
        first_purchase_only: coupon.first_purchase_only,
        is_active: coupon.is_active,
      })
    } else {
      reset({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 0,
        max_discount_amount: null,
        usage_limit: null,
        usage_limit_per_user: 1,
        starts_at: null,
        expires_at: null,
        first_purchase_only: false,
        is_active: true,
      })
    }
  }, [coupon, reset])

  const onSubmit = async (data: CouponFormData) => {
    setIsLoading(true)
    try {
      const url = coupon
        ? `/api/admin/coupons/${coupon.id}`
        : '/api/admin/coupons'
      const method = coupon ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          code: data.code.toUpperCase(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      toast.success(coupon ? 'Cupón actualizado' : 'Cupón creado')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el cupón')
    } finally {
      setIsLoading(false)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setValue('code', code)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {coupon ? 'Editar Cupón' : 'Nuevo Cupón'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Código y descripción */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Código del cupón</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="DESCUENTO10"
                  className="uppercase"
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Generar
                </Button>
              </div>
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Cupón de bienvenida"
              />
            </div>
          </div>

          {/* Tipo y valor de descuento */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Tipo de descuento</Label>
              <select
                {...register('discount_type')}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="discount_value">
                Valor {discountType === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step={discountType === 'percentage' ? '1' : '0.01'}
                {...register('discount_value', { valueAsNumber: true })}
              />
              {errors.discount_value && (
                <p className="mt-1 text-xs text-red-500">{errors.discount_value.message}</p>
              )}
            </div>
            {discountType === 'percentage' && (
              <div>
                <Label htmlFor="max_discount_amount">Descuento máximo ($)</Label>
                <Input
                  id="max_discount_amount"
                  type="number"
                  step="0.01"
                  {...register('max_discount_amount', { valueAsNumber: true })}
                  placeholder="Sin límite"
                />
              </div>
            )}
          </div>

          {/* Requisitos */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="min_purchase_amount">Compra mínima ($)</Label>
              <Input
                id="min_purchase_amount"
                type="number"
                step="0.01"
                {...register('min_purchase_amount', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="usage_limit_per_user">Usos por usuario</Label>
              <Input
                id="usage_limit_per_user"
                type="number"
                {...register('usage_limit_per_user', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Límites */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="usage_limit">Límite total de usos</Label>
              <Input
                id="usage_limit"
                type="number"
                {...register('usage_limit', { valueAsNumber: true })}
                placeholder="Sin límite"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="first_purchase_only"
                checked={firstPurchaseOnly}
                onCheckedChange={(checked) => setValue('first_purchase_only', !!checked)}
              />
              <Label htmlFor="first_purchase_only" className="cursor-pointer">
                Solo primera compra
              </Label>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="starts_at">Fecha de inicio</Label>
              <Input
                id="starts_at"
                type="date"
                {...register('starts_at')}
              />
            </div>
            <div>
              <Label htmlFor="expires_at">Fecha de expiración</Label>
              <Input
                id="expires_at"
                type="date"
                {...register('expires_at')}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              {...register('is_active')}
              defaultChecked={true}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Cupón activo
            </Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {coupon ? 'Actualizar' : 'Crear Cupón'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
