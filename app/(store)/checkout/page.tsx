'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  FileText,
  ChevronRight,
  Mail,
  Phone,
  Home,
  Building2,
  MapPinned,
  Lock,
  ShieldCheck,
  Check,
  Truck,
  Clock,
  Gift,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CartSummary } from '@/components/store/cart-summary'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import { useCart, useCartStore, type ShippingInfo } from '@/hooks/use-cart'
import { processCheckout } from '@/actions/checkout'
import { checkoutFormSchema, type CheckoutFormInput } from '@/schemas/checkout.schema'
import { ROUTES } from '@/lib/constants/routes'
import type { PaymentMethod } from '@/schemas/order.schema'
import { getDepartmentNames, getLocalitiesByDepartment } from '@/lib/constants/uruguay-locations'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

const steps = [
  { id: 'contact', label: 'Contacto', icon: User },
  { id: 'shipping', label: 'Envío', icon: MapPin },
  { id: 'payment', label: 'Pago', icon: CreditCard },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemsCount, clearCart, discount, subtotal, shippingInfo } = useCart()
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const setShippingInfo = useCartStore((state) => state.setShippingInfo)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      address: {
        country: 'Uruguay',
      },
      paymentMethod: 'mercadopago',
    },
  })

  const customerEmail = watch('email')
  const departments = getDepartmentNames()

  // Update current step based on filled fields
  useEffect(() => {
    const name = watch('name')
    const email = watch('email')
    const phone = watch('phone')
    const street = watch('address.street')
    const city = watch('address.city')

    if (name && email && phone) {
      if (street && city) {
        setCurrentStep(2)
      } else {
        setCurrentStep(1)
      }
    } else {
      setCurrentStep(0)
    }
  }, [watch('name'), watch('email'), watch('phone'), watch('address.street'), watch('address.city')])

  // Update localities and calculate shipping when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const localities = getLocalitiesByDepartment(selectedDepartment)
      setAvailableLocalities(localities)

      // Calculate shipping cost
      const calculateShippingCost = async () => {
        setIsLoadingShipping(true)
        try {
          const response = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              department: selectedDepartment,
              subtotal,
            }),
          })
          const result = await response.json()
          if (result.success && result.data) {
            setShippingInfo({
              cost: result.data.cost,
              isFreeShipping: result.data.isFreeShipping,
              estimatedDaysMin: result.data.estimatedDaysMin,
              estimatedDaysMax: result.data.estimatedDaysMax,
              department: result.data.department,
            })
          }
        } catch (error) {
          console.error('Error calculating shipping:', error)
        } finally {
          setIsLoadingShipping(false)
        }
      }
      calculateShippingCost()
    } else {
      setAvailableLocalities([])
      setShippingInfo(null)
    }
  }, [selectedDepartment, subtotal, setShippingInfo])

  if (itemsCount === 0) {
    router.push(ROUTES.CART)
    return null
  }

  const onSubmit = async (data: CheckoutFormInput) => {
    setIsLoading(true)

    try {
      const result = await processCheckout({
        customer: data,
        items: items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
        })),
        coupon: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          discountAmount: discount,
        } : undefined,
      })

      if (!result.success || !result.data) {
        toast.error(result.error || 'Error al procesar el checkout')
        return
      }

      clearCart()

      if (result.data.paymentMethod === 'mercadopago' && result.data.initPoint) {
        window.location.href = result.data.initPoint
      } else if (result.data.redirectUrl) {
        router.push(result.data.redirectUrl)
      } else {
        router.push(`/checkout/success?order_id=${result.data.orderId}`)
      }
    } catch (error) {
      toast.error('Error al procesar el pago')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.CART}
            className="mb-4 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                Checkout
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Completa tu compra de forma segura
              </p>
            </div>

            {/* Security Badge */}
            <Badge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4" />
              Compra 100% segura
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < currentStep
                const isActive = index === currentStep

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                      )}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <p className={cn(
                          "text-sm font-medium",
                          isActive || isCompleted
                            ? "text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-400"
                        )}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-4",
                        isCompleted
                          ? "bg-emerald-500"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact info */}
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <CardContent className="p-0">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          Información de contacto
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Te enviaremos actualizaciones sobre tu pedido
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-zinc-400" />
                          Nombre completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Juan Pérez"
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-zinc-400" />
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="juan@ejemplo.com"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-zinc-400" />
                          Teléfono <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          placeholder="099 123 456"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping address */}
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardContent className="p-0">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          Dirección de envío
                        </h2>
                        <p className="text-sm text-zinc-500">
                          ¿Dónde te enviamos tu pedido?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="street" className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-zinc-400" />
                          Calle <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="street"
                          {...register('address.street')}
                          placeholder="Av. 18 de Julio"
                          className={errors.address?.street ? 'border-red-500' : ''}
                        />
                        {errors.address?.street && (
                          <p className="text-sm text-red-500">{errors.address.street.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number" className="flex items-center gap-2">
                          Número <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="number"
                          {...register('address.number')}
                          placeholder="1234"
                          className={errors.address?.number ? 'border-red-500' : ''}
                        />
                        {errors.address?.number && (
                          <p className="text-sm text-red-500">{errors.address.number.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apartment" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-zinc-400" />
                          Apartamento
                        </Label>
                        <Input
                          id="apartment"
                          {...register('address.apartment')}
                          placeholder="Ej: Apto 101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor">Piso</Label>
                        <Input
                          id="floor"
                          {...register('address.floor')}
                          placeholder="Ej: 3"
                        />
                      </div>

                      {/* Departamento */}
                      <div className="space-y-2">
                        <Label htmlFor="department" className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-zinc-400" />
                          Departamento <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="address.state"
                          control={control}
                          render={({ field }) => (
                            <SelectRoot
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedDepartment(value)
                                setValue('address.city', '')
                              }}
                            >
                              <SelectTrigger
                                id="department"
                                className={errors.address?.state ? 'border-red-500' : ''}
                              >
                                <SelectValue placeholder="Selecciona un departamento" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          )}
                        />
                        {errors.address?.state && (
                          <p className="text-sm text-red-500">{errors.address.state.message}</p>
                        )}
                      </div>

                      {/* Localidad */}
                      <div className="space-y-2">
                        <Label htmlFor="locality" className="flex items-center gap-2">
                          Ciudad/Localidad <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="address.city"
                          control={control}
                          render={({ field }) => (
                            <SelectRoot value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger
                                id="locality"
                                className={errors.address?.city ? 'border-red-500' : ''}
                                disabled={!selectedDepartment}
                              >
                                <SelectValue
                                  placeholder={selectedDepartment ? 'Selecciona una localidad' : 'Primero selecciona un departamento'}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLocalities.map((locality) => (
                                  <SelectItem key={locality} value={locality}>
                                    {locality}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectRoot>
                          )}
                        />
                        {errors.address?.city && (
                          <p className="text-sm text-red-500">{errors.address.city.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Código postal</Label>
                        <Input
                          id="postal_code"
                          {...register('address.postal_code')}
                          placeholder="Ej: 11000"
                          className={errors.address?.postal_code ? 'border-red-500' : ''}
                        />
                        {errors.address?.postal_code && (
                          <p className="text-sm text-red-500">{errors.address.postal_code.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Shipping Info Card */}
                    {selectedDepartment && (
                      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                        {isLoadingShipping ? (
                          <div className="flex items-center gap-3 text-zinc-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculando costo de envío...</span>
                          </div>
                        ) : shippingInfo ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                  Envío a {shippingInfo.department}
                                </span>
                              </div>
                              {shippingInfo.isFreeShipping ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                                  <Gift className="h-3 w-3" />
                                  Gratis
                                </Badge>
                              ) : (
                                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                  ${shippingInfo.cost.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              <Clock className="h-4 w-4" />
                              <span>
                                Entrega estimada: {shippingInfo.estimatedDaysMin === shippingInfo.estimatedDaysMax
                                  ? `${shippingInfo.estimatedDaysMin} día${shippingInfo.estimatedDaysMin !== 1 ? 's' : ''} hábil${shippingInfo.estimatedDaysMin !== 1 ? 'es' : ''}`
                                  : `${shippingInfo.estimatedDaysMin}-${shippingInfo.estimatedDaysMax} días hábiles`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Truck className="h-5 w-5" />
                            <span>No se pudo calcular el envío</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardContent className="p-0">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          Notas adicionales
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Instrucciones especiales para la entrega (opcional)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Textarea
                      placeholder="Ej: Dejar con el portero, timbre 3B, etc..."
                      {...register('notes')}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardContent className="p-0">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          Método de pago
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Elige cómo quieres pagar
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <PaymentMethodSelector
                      selectedMethod={selectedPaymentMethod}
                      onSelectMethod={(method) => {
                        setSelectedPaymentMethod(method)
                        setValue('paymentMethod', method)
                      }}
                      onPaymentProofUrl={(url) => {
                        setValue('paymentProofUrl', url)
                      }}
                    />
                    {errors.paymentMethod && (
                      <p className="mt-2 text-sm text-red-500">{errors.paymentMethod.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <CartSummary showCheckoutButton={false} customerEmail={customerEmail} />

                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardContent className="p-4">
                    <Button
                      type="submit"
                      size="lg"
                      className={cn(
                        "w-full gap-2 text-base font-semibold",
                        selectedPaymentMethod === 'mercadopago' && "bg-[#009EE3] hover:bg-[#0087c9]"
                      )}
                      disabled={isLoading || !selectedPaymentMethod}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : selectedPaymentMethod === 'mercadopago' ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Pagar con Mercado Pago
                        </>
                      ) : selectedPaymentMethod === 'bank_transfer' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Confirmar Pedido
                        </>
                      ) : selectedPaymentMethod === 'cash_on_delivery' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Confirmar Pedido
                        </>
                      ) : (
                        'Selecciona un método de pago'
                      )}
                    </Button>

                    {selectedPaymentMethod && (
                      <p className="mt-3 text-center text-xs text-zinc-500">
                        {selectedPaymentMethod === 'mercadopago' && (
                          <>
                            <Lock className="inline h-3 w-3 mr-1" />
                            Serás redirigido a Mercado Pago para completar el pago de forma segura
                          </>
                        )}
                        {selectedPaymentMethod === 'bank_transfer' && (
                          'Recibirás las instrucciones para realizar la transferencia'
                        )}
                        {selectedPaymentMethod === 'cash_on_delivery' && (
                          'Pagarás en efectivo cuando recibas tu pedido'
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <Card className="overflow-hidden border-0 shadow-sm bg-zinc-50 dark:bg-zinc-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Compra segura</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-blue-500" />
                        <span>Datos protegidos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
