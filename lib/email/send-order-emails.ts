'use server';

import { render } from '@react-email/render';
import { sendEmail } from './send-email';
import OrderConfirmationEmail from './templates/order-confirmation';
import OrderStatusUpdateEmail from './templates/order-status-update';
import type { Order, OrderItem } from '@/types/database';
import type { OrderStatus } from '@/schemas/order.schema';

interface SendOrderConfirmationParams {
  order: Order;
  items: OrderItem[];
  storeName?: string;
  storeUrl?: string;
}

/**
 * Envía email de confirmación de orden
 */
export async function sendOrderConfirmationEmail({
  order,
  items,
  storeName,
  storeUrl,
}: SendOrderConfirmationParams) {
  try {
    const emailHtml = await render(
      OrderConfirmationEmail({
        order,
        items,
        storeName,
        storeUrl,
      })
    );

    await sendEmail({
      to: order.customer_email,
      subject: `Confirmación de tu pedido #${order.order_number}`,
      html: emailHtml,
    });

    console.log(`Order confirmation email sent to ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
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
 * Envía email de actualización de estado de orden
 */
export async function sendOrderStatusUpdateEmail({
  order,
  newStatus,
  storeName,
  storeUrl,
}: SendOrderStatusUpdateParams) {
  try {
    const emailHtml = await render(
      OrderStatusUpdateEmail({
        order,
        newStatus,
        storeName,
        storeUrl,
      })
    );

    const STATUS_SUBJECTS: Record<OrderStatus, string> = {
      pending: `Tu pedido #${order.order_number} está siendo revisado`,
      pending_payment: `Estamos esperando tu pago - Pedido #${order.order_number}`,
      paid: `Tu pago fue confirmado - Pedido #${order.order_number}`,
      processing: `Estamos preparando tu pedido #${order.order_number}`,
      shipped: `Tu pedido #${order.order_number} está en camino`,
      delivered: `Tu pedido #${order.order_number} fue entregado`,
      cancelled: `Tu pedido #${order.order_number} fue cancelado`,
      refunded: `Reembolso procesado - Pedido #${order.order_number}`,
    };

    await sendEmail({
      to: order.customer_email,
      subject: STATUS_SUBJECTS[newStatus],
      html: emailHtml,
    });

    console.log(`Order status update email sent to ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error };
  }
}
