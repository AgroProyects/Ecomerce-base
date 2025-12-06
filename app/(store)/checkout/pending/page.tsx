import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'

interface PendingPageProps {
  searchParams: Promise<{
    order_id?: string
  }>
}

export default async function CheckoutPendingPage({ searchParams }: PendingPageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <Clock className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Pago pendiente
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
        </p>

        {params.order_id && (
          <p className="mt-4 text-sm text-zinc-500">
            Número de orden: <span className="font-mono font-medium">{params.order_id}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild>
            <Link href={ROUTES.PRODUCTS}>Seguir comprando</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.HOME}>Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
