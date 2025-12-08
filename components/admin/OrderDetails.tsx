'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  updateOrderStatus,
  updateOrderNotes,
} from '@/actions/orders';
import type { Order, OrderItem } from '@/types/database';
import type { OrderStatus, PaymentMethod } from '@/schemas/order.schema';

interface OrderDetailsProps {
  order: Order;
  items: OrderItem[];
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia Bancaria',
  cash_on_delivery: 'Efectivo contra entrega',
};

export function OrderDetails({ order, items }: OrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const shippingAddress = order.shipping_address as any;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus({
        id: order.id,
        status: newStatus,
      });

      if (result.success) {
        toast.success('Estado actualizado exitosamente');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al actualizar el estado');
      }
    });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const result = await updateOrderNotes({
      id: order.id,
      notes: adminNotes,
    });
    setIsSavingNotes(false);

    if (result.success) {
      toast.success('Notas guardadas');
      router.refresh();
    } else {
      toast.error(result.error || 'Error al guardar las notas');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con número de orden y estado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orden #{order.order_number}</h1>
          <p className="text-zinc-500 mt-1">Creada el {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-zinc-500">Nombre</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Email</p>
              <p className="font-medium">{order.customer_email}</p>
            </div>
            {order.customer_phone && (
              <div>
                <p className="text-sm text-zinc-500">Teléfono</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dirección de envío */}
        {shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {shippingAddress.street} {shippingAddress.number}
                {shippingAddress.floor && `, Piso ${shippingAddress.floor}`}
                {shippingAddress.apartment && `, Depto ${shippingAddress.apartment}`}
              </p>
              <p>
                {shippingAddress.city}, {shippingAddress.state}
              </p>
              <p>{shippingAddress.postal_code}</p>
              <p>{shippingAddress.country}</p>
              {shippingAddress.additional_info && (
                <p className="text-sm text-zinc-500 mt-2">
                  {shippingAddress.additional_info}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Método de pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-zinc-500">Método</p>
              <p className="font-medium">
                {order.payment_method
                  ? PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]
                  : '-'}
              </p>
            </div>

            {order.payment_proof_url && (
              <div>
                <p className="text-sm text-zinc-500 mb-2">Comprobante de Pago</p>
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Receipt className="h-4 w-4" />
                  Ver comprobante
                </a>
              </div>
            )}

            {order.paid_at && (
              <div>
                <p className="text-sm text-zinc-500">Fecha de pago</p>
                <p className="font-medium">{formatDate(order.paid_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cambiar estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestión de Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cambiar Estado
              </label>
              <Select
                value={order.status}
                onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="pending_payment">Esperando Pago</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-wrap">
              {order.status !== 'paid' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('paid')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar pagado
                </Button>
              )}
              {order.status === 'paid' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('processing')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Procesar
                </Button>
              )}
              {(order.status === 'processing' || order.status === 'paid') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('shipped')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Marcar enviado
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('delivered')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <PackageCheck className="h-4 w-4 mr-1" />
                  Marcar entregado
                </Button>
              )}
              {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items de la orden */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  {item.variant_name && (
                    <p className="text-sm text-zinc-500">{item.variant_name}</p>
                  )}
                  <p className="text-sm text-zinc-600">
                    Cantidad: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.total_price)}</p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shipping_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Envío</span>
                <span>{formatCurrency(order.shipping_cost)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.notes && (
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Notas del cliente</p>
              <p className="text-sm bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md">
                {order.notes}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-zinc-500 mb-2 block">
              Notas internas (solo visible para el admin)
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Agregar notas internas sobre este pedido..."
              rows={4}
            />
            <Button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="mt-2"
              size="sm"
            >
              {isSavingNotes ? 'Guardando...' : 'Guardar Notas'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
