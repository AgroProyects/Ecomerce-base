'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CartSummary } from '@/components/store/cart-summary'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import { useCart, useCartStore } from '@/hooks/use-cart'
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

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemsCount, clearCart, discount } = useCart()
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([])

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

  // Actualizar localidades cuando cambia el departamento
  useEffect(() => {
    if (selectedDepartment) {
      const localities = getLocalitiesByDepartment(selectedDepartment)
      setAvailableLocalities(localities)
    } else {
      setAvailableLocalities([])
    }
  }, [selectedDepartment])

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

      // Limpiar carrito
      clearCart()

      // Redirigir según método de pago
      if (result.data.paymentMethod === 'mercadopago' && result.data.initPoint) {
        // Mercado Pago - redirigir a checkout
        window.location.href = result.data.initPoint
      } else if (result.data.redirectUrl) {
        // Otros métodos - redirigir a página de instrucciones/confirmación
        router.push(result.data.redirectUrl)
      } else {
        // Fallback - ir a página de éxito
        router.push(`/checkout/success?order_id=${result.data.orderId}`)
      }
    } catch (error) {
      toast.error('Error al procesar el pago')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={ROUTES.CART}
        className="mb-6 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al carrito
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Checkout
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="space-y-8 lg:col-span-2">
            {/* Contact info */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Información de contacto
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre completo"
                  {...register('name')}
                  error={errors.name?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Shipping address */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Dirección de envío
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Calle"
                  {...register('address.street')}
                  error={errors.address?.street?.message}
                />
                <Input
                  label="Número"
                  {...register('address.number')}
                  error={errors.address?.number?.message}
                />
                <Input
                  label="Apartamento (opcional)"
                  {...register('address.apartment')}
                  placeholder="Ej: Apto 101"
                />
                <Input
                  label="Piso (opcional)"
                  {...register('address.floor')}
                  placeholder="Ej: 3"
                />

                {/* Departamento */}
                <div className="space-y-2">
                  <Label htmlFor="department">
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
                          setValue('address.city', '') // Reset city when department changes
                        }}
                      >
                        <SelectTrigger id="department" className={errors.address?.state ? 'border-red-500' : ''}>
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
                  <Label htmlFor="locality">
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

                <Input
                  label="Código postal"
                  {...register('address.postal_code')}
                  error={errors.address?.postal_code?.message}
                  placeholder="Ej: 11000"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Notas adicionales
              </h2>
              <Textarea
                placeholder="Instrucciones especiales para la entrega..."
                {...register('notes')}
              />
            </div>

            {/* Payment Method */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
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
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary showCheckoutButton={false} customerEmail={customerEmail} />
              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full"
                disabled={isLoading || !selectedPaymentMethod}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : selectedPaymentMethod === 'mercadopago' ? (
                  'Pagar con Mercado Pago'
                ) : selectedPaymentMethod === 'bank_transfer' ? (
                  'Confirmar Pedido'
                ) : selectedPaymentMethod === 'cash_on_delivery' ? (
                  'Confirmar Pedido'
                ) : (
                  'Selecciona un método de pago'
                )}
              </Button>
              {selectedPaymentMethod === 'mercadopago' && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Serás redirigido a Mercado Pago para completar el pago
                </p>
              )}
              {selectedPaymentMethod === 'bank_transfer' && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Recibirás las instrucciones para realizar la transferencia
                </p>
              )}
              {selectedPaymentMethod === 'cash_on_delivery' && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Pagarás en efectivo cuando recibas tu pedido
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
