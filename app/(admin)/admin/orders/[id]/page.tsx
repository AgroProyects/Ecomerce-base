import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetails } from '@/components/admin/OrderDetails';
import { getOrderWithItems } from '@/actions/orders';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getOrderWithItems(id);

  return {
    title: result?.order
      ? `Orden #${result.order.order_number} | Admin`
      : 'Orden no encontrada',
    description: 'Detalles de la orden',
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const result = await getOrderWithItems(id);

  if (!result) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/admin/orders">
        <Button variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a pedidos
        </Button>
      </Link>

      {/* Order details */}
      <OrderDetails order={result.order} items={result.items} />
    </div>
  );
}
