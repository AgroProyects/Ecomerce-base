'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  Receipt,
  Clock,
  Calendar,
  Phone,
  Mail,
  Hash,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  updateOrderStatus,
  updateOrderNotes,
} from '@/actions/orders';
import type { Order } from '@/types/database';
import type { OrderItemWithProduct } from '@/actions/orders/queries';
import type { OrderStatus, PaymentMethod } from '@/schemas/order.schema';
import { cn } from '@/lib/utils/cn';

interface OrderDetailsProps {
  order: Order;
  items: OrderItemWithProduct[];
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia Bancaria',
  cash_on_delivery: 'Efectivo contra entrega',
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  mercadopago: '💳',
  bank_transfer: '🏦',
  cash_on_delivery: '💵',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500',
  pending_payment: 'bg-orange-500',
  paid: 'bg-blue-500',
  processing: 'bg-indigo-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  refunded: 'bg-gray-500',
};

export function OrderDetails({ order, items }: OrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const shippingAddress = order.shipping_address as any;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
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

  // Timeline del pedido
  const getOrderTimeline = (): { status: string; label: string; date: string | null }[] => {
    const timeline: { status: string; label: string; date: string | null }[] = [
      { status: 'pending', label: 'Pendiente', date: order.created_at },
    ];

    if (['pending_payment', 'paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({ status: 'pending_payment', label: 'Esperando Pago', date: null });
    }

    if (['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({ status: 'paid', label: 'Pagado', date: order.paid_at });
    }

    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({ status: 'processing', label: 'Procesando', date: null });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      timeline.push({ status: 'shipped', label: 'Enviado', date: null });
    }

    if (order.status === 'delivered') {
      timeline.push({ status: 'delivered', label: 'Entregado', date: null });
    }

    return timeline;
  };

  const timeline = getOrderTimeline();
  const currentStatusIndex = timeline.findIndex((t) => t.status === order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Pedido #{order.order_number}
            </h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(order.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(order.order_number, 'order')}
          >
            {copiedField === 'order' ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            Copiar N°
          </Button>
        </div>
      </div>

      {/* Timeline del estado - Solo mostrar si no está cancelado/reembolsado */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative">
              {/* Línea de progreso */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
                style={{
                  width: `${(currentStatusIndex / (timeline.length - 1)) * 100}%`,
                }}
              />

              {timeline.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.status} className="flex flex-col items-center z-10">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        isCompleted
                          ? 'bg-primary text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400',
                        isCurrent && 'ring-4 ring-primary/20'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 font-medium',
                        isCompleted ? 'text-primary' : 'text-zinc-400'
                      )}
                    >
                      {step.label}
                    </span>
                    {step.date && (
                      <span className="text-xs text-zinc-400 mt-0.5">
                        {formatDateShort(step.date)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado cancelado/reembolsado */}
      {['cancelled', 'refunded'].includes(order.status) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  Pedido {order.status === 'cancelled' ? 'Cancelado' : 'Reembolsado'}
                </p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70">
                  Este pedido fue {order.status === 'cancelled' ? 'cancelado' : 'reembolsado'} el{' '}
                  {formatDate(order.updated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal - Productos y resumen */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Productos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex gap-4">
                      {/* Imagen del producto */}
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-8 w-8 text-zinc-400" />
                          </div>
                        )}
                      </div>

                      {/* Info del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                              {item.product_name}
                            </h4>
                            {item.variant_name && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {item.variant_name}
                              </Badge>
                            )}
                          </div>
                          {item.product_slug && (
                            <Link
                              href={`/products/${item.product_slug}`}
                              target="_blank"
                              className="text-zinc-400 hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-zinc-500">
                            Precio: <span className="text-zinc-700 dark:text-zinc-300">{formatCurrency(item.unit_price)}</span>
                          </span>
                          <span className="text-zinc-500">
                            Cantidad: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.quantity}</span>
                          </span>
                        </div>

                        <div className="mt-2 text-right sm:text-left">
                          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de totales */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>

                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Envío
                    </span>
                    <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      Descuento
                      {order.coupon_code && (
                        <Badge variant="outline" className="text-xs">
                          {order.coupon_code}
                        </Badge>
                      )}
                    </span>
                    <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nota del cliente
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    {order.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Notas internas (solo visible para administradores)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agregar notas internas sobre este pedido..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="mt-3"
                  size="sm"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Notas'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{order.customer_name}</span>
              </div>

              <div className="space-y-2 text-sm">
                <button
                  onClick={() => copyToClipboard(order.customer_email, 'email')}
                  className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors w-full group"
                >
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{order.customer_email}</span>
                  {copiedField === 'email' ? (
                    <Check className="h-3 w-3 ml-auto text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                {order.customer_phone && (
                  <button
                    onClick={() => copyToClipboard(order.customer_phone!, 'phone')}
                    className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors w-full group"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{order.customer_phone}</span>
                    {copiedField === 'phone' ? (
                      <Check className="h-3 w-3 ml-auto text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dirección de envío */}
          {shippingAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {shippingAddress.street} {shippingAddress.number}
                  </p>
                  {(shippingAddress.floor || shippingAddress.apartment) && (
                    <p className="text-zinc-500">
                      {shippingAddress.floor && `Piso ${shippingAddress.floor}`}
                      {shippingAddress.floor && shippingAddress.apartment && ', '}
                      {shippingAddress.apartment && `Depto ${shippingAddress.apartment}`}
                    </p>
                  )}
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {shippingAddress.city}, {shippingAddress.state}
                  </p>
                  <p className="text-zinc-500">
                    CP {shippingAddress.postal_code} - {shippingAddress.country}
                  </p>
                  {shippingAddress.additional_info && (
                    <p className="text-zinc-500 mt-2 italic text-xs">
                      "{shippingAddress.additional_info}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Método de pago */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5 text-primary" />
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {order.payment_method && PAYMENT_METHOD_ICONS[order.payment_method as PaymentMethod]}
                </span>
                <span className="font-medium">
                  {order.payment_method
                    ? PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]
                    : '-'}
                </span>
              </div>

              {order.paid_at && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Pagado el {formatDateShort(order.paid_at)}</span>
                </div>
              )}

              {order.payment_proof_url && (
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Receipt className="h-4 w-4" />
                  Ver comprobante
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>

          {/* Gestión de estado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Gestión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-700 dark:text-zinc-300">
                  Cambiar Estado
                </label>
                <SelectRoot
                  value={order.status}
                  onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                >
                  <SelectTrigger disabled={isPending} className="w-full">
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
                </SelectRoot>
              </div>

              {/* Acciones rápidas */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Acciones rápidas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {order.status !== 'paid' && !['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('paid')}
                      disabled={isPending}
                      className="h-9"
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      Pagado
                    </Button>
                  )}
                  {order.status === 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('processing')}
                      disabled={isPending}
                      className="h-9"
                    >
                      <Package className="h-4 w-4 mr-1 text-indigo-500" />
                      Procesar
                    </Button>
                  )}
                  {(order.status === 'processing' || order.status === 'paid') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('shipped')}
                      disabled={isPending}
                      className="h-9"
                    >
                      <Truck className="h-4 w-4 mr-1 text-purple-500" />
                      Enviado
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('delivered')}
                      disabled={isPending}
                      className="h-9"
                    >
                      <PackageCheck className="h-4 w-4 mr-1 text-green-500" />
                      Entregado
                    </Button>
                  )}
                  {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={isPending}
                      className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {isPending && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Actualizando...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
