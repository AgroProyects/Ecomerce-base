'use server';

import { queueOrderConfirmationEmail, queueOrderStatusEmail } from '@/lib/queue/email-queue';
import type { Order, OrderItem } from '@/types/database';
import type { OrderStatus } from '@/schemas/order.schema';

interface SendOrderConfirmationParams {
  order: Order;
  items: OrderItem[];
  storeName?: string;
  storeUrl?: string;
}

/**
 * Envía email de confirmación de orden usando queue (asíncrono)
 * @deprecated - Migrado a email queue para mejor manejo de errores y reintentos
 */
export async function sendOrderConfirmationEmail({
  order,
  items,
}: SendOrderConfirmationParams) {
  try {
    // Preparar tracking URL si existe
    const trackingUrl = order.tracking_number
      ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/track?number=${order.tracking_number}`
      : undefined;

    // Transformar items al formato requerido por la queue
    const queueItems = items.map((item) => ({
      name: item.product_name || 'Producto',
      quantity: item.quantity,
      price: item.unit_price,
    }));

    await queueOrderConfirmationEmail({
      to: order.customer_email,
      userName: order.customer_name,
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString('es-AR'),
      items: queueItems,
      subtotal: order.subtotal,
      shipping: order.shipping_cost,
      discount: order.discount_amount,
      total: order.total,
      trackingUrl,
    });

    console.log(`Order confirmation email queued for ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Error queueing order confirmation email:', error);
    return { success: false, error };
  }
}

interface SendOrderStatusUpdateParams {
  order: Order;
  newStatus: OrderStatus;
  storeName?: string;
  storeUrl?: string;
}

/**
 * Envía email de actualización de estado de orden usando queue (asíncrono)
 * @deprecated - Migrado a email queue para mejor manejo de errores y reintentos
 */
export async function sendOrderStatusUpdateEmail({
  order,
  newStatus,
}: SendOrderStatusUpdateParams) {
  try {
    const STATUS_MESSAGES: Record<OrderStatus, string> = {
      pending: 'Tu pedido está siendo revisado',
      pending_payment: 'Estamos esperando la confirmación de tu pago',
      paid: 'Tu pago fue confirmado',
      processing: 'Estamos preparando tu pedido',
      shipped: 'Tu pedido está en camino',
      delivered: 'Tu pedido fue entregado',
      cancelled: 'Tu pedido fue cancelado',
      refunded: 'Tu reembolso ha sido procesado',
    };

    const trackingUrl = order.tracking_number
      ? `${process.env.NEXT_PUBLIC_APP_URL}/orders/track?number=${order.tracking_number}`
      : undefined;

    // Mapear status a los valores aceptados por la queue
    const queueStatus =
      newStatus === 'shipped' || newStatus === 'delivered' || newStatus === 'cancelled'
        ? newStatus
        : 'processing';

    await queueOrderStatusEmail({
      to: order.customer_email,
      userName: order.customer_name,
      orderNumber: order.order_number,
      status: queueStatus,
      statusMessage: STATUS_MESSAGES[newStatus],
      trackingUrl,
    });

    console.log(`Order status update email queued for ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Error queueing order status update email:', error);
    return { success: false, error };
  }
}
