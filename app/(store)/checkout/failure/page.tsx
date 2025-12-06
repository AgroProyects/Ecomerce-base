import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants/routes'

interface FailurePageProps {
  searchParams: Promise<{
    order_id?: string
  }>
}

export default async function CheckoutFailurePage({ searchParams }: FailurePageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          El pago no pudo procesarse
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Hubo un problema con tu pago. Por favor, intentá nuevamente o usá otro método de pago.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild>
            <Link href={ROUTES.CHECKOUT}>Intentar nuevamente</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.CART}>Volver al carrito</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
