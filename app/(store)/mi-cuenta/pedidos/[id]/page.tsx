import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerOrderDetails } from '@/components/store/CustomerOrderDetails'
import { getOrderWithItems } from '@/actions/orders'
import { auth } from '@/lib/auth/config'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getOrderWithItems(id)

  return {
    title: result?.order
      ? `Pedido #${result.order.order_number}`
      : 'Pedido no encontrado',
    description: 'Detalles de tu pedido',
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const result = await getOrderWithItems(id)

  if (!result) {
    notFound()
  }

  // Verificar que el pedido pertenece al usuario actual (comparar por email)
  if (result.order.customer_email !== session.user.email) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/mi-cuenta/pedidos">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a mis pedidos
        </Button>
      </Link>

      {/* Order details */}
      <CustomerOrderDetails order={result.order} items={result.items} />
    </div>
  )
}
