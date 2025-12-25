# Guía Completa de Configuración del Proyecto E-Commerce

Esta guía te permitirá configurar el proyecto desde cero para un nuevo cliente o hacer una copia funcional del mismo.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de MercadoPago](#configuración-de-mercadopago)
4. [Configuración de Email (Gmail)](#configuración-de-email-gmail)
5. [Configuración de Redis (Upstash)](#configuración-de-redis-upstash)
6. [Configuración de Sentry](#configuración-de-sentry)
7. [Variables de Entorno](#variables-de-entorno)
8. [Instalación y Ejecución](#instalación-y-ejecución)
9. [Workers en Segundo Plano](#workers-en-segundo-plano)

---

## Requisitos Previos

- Node.js 20 o superior
- npm o yarn
- Cuenta de Supabase
- Cuenta de MercadoPago (AR)
- Cuenta de Gmail (para envío de emails)
- Cuenta de Upstash (Redis)
- Cuenta de Sentry (opcional, para monitoreo de errores)

---

## Configuración de Supabase

### 1. Crear un Nuevo Proyecto en Supabase

1. Ingresa a [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota las credenciales:
   - Project URL (ej: `https://xxxxx.supabase.co`)
   - Anon Key (clave pública)
   - Service Role Key (clave privada - ¡NUNCA exponerla al cliente!)

### 2. Ejecutar las Migraciones de la Base de Datos

Las migraciones se encuentran en la carpeta `supabase/migrations/`. Ejecuta cada una en orden:

**Opción A: Desde el Dashboard de Supabase**

1. Ve a `SQL Editor` en tu proyecto de Supabase
2. Ejecuta cada migración en el siguiente orden:

```
001_initial_schema.sql
002_customer_tables.sql
003_coupons_table.sql
004_reviews_system.sql
005_cart_system.sql
006_auth_improvements.sql
007_email_verification.sql (o 007_email_verification_complete.sql)
008_sync_auth_users.sql
009_shipping_costs.sql
010_stock_reservations.sql
011_database_indexes.sql
```

**Opción B: Usando Supabase CLI**

```bash
npx supabase db push
```

### 3. Configurar Storage Buckets

Ve a `Storage` en el dashboard de Supabase y crea los siguientes buckets:

| Bucket      | Público | Tamaño Máx | Tipos Permitidos |
|-------------|---------|------------|------------------|
| products    | ✓       | 5MB        | image/*          |
| avatars     | ✓       | 5MB        | image/*          |
| categories  | ✓       | 5MB        | image/*          |
| banners     | ✓       | 5MB        | image/*          |
| documents   | ✗       | 10MB       | application/pdf  |

Luego, ejecuta el script `supabase/storage-setup.sql` en el SQL Editor para crear las políticas de acceso.

### 4. Configurar Autenticación

1. Ve a `Authentication > Providers` en Supabase
2. Habilita **Email** como provider
3. En `Authentication > Email Templates`:
   - Personaliza las plantillas si lo deseas
   - Configura el redirect URL: `http://localhost:3000` (desarrollo) o tu dominio (producción)

### 5. Configurar Email Verification (Opcional)

Si deseas usar verificación de email:

1. Ejecuta la migración `007_email_verification_complete.sql`
2. Configura `NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true` en tu `.env`

---

## Configuración de MercadoPago

### 1. Crear una Aplicación

1. Ingresa a [https://www.mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. Crea una nueva aplicación
3. Anota las credenciales de **TEST** (para desarrollo):
   - `Access Token` (empieza con `TEST-`)
   - `Public Key` (empieza con `TEST-`)

### 2. Configurar Webhooks

1. En el panel de tu aplicación, ve a `Webhooks`
2. Configura la URL de notificaciones:
   - Desarrollo: `https://tu-tunnel.devtunnels.ms/api/webhooks/mercadopago`
   - Producción: `https://tu-dominio.com/api/webhooks/mercadopago`
3. Selecciona los eventos:
   - `payment`
   - `merchant_order`
4. Copia el `Webhook Secret` generado

### 3. Generar un Webhook Secret Personalizado (Opcional)

Si prefieres usar tu propio secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Producción

Cuando estés listo para producción:
1. Solicita la aprobación de tu aplicación en MercadoPago
2. Reemplaza las credenciales TEST por las de PRODUCCIÓN
3. Cambia `MP_SANDBOX="false"`

---

## Configuración de Email (Gmail)

### 1. Habilitar Autenticación de Dos Factores

1. Ve a tu cuenta de Google
2. Seguridad > Verificación en dos pasos
3. Activa la verificación en dos pasos

### 2. Generar una Contraseña de Aplicación

1. Ve a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" y "Otro (nombre personalizado)"
3. Escribe "E-Commerce App"
4. Copia la contraseña generada (16 caracteres sin espacios)
5. Esta será tu `MAIL_PASSWORD`

### 3. Configurar el Email

Anota:
- `MAIL_USER`: tu email de Gmail (ej: `mitienda@gmail.com`)
- `MAIL_PASSWORD`: la contraseña de aplicación generada
- `MAIL_FROM_ADDRESS`: el mismo email
- `MAIL_FROM_NAME`: nombre que aparecerá como remitente (ej: "Mi Tienda Virtual")

**Nota**: Gmail tiene límites de envío (500 emails/día para cuentas gratuitas). Para mayor volumen, considera servicios como SendGrid o AWS SES.

---

## Configuración de Redis (Upstash)

### 1. Crear una Base de Datos Redis

1. Ingresa a [https://upstash.com](https://upstash.com)
2. Crea una nueva base de datos Redis
3. Selecciona la región más cercana a tus usuarios
4. Plan gratuito: 10,000 comandos/día

### 2. Obtener Credenciales

En el dashboard de tu base de datos, copia:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 3. Uso en el Proyecto

Redis se usa para:
- Rate limiting (límite de peticiones por IP)
- Cache de productos y categorías
- Cola de emails (BullMQ)
- Reservas temporales de stock

---

## Configuración de Sentry

### 1. Crear un Proyecto

1. Ingresa a [https://sentry.io](https://sentry.io)
2. Crea un nuevo proyecto de tipo **Next.js**
3. Copia el `DSN` generado

### 2. Configurar el Proyecto

El DSN se usa en dos variables:
- `SENTRY_DSN` (servidor)
- `NEXT_PUBLIC_SENTRY_DSN` (cliente)

Ambas tienen el mismo valor.

### 3. Configuración Adicional (Opcional)

Sentry se integra automáticamente. Para configuración avanzada:
- Edita `sentry.client.config.ts`
- Edita `sentry.server.config.ts`

---

## Variables de Entorno

### Archivo `.env` Completo

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```bash
# ==========================================
# SUPABASE
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# ==========================================
# NEXTAUTH
# ==========================================
# Genera con: openssl rand -base64 64
NEXTAUTH_SECRET="tu-nextauth-secret-generado"
NEXTAUTH_URL="http://localhost:3000"

# ==========================================
# MERCADOPAGO
# ==========================================
# Access Token de MercadoPago (TEST o PROD)
MP_ACCESS_TOKEN="TEST-xxxxx-xxxxxx-xxxxx"

# Public Key de MercadoPago
MP_PUBLIC_KEY="TEST-xxxxx-xxxxx-xxxxx"
NEXT_PUBLIC_MP_PUBLIC_KEY="TEST-xxxxx-xxxxx-xxxxx"

# Webhook Secret (generar o copiar de MP)
MP_WEBHOOK_SECRET="tu-webhook-secret-hex"

# ==========================================
# CONFIGURACIÓN DE LA APP
# ==========================================
# URL de tu aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Verificación de email (true/false)
NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION="false"

# ==========================================
# EMAIL (GMAIL)
# ==========================================
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="587"
MAIL_USER="tu-email@gmail.com"
MAIL_PASSWORD="tu-contraseña-de-app-de-16-caracteres"
MAIL_FROM_NAME="Tu Tienda Virtual"
MAIL_FROM_ADDRESS="tu-email@gmail.com"

# ==========================================
# REDIS (UPSTASH)
# ==========================================
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-upstash-token"

# ==========================================
# SENTRY (OPCIONAL)
# ==========================================
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# ==========================================
# OPCIONALES
# ==========================================
# Si decides usar Resend en lugar de Gmail
# RESEND_API_KEY="re_xxxxx"

# Si decides usar UploadThing para archivos
# UPLOADTHING_SECRET="sk_xxxxx"
```

### Generar Secretos

Para generar el `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 64
```

Para generar el `MP_WEBHOOK_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Instalación y Ejecución

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 3. Build para Producción

```bash
npm run build
npm start
```

---

## Workers en Segundo Plano

El proyecto incluye dos workers que procesan tareas en segundo plano:

### 1. Email Worker

Procesa la cola de envío de emails.

```bash
npm run worker:email
```

### 2. Cleanup Worker

Limpia reservas de stock expiradas.

```bash
npm run worker:cleanup
```

**Importante**: En producción, estos workers deben ejecutarse como procesos separados (usando PM2, systemd, o el sistema de tu hosting).

---

## Configuración de Producción

### Variables a Cambiar

Cuando despliegues a producción, actualiza:

1. **NEXTAUTH_URL**: Tu dominio real
2. **NEXT_PUBLIC_APP_URL**: Tu dominio real
3. **NEXT_PUBLIC_SITE_URL**: Tu dominio real
4. **MP_ACCESS_TOKEN**: Credenciales de PRODUCCIÓN de MercadoPago
5. **MP_PUBLIC_KEY**: Public Key de PRODUCCIÓN
6. **Webhooks de MercadoPago**: Actualizar la URL al dominio de producción

### Verificaciones Finales

- [ ] Base de datos de Supabase configurada
- [ ] Storage buckets creados
- [ ] Autenticación de Supabase configurada
- [ ] Credenciales de MercadoPago funcionando
- [ ] Webhooks de MercadoPago configurados
- [ ] Email de Gmail enviando correctamente
- [ ] Redis funcionando
- [ ] Variables de entorno configuradas
- [ ] Build de producción exitoso
- [ ] Workers en ejecución

---

## Troubleshooting

### Problema: Emails no se envían

**Solución**: Verifica que:
1. Habilitaste la autenticación de dos factores en Gmail
2. Generaste una contraseña de aplicación
3. No hay espacios en el `MAIL_PASSWORD`
4. El worker de emails está corriendo

### Problema: Pagos de MercadoPago no funcionan

**Solución**: Verifica que:
1. El `MP_ACCESS_TOKEN` es correcto
2. La URL del webhook está configurada
3. La URL del webhook es accesible públicamente (usar tunnels en desarrollo)
4. El `NEXT_PUBLIC_APP_URL` coincide con tu dominio

### Problema: Error de Supabase "Invalid API Key"

**Solución**: Verifica que:
1. Copiaste las claves correctamente (sin espacios)
2. Estás usando las claves del proyecto correcto
3. El proyecto de Supabase no está pausado

### Problema: Redis no conecta

**Solución**: Verifica que:
1. Las credenciales de Upstash son correctas
2. La base de datos de Redis está activa
3. No excediste el límite del plan gratuito

---

## Próximos Pasos

Una vez configurado el proyecto, te recomendamos:

1. Personalizar los datos de la tienda en `store_settings`
2. Crear categorías de productos
3. Agregar productos al catálogo
4. Configurar métodos de envío
5. Personalizar las plantillas de email
6. Configurar el dominio personalizado

---

## Soporte

Para más información, consulta la documentación en `docs/`:
- [Guía de MercadoPago](guias/GUIA_MERCADOPAGO.md)
- [Guía de Email](guias/GUIA_EMAIL.md)
- [Guía de Storage](guias/GUIA_STORAGE.md)
