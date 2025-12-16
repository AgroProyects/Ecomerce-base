# Configuración de Verificación de Email

## 1. Configurar Supabase Auth

### En el Dashboard de Supabase:

1. Ve a `Authentication` → `Email Templates`
2. Selecciona `Confirm signup`
3. Reemplaza el template con el siguiente HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu cuenta</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 40px 30px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px; font-weight: 700;">
                ¡Bienvenido a nuestra tienda! 🎉
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; line-height: 1.5;">
                Estás a un paso de completar tu registro
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola 👋
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Gracias por registrarte en nuestra tienda. Para completar tu registro y comenzar a disfrutar de todos los beneficios, por favor confirma tu dirección de email haciendo clic en el botón de abajo:
              </p>

              <!-- Botón de confirmación -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}"
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s;">
                      ✅ Confirmar mi email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Beneficios -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 6px;">
                <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px; font-weight: 600;">
                  🎁 Beneficios de confirmar tu cuenta:
                </h3>
                <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Realiza compras de forma segura</li>
                  <li>Guarda tus direcciones de envío</li>
                  <li>Deja reseñas en productos</li>
                  <li>Recibe ofertas exclusivas</li>
                  <li>Seguimiento de tus pedidos en tiempo real</li>
                </ul>
              </div>

              <!-- Cupón de bienvenida (opcional) -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  🎉 Regalo de bienvenida
                </p>
                <p style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: 2px;">
                  10% OFF
                </p>
                <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">
                  En tu primera compra
                </p>
              </div>

              <!-- Si el botón no funciona -->
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 10px 0 0;">
                {{ .ConfirmationURL }}
              </p>

              <!-- Advertencia de expiración -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 25px 0 0; border-radius: 6px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  ⏰ <strong>Este enlace expira en 24 horas.</strong> Si no confirmaste tu email, puedes solicitar un nuevo enlace desde tu cuenta.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; line-height: 1.5;">
                ¿No creaste esta cuenta? Puedes ignorar este email de forma segura.
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.5;">
                © 2025 Tu Tienda. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Configuración adicional:

4. Ve a `Authentication` → `Settings` → `Email Auth`
5. Activa: **Enable email confirmations**
6. Configura **Confirm email redirect URL**: `https://tu-dominio.com/auth/confirm`
7. Configura **Email rate limit**: `3 per hour` (previene spam)

## 2. Variables de Entorno

Añade a tu `.env.local`:

```env
# Email Verification
NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Aplicar la migración

```bash
# Si usas Supabase CLI local
supabase migration up

# O aplica manualmente en el SQL Editor del dashboard de Supabase
```

## 4. Flujo de Usuario

### Registro:
1. Usuario completa el formulario de registro
2. Cuenta creada con `email_verified = false`
3. Email de confirmación enviado automáticamente por Supabase Auth
4. Usuario puede navegar la tienda pero no puede comprar o dejar reviews

### Confirmación:
1. Usuario hace clic en el enlace del email
2. Supabase Auth verifica el token
3. Se actualiza `email_verified = true`
4. Redirección a la tienda con mensaje de éxito

### Si no confirma:
1. Banner persistente: "⚠️ Por favor confirma tu email para poder comprar"
2. En checkout: Bloqueo con mensaje + botón "Reenviar email"
3. En reviews: Bloqueo con mensaje + botón "Reenviar email"

## 5. Personalización del Email

Para personalizar el diseño del email:

1. Cambia los colores del gradiente (líneas con `linear-gradient`)
2. Modifica el cupón de descuento o elimínalo
3. Ajusta los beneficios listados según tu tienda
4. Cambia el nombre "Tu Tienda" por el nombre real

## 6. Testing

Para probar en desarrollo:

1. Registra un usuario nuevo
2. Revisa la consola de Supabase: `Authentication` → `Logs`
3. Copia el `confirmation_url` de los logs
4. Pégalo en el navegador para simular el clic

## 7. Seguridad

✅ Los tokens expiran en 24 horas
✅ Solo se pueden usar una vez
✅ Rate limiting: 3 emails por hora
✅ Los usuarios no verificados no pueden acciones críticas
✅ Logs de todos los intentos de verificación

## 8. Monitoreo

Panel Admin mostrará:
- Total de usuarios registrados
- Total de usuarios verificados
- Porcentaje de verificación
- Usuarios pendientes de verificar (últimos 7 días)
