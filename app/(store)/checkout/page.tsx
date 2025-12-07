'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CartSummary } from '@/components/store/cart-summary'
import { useCart, useCartStore } from '@/hooks/use-cart'
import { processCheckout } from '@/actions/checkout'
import { checkoutFormSchema, type CheckoutFormInput } from '@/schemas/checkout.schema'
import { ROUTES } from '@/lib/constants/routes'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, itemsCount, clearCart, discount } = useCart()
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      address: {
        country: 'Argentina',
      },
    },
  })

  const customerEmail = watch('email')

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

      // Redirect to Mercado Pago
      if (result.data.initPoint) {
        clearCart()
        window.location.href = result.data.initPoint
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
                  label="Departamento (opcional)"
                  {...register('address.apartment')}
                />
                <Input
                  label="Ciudad"
                  {...register('address.city')}
                  error={errors.address?.city?.message}
                />
                <Input
                  label="Provincia"
                  {...register('address.state')}
                  error={errors.address?.state?.message}
                />
                <Input
                  label="Código postal"
                  {...register('address.zipCode')}
                  error={errors.address?.zipCode?.message}
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
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary showCheckoutButton={false} customerEmail={customerEmail} />
              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Pagar con Mercado Pago'
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Serás redirigido a Mercado Pago para completar el pago
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
