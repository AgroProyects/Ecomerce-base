import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import type { Order } from '@/types/database';
import type { OrderStatus } from '@/schemas/order.schema';

interface OrderStatusUpdateEmailProps {
  order: Order;
  newStatus: OrderStatus;
  storeName?: string;
  storeUrl?: string;
}

const STATUS_MESSAGES: Record<OrderStatus, { title: string; message: string; color: string }> = {
  pending: {
    title: 'Pedido Recibido',
    message: 'Tu pedido está siendo revisado',
    color: '#eab308',
  },
  pending_payment: {
    title: 'Esperando Pago',
    message: 'Estamos esperando la confirmación de tu pago',
    color: '#f97316',
  },
  paid: {
    title: 'Pago Confirmado',
    message: 'Tu pago ha sido confirmado exitosamente',
    color: '#22c55e',
  },
  processing: {
    title: 'Preparando tu Pedido',
    message: 'Estamos preparando tu pedido para el envío',
    color: '#3b82f6',
  },
  shipped: {
    title: 'Pedido Enviado',
    message: 'Tu pedido está en camino',
    color: '#6366f1',
  },
  delivered: {
    title: 'Pedido Entregado',
    message: '¡Tu pedido ha sido entregado!',
    color: '#10b981',
  },
  cancelled: {
    title: 'Pedido Cancelado',
    message: 'Tu pedido ha sido cancelado',
    color: '#ef4444',
  },
  refunded: {
    title: 'Reembolso Procesado',
    message: 'El reembolso de tu pedido ha sido procesado',
    color: '#8b5cf6',
  },
};

export function OrderStatusUpdateEmail({
  order,
  newStatus,
  storeName = 'Tu Tienda',
  storeUrl = 'https://tutienda.com',
}: OrderStatusUpdateEmailProps) {
  const statusInfo = STATUS_MESSAGES[newStatus];

  return (
    <Html>
      <Head />
      <Preview>
        {statusInfo.title} - Pedido #{order.order_number}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div
              style={{
                ...statusBadge,
                backgroundColor: statusInfo.color,
              }}
            >
              {statusInfo.title}
            </div>
            <Heading style={h1}>{statusInfo.message}</Heading>
            <Text style={orderNumberText}>Pedido #{order.order_number}</Text>
          </Section>

          {/* Status Details */}
          <Section style={section}>
            {newStatus === 'paid' && (
              <Text style={message}>
                Hemos recibido tu pago correctamente. Comenzaremos a preparar tu pedido en breve.
              </Text>
            )}

            {newStatus === 'processing' && (
              <Text style={message}>
                Tu pedido está siendo preparado con mucho cuidado. Te notificaremos cuando esté
                listo para ser enviado.
              </Text>
            )}

            {newStatus === 'shipped' && (
              <>
                <Text style={message}>
                  ¡Buenas noticias! Tu pedido ya está en camino. Recibirás tu paquete en los
                  próximos días.
                </Text>
                {order.shipping_address && (
                  <>
                    <Text style={label}>Dirección de entrega:</Text>
                    <Text style={address}>
                      {(() => {
                        const addr = order.shipping_address as any;
                        return `${addr.street} ${addr.number}${addr.floor ? `, Piso ${addr.floor}` : ''}${addr.apartment ? `, Depto ${addr.apartment}` : ''}, ${addr.city}, ${addr.state}, CP: ${addr.postal_code}`;
                      })()}
                    </Text>
                  </>
                )}
              </>
            )}

            {newStatus === 'delivered' && (
              <Text style={message}>
                ¡Esperamos que disfrutes tu compra! Si tenés algún problema con tu pedido, no dudes
                en contactarnos.
              </Text>
            )}

            {newStatus === 'cancelled' && (
              <Text style={message}>
                Tu pedido ha sido cancelado. Si tenés alguna pregunta o querés realizar un nuevo
                pedido, estamos aquí para ayudarte.
              </Text>
            )}

            {newStatus === 'pending_payment' && (
              <Text style={message}>
                Estamos esperando la confirmación de tu pago. Si ya realizaste la transferencia,
                por favor asegurate de haber subido el comprobante.
              </Text>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={`${storeUrl}/orders/${order.id}`} style={button}>
              Ver Detalles del Pedido
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Gracias por tu compra en {storeName}
            </Text>
            <Text style={footerText}>
              Si tenés alguna pregunta, no dudes en contactarnos.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const statusBadge = {
  display: 'inline-block',
  padding: '8px 16px',
  borderRadius: '20px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const h1 = {
  color: '#18181b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const orderNumberText = {
  color: '#71717a',
  fontSize: '16px',
  margin: '0',
  fontFamily: 'monospace',
};

const section = {
  padding: '24px',
};

const message = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#18181b',
  margin: '0 0 16px',
};

const label = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#18181b',
  margin: '16px 0 8px',
};

const address = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
  lineHeight: '20px',
};

const ctaSection = {
  padding: '24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#18181b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e4e4e7',
};

const footerText = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 8px',
};

export default OrderStatusUpdateEmail;
