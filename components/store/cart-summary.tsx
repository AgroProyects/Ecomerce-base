'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Tag, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart, useCartStore } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'
import { toast } from 'sonner'

interface CartSummaryProps {
  className?: string
  showCheckoutButton?: boolean
  showCouponInput?: boolean
  customerEmail?: string
}

export function CartSummary({
  className,
  showCheckoutButton = true,
  showCouponInput = true,
  customerEmail = '',
}: CartSummaryProps) {
  const { subtotal, shippingCost, discount, total, itemsCount } = useCart()
  const appliedCoupon = useCartStore((state) => state.appliedCoupon)
  const applyCoupon = useCartStore((state) => state.applyCoupon)
  const removeCoupon = useCartStore((state) => state.removeCoupon)

  const [couponCode, setCouponCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [couponError, setCouponError] = useState('')

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsValidating(true)
    setCouponError('')

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          email: customerEmail || 'guest@example.com',
          subtotal,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setCouponError(errorData.error || 'Error al validar el cupón. Intentá nuevamente.')
        return
      }

      const data = await response.json()

      if (data.valid && data.coupon) {
        applyCoupon(data.coupon)
        setCouponCode('')
        toast.success('Cupón aplicado correctamente')
      } else {
        setCouponError(data.error || 'Cupón no válido')
      }
    } catch (error) {
      setCouponError('Error de conexión. Verificá tu internet e intentá nuevamente.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    toast.success('Cupón eliminado')
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Resumen del pedido
      </h3>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            Subtotal ({itemsCount} {itemsCount === 1 ? 'producto' : 'productos'})
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatPrice(subtotal)}
          </span>
        </div>

        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Envío</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(shippingCost)}
            </span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Descuento</span>
            <span className="font-medium text-green-600">
              -{formatPrice(discount)}
            </span>
          </div>
        )}

        {/* Cupón aplicado */}
        {appliedCoupon && (
          <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {appliedCoupon.code}
              </span>
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <button
              onClick={handleRemoveCoupon}
              aria-label="Quitar cupón"
              className="rounded-full p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input de cupón */}
        {showCouponInput && !appliedCoupon && (
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex gap-2">
              <Input
                placeholder="Código de cupón"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  setCouponError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={isValidating || !couponCode.trim()}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
            {couponError && (
              <p role="alert" className="mt-1 text-xs text-red-500">{couponError}</p>
            )}
          </div>
        )}

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Total
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {showCheckoutButton && (
        <Button
          asChild
          className="mt-6 w-full"
          size="lg"
          disabled={itemsCount === 0}
        >
          <Link href={ROUTES.CHECKOUT}>Finalizar compra</Link>
        </Button>
      )}
    </div>
  )
}
