import Link from 'next/link'
import { CheckCircle, Package, ShoppingBag, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/lib/constants/routes'
import { auth } from '@/lib/auth/config'

interface SuccessPageProps {
  searchParams: Promise<{
    order_id?: string
    payment_id?: string
  }>
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const session = await auth()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Title */}
              <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                ¡Pedido realizado con éxito!
              </h1>

              {/* Description */}
              <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
                Gracias por tu compra. Hemos enviado un email de confirmación con todos los detalles.
              </p>

              {/* Order ID */}
              {params.order_id && (
                <div className="mt-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Número de orden</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    #{params.order_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                {session && params.order_id && (
                  <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Link href={`/mi-cuenta/pedidos/${params.order_id}`} className="gap-2">
                      <Package className="h-5 w-5" />
                      Ver detalles del pedido
                    </Link>
                  </Button>
                )}

                <Button asChild variant="outline" size="lg">
                  <Link href={ROUTES.PRODUCTS} className="gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Seguir comprando
                  </Link>
                </Button>

                <Button asChild variant="ghost" size="lg">
                  <Link href={ROUTES.HOME} className="gap-2">
                    <Home className="h-5 w-5" />
                    Volver al inicio
                  </Link>
                </Button>
              </div>

              {/* Guest user message */}
              {!session && (
                <div className="mt-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    ¿Quieres hacer seguimiento de tu pedido?{' '}
                    <Link
                      href="/login"
                      className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Inicia sesión
                    </Link>{' '}
                    o{' '}
                    <Link
                      href="/register"
                      className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      crea una cuenta
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
