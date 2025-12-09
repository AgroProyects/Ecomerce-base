'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  Sparkles,
  Percent,
  DollarSign,
  Calendar,
  Users,
  ShoppingCart,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [activeTab, setActiveTab] = useState('basic')

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
  const discountValue = watch('discount_value')
  const firstPurchaseOnly = watch('first_purchase_only')
  const isActive = watch('is_active')

  useEffect(() => {
    if (open) {
      setActiveTab('basic')
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
    }
  }, [coupon, reset, open])

  const onSubmit = async (data: CouponFormData) => {
    setIsLoading(true)
    try {
      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons'
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

      toast.success(coupon ? 'Cupón actualizado correctamente' : 'Cupón creado correctamente')
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

  // Preview del descuento
  const getDiscountPreview = () => {
    if (!discountValue) return null
    if (discountType === 'percentage') {
      return `${discountValue}% de descuento`
    }
    return `$${discountValue.toLocaleString('es-AR')} de descuento`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {coupon ? (
              <>
                <Percent className="h-5 w-5 text-primary" />
                Editar Cupón
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Nuevo Cupón
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {coupon
              ? 'Modifica los detalles del cupón de descuento'
              : 'Crea un nuevo cupón promocional para tu tienda'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="gap-2">
                <Percent className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="limits" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Límites</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Vigencia</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Básico */}
            <TabsContent value="basic" className="space-y-6 mt-0">
              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="code">Código del cupón</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder="DESCUENTO10"
                    className="uppercase font-mono text-lg"
                  />
                  <Button type="button" variant="outline" onClick={generateCode} className="shrink-0">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Ej: Cupón de bienvenida para nuevos clientes"
                  rows={2}
                />
              </div>

              {/* Tipo de descuento */}
              <div className="space-y-3">
                <Label>Tipo de descuento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('discount_type', 'percentage')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      discountType === 'percentage'
                        ? 'border-primary bg-primary/5'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          discountType === 'percentage'
                            ? 'bg-primary text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}
                      >
                        <Percent className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Porcentaje</p>
                        <p className="text-xs text-zinc-500">Descuento %</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('discount_type', 'fixed')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      discountType === 'fixed'
                        ? 'border-primary bg-primary/5'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          discountType === 'fixed'
                            ? 'bg-primary text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}
                      >
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Monto fijo</p>
                        <p className="text-xs text-zinc-500">Descuento $</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Valor y máximo */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor del descuento {discountType === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    max={discountType === 'percentage' ? 100 : undefined}
                    {...register('discount_value', { valueAsNumber: true })}
                    className="text-lg"
                  />
                  {errors.discount_value && (
                    <p className="text-xs text-red-500">{errors.discount_value.message}</p>
                  )}
                </div>
                {discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount_amount">
                      Descuento máximo ($)
                      <span className="text-zinc-400 ml-1">(opcional)</span>
                    </Label>
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

              {/* Preview */}
              {getDiscountPreview() && (
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        {discountType === 'percentage' ? (
                          <Percent className="h-5 w-5 text-primary" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Vista previa</p>
                        <p className="font-semibold text-lg text-primary">{getDiscountPreview()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Límites */}
            <TabsContent value="limits" className="space-y-6 mt-0">
              {/* Compra mínima */}
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Compra mínima ($)
                </Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  step="0.01"
                  {...register('min_purchase_amount', { valueAsNumber: true })}
                  placeholder="0 = Sin mínimo"
                />
                <p className="text-xs text-zinc-500">
                  Monto mínimo del carrito para aplicar el cupón
                </p>
              </div>

              {/* Límites de uso */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Límite total de usos</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    {...register('usage_limit', { valueAsNumber: true })}
                    placeholder="Sin límite"
                  />
                  <p className="text-xs text-zinc-500">
                    Cuántas veces se puede usar en total
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage_limit_per_user">Usos por cliente</Label>
                  <Input
                    id="usage_limit_per_user"
                    type="number"
                    {...register('usage_limit_per_user', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-500">
                    Cuántas veces puede usarlo cada cliente
                  </p>
                </div>
              </div>

              {/* Primera compra */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">Solo primera compra</p>
                        <p className="text-sm text-zinc-500">
                          Solo válido para clientes nuevos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={firstPurchaseOnly || false}
                      onCheckedChange={(checked) => setValue('first_purchase_only', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Vigencia */}
            <TabsContent value="schedule" className="space-y-6 mt-0">
              {/* Fechas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts_at" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de inicio
                  </Label>
                  <Input
                    id="starts_at"
                    type="date"
                    {...register('starts_at')}
                  />
                  <p className="text-xs text-zinc-500">
                    Dejar vacío para activar inmediatamente
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de expiración
                  </Label>
                  <Input
                    id="expires_at"
                    type="date"
                    {...register('expires_at')}
                  />
                  <p className="text-xs text-zinc-500">
                    Dejar vacío para que no expire
                  </p>
                </div>
              </div>

              {/* Estado */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`h-3 w-3 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isActive ? 'Cupón activo' : 'Cupón inactivo'}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {isActive
                            ? 'Los clientes pueden usar este cupón'
                            : 'El cupón no está disponible para uso'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isActive || false}
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Sobre la vigencia</p>
                  <p>
                    Si configuras una fecha de inicio futura, el cupón se mostrará como
                    &quot;Programado&quot; hasta esa fecha. Si expira, se marcará como
                    &quot;Expirado&quot; automáticamente.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {coupon ? 'Actualizar Cupón' : 'Crear Cupón'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
