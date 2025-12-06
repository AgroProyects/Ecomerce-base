'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'

interface CartSummaryProps {
  className?: string
  showCheckoutButton?: boolean
}

export function CartSummary({
  className,
  showCheckoutButton = true,
}: CartSummaryProps) {
  const { subtotal, shippingCost, discount, total, itemsCount } = useCart()

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
