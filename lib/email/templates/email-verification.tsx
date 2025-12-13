import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Img,
} from '@react-email/components'

interface EmailVerificationProps {
  name: string
  verificationUrl: string
}

export default function EmailVerification({ name, verificationUrl }: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header con gradiente */}
          <Section style={header}>
            <Text style={headerTitle}>¡Bienvenido a Nuestra Tienda! 🎉</Text>
          </Section>

          {/* Contenido */}
          <Section style={content}>
            <Text style={greeting}>Hola {name},</Text>

            <Text style={paragraph}>
              ¡Gracias por unirte a nuestra comunidad! Estamos emocionados de tenerte con nosotros.
            </Text>

            <Text style={paragraph}>
              Para comenzar a disfrutar de todos los beneficios, confirma tu dirección de email:
            </Text>

            {/* Botón de confirmación */}
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                ✓ Confirmar mi Email
              </Button>
            </Section>

            <Text style={paragraph}>
              O copia y pega este enlace en tu navegador:
            </Text>

            <Section style={linkContainer}>
              <Text style={link}>{verificationUrl}</Text>
            </Section>

            <Hr style={hr} />

            {/* Beneficios */}
            <Text style={benefitsTitle}>¿Por qué verificar tu email?</Text>
            <ul style={benefitsList}>
              <li style={benefitItem}>Recupera tu contraseña si la olvidas</li>
              <li style={benefitItem}>Recibe notificaciones de tus pedidos</li>
              <li style={benefitItem}>Accede a ofertas exclusivas</li>
              <li style={benefitItem}>Mantén tu cuenta segura</li>
            </ul>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Si no creaste esta cuenta, puedes ignorar este email.
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} Tu Tienda. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
}

const header = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  borderRadius: '8px 8px 0 0',
  padding: '30px',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  border: '1px solid #e5e7eb',
  borderRadius: '0 0 8px 8px',
}

const greeting = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 16px 0',
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#374151',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  padding: '14px 36px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
}

const linkContainer = {
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '4px',
  marginTop: '8px',
  wordBreak: 'break-all' as const,
}

const link = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
}

const benefitsTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#111827',
  margin: '20px 0 12px 0',
}

const benefitsList = {
  paddingLeft: '20px',
  margin: '0',
}

const benefitItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#6b7280',
  marginBottom: '8px',
}

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  marginTop: '20px',
}

const footerText = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0 0 8px 0',
}

const footerCopyright = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
}
