# Guía de Configuración de Email con Supabase

Esta guía te ayudará a configurar correctamente la verificación de email usando Supabase Auth.

## 🎯 Problema Actual

En [register/route.ts](app/api/auth/register/route.ts:31) tienes:
```typescript
email_confirm: true, // Auto-confirm email for now
```

Esto **auto-confirma** el email, saltándose la verificación. Para habilitar la verificación real, necesitas cambiar esto a `false`.

---

## 📋 Pasos para Configurar Email Verification

### 1. Configurar Supabase Dashboard

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** → **Email Templates**
3. Verás 4 templates:
   - ✅ **Confirm signup** (el que necesitamos)
   - Magic Link
   - Change Email Address
   - Reset Password

### 2. Configurar el Template "Confirm signup"

Edita el template con el siguiente contenido:

**Subject:**
```
Confirma tu email - {{ .SiteURL }}
```

**Body (HTML):**
```html
<h2>¡Bienvenido a nuestra tienda!</h2>

<p>Gracias por registrarte. Para activar tu cuenta, por favor confirma tu dirección de email haciendo clic en el botón de abajo:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
    Confirmar mi email
  </a>
</p>

<p>O copia y pega este enlace en tu navegador:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="color: #666; font-size: 12px; margin-top: 30px;">
  Si no creaste esta cuenta, puedes ignorar este email.
</p>
```

### 3. Configurar URLs de Redirección

En **Authentication** → **URL Configuration**, configura:

**Site URL:**
```
http://localhost:3000
```
(En producción, cambia a tu dominio real, ej: `https://tutienda.com`)

**Redirect URLs:**
Agrega estas URLs (una por línea):
```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/**
```

En producción, agrega también:
```
https://tutienda.com/auth/confirm
https://tutienda.com/auth/callback
https://tutienda.com/**
```

### 4. Habilitar Email Confirmations

En **Authentication** → **Providers** → **Email**:

1. ✅ Marca **Enable email confirmations**
2. ✅ Marca **Secure email change** (opcional pero recomendado)
3. Guarda cambios

### 5. Actualizar el Código de Registro

Edita [app/api/auth/register/route.ts](app/api/auth/register/route.ts):

**ANTES:**
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // ❌ Auto-confirma
  user_metadata: { name },
})
```

**DESPUÉS:**
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: false, // ✅ Requiere confirmación
  user_metadata: { name },
})
```

### 6. Configurar Variables de Entorno

Asegúrate de tener en tu `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# URL de tu app (IMPORTANTE para los links de confirmación)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🔄 Flujo Completo de Verificación

### Cuando un usuario se registra:

1. **Usuario completa formulario** → `POST /api/auth/register`
2. **Se crea cuenta en Supabase** con `email_confirm: false`
3. **Supabase envía email** automáticamente con el template configurado
4. **Usuario recibe email** con link de confirmación
5. **Usuario hace clic** → redirige a `/auth/confirm?token_hash=...&type=email`
6. **Componente EmailConfirmation** verifica el token
7. **Supabase confirma** el email
8. **Usuario redirigido** a la tienda

### Código ya implementado:

Ya tienes todo el código necesario:
- ✅ [EmailConfirmation component](app/(auth)/auth/confirm/email-confirmation.tsx) - Maneja la confirmación
- ✅ [Confirm page](app/(auth)/auth/confirm/page.tsx) - Página de confirmación
- ✅ Validación de tokens con `verifyOtp()`

---

## 🎨 Personalizar el Email (Opcional)

### Usar un Template HTML Personalizado

Crea un archivo `email-templates/confirm-email.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10b981; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a Nuestra Tienda! 🎉</h1>
    </div>
    <div class="content">
      <p>Hola {{ .Email }},</p>

      <p>¡Gracias por unirte a nuestra comunidad! Estamos emocionados de tenerte con nosotros.</p>

      <p>Para comenzar a disfrutar de todos los beneficios, confirma tu dirección de email:</p>

      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">
          ✓ Confirmar mi Email
        </a>
      </div>

      <p style="margin-top: 30px;">O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 13px;">
        {{ .ConfirmationURL }}
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="color: #6b7280; font-size: 14px;">
        <strong>¿Por qué verificar tu email?</strong><br>
        • Recupera tu contraseña si la olvidas<br>
        • Recibe notificaciones de tus pedidos<br>
        • Accede a ofertas exclusivas<br>
        • Mantén tu cuenta segura
      </p>
    </div>
    <div class="footer">
      <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
      <p>&copy; 2025 Tu Tienda. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

Luego copia este HTML en el template de Supabase.

---

## 🧪 Testing

### Probar en Desarrollo:

1. **Registra un usuario de prueba:**
   ```
   Email: test@example.com
   Password: Test1234
   ```

2. **Verifica los logs de Supabase:**
   - Ve a **Authentication** → **Users**
   - El usuario aparecerá con `email_confirmed_at: null`

3. **Revisa el email:**
   - En desarrollo, Supabase muestra el email en los logs
   - Ve a **Logs** → **Auth Logs** para ver el link de confirmación

4. **Confirma manualmente:**
   - Copia el link del log
   - Pégalo en tu navegador
   - Deberías ver la página de confirmación

### Verificar que Funciona:

```sql
-- En el SQL Editor de Supabase
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

Si `email_confirmed_at` es `NULL`, significa que el email NO está confirmado.
Después de confirmar, debe tener una fecha.

---

## 🚨 Troubleshooting

### "No recibo el email"

**Verifica:**

1. ✅ Que `email_confirm: false` en register route
2. ✅ Email confirmations habilitado en dashboard
3. ✅ Site URL configurada correctamente
4. ✅ El email no está en spam

**Solución temporal (solo desarrollo):**
Ve a **Logs** → **Auth** en Supabase para copiar el link de confirmación.

### "Invalid link" al confirmar

**Verifica:**

1. ✅ Redirect URLs incluyen `/auth/confirm`
2. ✅ `NEXT_PUBLIC_APP_URL` correcto en .env
3. ✅ El token no expiró (válido por 24h)

### "Email already confirmed"

Normal si intentas confirmar dos veces. El sistema lo detecta y muestra un mensaje apropiado.

---

## 📧 Usar SMTP Personalizado (Opcional)

Si quieres usar tu propio servidor SMTP en lugar del de Supabase:

1. Ve a **Project Settings** → **Auth**
2. Scroll hasta **SMTP Settings**
3. Habilita "Enable Custom SMTP"
4. Configura:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: tu-email@gmail.com
   Password: [App Password de Gmail]
   Sender email: tu-email@gmail.com
   Sender name: Tu Tienda
   ```

**Para Gmail:**
- Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Genera una contraseña de aplicación
- Usa esa contraseña en SMTP Settings

---

## ✅ Checklist Final

Antes de lanzar a producción:

- [ ] `email_confirm: false` en register route
- [ ] Email confirmations habilitado en Supabase
- [ ] Template de email personalizado
- [ ] Site URL apuntando a dominio de producción
- [ ] Redirect URLs incluyen dominio de producción
- [ ] Variables de entorno actualizadas
- [ ] SMTP configurado (opcional)
- [ ] Testeado con usuario real

---

## 🔗 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

¿Necesitas ayuda adicional? Revisa los componentes existentes:
- [Email Confirmation Component](app/(auth)/auth/confirm/email-confirmation.tsx)
- [Register API Route](app/api/auth/register/route.ts)
