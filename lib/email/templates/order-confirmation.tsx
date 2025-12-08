import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
  Link,
} from '@react-email/components';
import type { Order, OrderItem } from '@/types/database';

interface OrderConfirmationEmailProps {
  order: Order;
  items: OrderItem[];
  storeName?: string;
  storeUrl?: string;
}

const PAYMENT_METHOD_LABELS = {
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia Bancaria',
  cash_on_delivery: 'Efectivo contra Entrega',
} as const;

export function OrderConfirmationEmail({
  order,
  items,
  storeName = 'Tu Tienda',
  storeUrl = 'https://tutienda.com',
}: OrderConfirmationEmailProps) {
  const shippingAddress = order.shipping_address as any;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <Html>
      <Head />
      <Preview>Confirmación de tu pedido #{order.order_number}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>¡Gracias por tu compra!</Heading>
            <Text style={subtitle}>
              Tu pedido ha sido recibido y está siendo procesado
            </Text>
          </Section>

          {/* Order Number */}
          <Section style={orderNumberSection}>
            <Text style={orderNumberLabel}>Número de pedido</Text>
            <Text style={orderNumber}>#{order.order_number}</Text>
          </Section>

          {/* Order Items */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Resumen del Pedido
            </Heading>
            {items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column style={itemInfo}>
                  <Text style={itemName}>{item.product_name}</Text>
                  {item.variant_name && (
                    <Text style={itemVariant}>{item.variant_name}</Text>
                  )}
                  <Text style={itemQuantity}>Cantidad: {item.quantity}</Text>
                </Column>
                <Column align="right">
                  <Text style={itemPrice}>{formatCurrency(item.total_price)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={hr} />

            {/* Totals */}
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatCurrency(order.subtotal)}</Text>
              </Column>
            </Row>

            {order.shipping_cost > 0 && (
              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Envío</Text>
                </Column>
                <Column align="right">
                  <Text style={totalValue}>{formatCurrency(order.shipping_cost)}</Text>
                </Column>
              </Row>
            )}

            {order.discount_amount > 0 && (
              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Descuento</Text>
                </Column>
                <Column align="right">
                  <Text style={discountValue}>
                    -{formatCurrency(order.discount_amount)}
                  </Text>
                </Column>
              </Row>
            )}

            <Hr style={hr} />

            <Row style={totalRow}>
              <Column>
                <Text style={grandTotalLabel}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={grandTotalValue}>{formatCurrency(order.total)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Shipping Address */}
          {shippingAddress && (
            <Section style={section}>
              <Heading as="h2" style={h2}>
                Dirección de Envío
              </Heading>
              <Text style={address}>
                {order.customer_name}
                <br />
                {shippingAddress.street} {shippingAddress.number}
                {shippingAddress.floor && `, Piso ${shippingAddress.floor}`}
                {shippingAddress.apartment && `, Depto ${shippingAddress.apartment}`}
                <br />
                {shippingAddress.city}, {shippingAddress.state}
                <br />
                CP: {shippingAddress.postal_code}
                <br />
                {shippingAddress.country}
              </Text>
            </Section>
          )}

          {/* Payment Method */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Método de Pago
            </Heading>
            <Text style={paymentMethod}>
              {order.payment_method
                ? PAYMENT_METHOD_LABELS[order.payment_method as keyof typeof PAYMENT_METHOD_LABELS]
                : 'No especificado'}
            </Text>

            {order.payment_method === 'bank_transfer' && (
              <Text style={paymentNote}>
                ℹ️ Tu pedido quedará en estado "Esperando Pago" hasta que verifiquemos tu
                transferencia. Por favor, asegurate de haber subido el comprobante.
              </Text>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={`${storeUrl}/orders/${order.id}`} style={button}>
              Ver Estado del Pedido
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Si tenés alguna pregunta, no dudes en contactarnos.
            </Text>
            <Text style={footerText}>
              Gracias por confiar en {storeName}
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
  backgroundColor: '#18181b',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const h2 = {
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  color: '#18181b',
};

const subtitle = {
  color: '#a1a1aa',
  fontSize: '16px',
  margin: '0',
};

const orderNumberSection = {
  backgroundColor: '#f4f4f5',
  padding: '16px 24px',
  textAlign: 'center' as const,
};

const orderNumberLabel = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 4px',
};

const orderNumber = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#18181b',
  margin: '0',
  fontFamily: 'monospace',
};

const section = {
  padding: '24px 24px 0',
};

const itemRow = {
  marginBottom: '16px',
};

const itemInfo = {
  verticalAlign: 'top' as const,
};

const itemName = {
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px',
  color: '#18181b',
};

const itemVariant = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0 0 4px',
};

const itemQuantity = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
};

const itemPrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#18181b',
  margin: '0',
};

const hr = {
  borderColor: '#e4e4e7',
  margin: '16px 0',
};

const totalRow = {
  marginBottom: '8px',
};

const totalLabel = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
};

const totalValue = {
  fontSize: '14px',
  color: '#18181b',
  margin: '0',
};

const discountValue = {
  fontSize: '14px',
  color: '#16a34a',
  margin: '0',
};

const grandTotalLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#18181b',
  margin: '0',
};

const grandTotalValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#18181b',
  margin: '0',
};

const address = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#18181b',
  margin: '0',
};

const paymentMethod = {
  fontSize: '14px',
  color: '#18181b',
  margin: '0 0 8px',
};

const paymentNote = {
  fontSize: '12px',
  color: '#71717a',
  backgroundColor: '#fef3c7',
  padding: '12px',
  borderRadius: '8px',
  margin: '8px 0 0',
};

const ctaSection = {
  padding: '32px 24px',
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

export default OrderConfirmationEmail;
