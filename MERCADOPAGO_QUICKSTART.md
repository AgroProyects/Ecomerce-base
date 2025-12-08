# Mercado Pago - Inicio Rápido

Guía rápida para poner en marcha Mercado Pago en 5 minutos.

## 🚀 Configuración Rápida

### 1. Obtener Credenciales

1. Ingresa a https://www.mercadopago.com.ar/developers/panel/app
2. Crea una aplicación
3. Ve a "Credenciales" y copia el **Access Token de Prueba** (TEST-xxxx)

### 2. Configurar Variables

Crea o edita `.env.local`:

```bash
# OBLIGATORIAS
MP_ACCESS_TOKEN="TEST-1234567890-123456-abc123def456-abc123def456"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OPCIONALES (para desarrollo)
MP_DEBUG="true"
MP_SANDBOX="true"
```

### 3. Iniciar Servidor

```bash
npm run dev
```

### 4. Probar Checkout

1. Ve a http://localhost:3000
2. Agrega productos al carrito
3. Procede al checkout
4. Selecciona "Mercado Pago"
5. Completa el formulario
6. Haz clic en "Pagar con Mercado Pago"

### 5. Completar Pago de Prueba

Usa esta tarjeta de prueba:
- **Número:** 5031 7557 3453 0604
- **Vencimiento:** 11/25
- **CVV:** 123
- **Nombre:** APRO (aprobada)

## 🔔 Configurar Webhooks (Desarrollo)

### Opción A: Usar ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar túnel
ngrok http 3000

# Copia la URL HTTPS (ej: https://abc123.ngrok.io)
# Actualiza .env.local:
NEXT_PUBLIC_APP_URL="https://abc123.ngrok.io"

# Reinicia el servidor
npm run dev
```

### Opción B: Sin webhooks

Si no necesitas webhooks en desarrollo:
1. Los pagos funcionarán
2. Las órdenes se actualizarán al volver del checkout
3. No habrá actualizaciones en tiempo real

## 📋 Métodos de Pago

### Mercado Pago
- Redirección a checkout de MP
- Soporta tarjetas, efectivo, etc.
- Estado inicial: `pending`
- Se actualiza via webhook

### Transferencia Bancaria
- Cliente transfiere a tu cuenta
- Sube comprobante
- Estado: `pending_payment`
- Requiere aprobación manual

### Efectivo contra Entrega
- Pago al recibir pedido
- Estado: `pending`
- No requiere verificación

## 🧪 Tarjetas de Prueba

| Estado | Número | CVV | Vencimiento |
|--------|--------|-----|-------------|
| Aprobada | 5031 7557 3453 0604 | 123 | 11/25 |
| Rechazada | 5031 4332 1540 6351 | 123 | 11/25 |
| Pendiente | 5031 7557 3453 0604 | 123 | 11/25* |

*Para simular pendiente, completa el pago pero no lo finalices inmediatamente.

Más tarjetas: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

## 📂 Archivos Principales

```
lib/mercadopago/
├── config.ts          # Configuración
├── preferences.ts     # Crear preferencias
├── payments.ts        # Gestión de pagos
└── webhooks.ts        # Procesar webhooks

actions/checkout/
└── process.ts         # Lógica principal

app/api/webhooks/mercadopago/
└── route.ts           # Endpoint webhook

app/(store)/checkout/
├── page.tsx           # Checkout
├── success/           # Pago exitoso
├── failure/           # Pago fallido
└── pending/           # Pago pendiente
```

## 🐛 Problemas Comunes

### Error: "MP_ACCESS_TOKEN no configurado"
```bash
# Verifica que existe .env.local
ls -la .env.local

# Verifica el contenido
cat .env.local | grep MP_ACCESS_TOKEN

# Reinicia el servidor
npm run dev
```

### Error: "No se puede crear preferencia"
- Verifica que el ACCESS_TOKEN sea correcto
- Verifica que empiece con TEST- (para pruebas)
- Revisa los logs de consola

### Webhook no llega
- ¿Está ngrok corriendo?
- ¿NEXT_PUBLIC_APP_URL apunta a ngrok?
- Verifica en http://127.0.0.1:4040 (interfaz de ngrok)

### Orden no se actualiza
- Revisa los logs del webhook
- Verifica que el external_reference coincida con el order_id
- Revisa la tabla orders en Supabase

## ✅ Checklist

- [ ] Access Token configurado
- [ ] Servidor corriendo en puerto 3000
- [ ] ngrok corriendo (opcional)
- [ ] NEXT_PUBLIC_APP_URL configurada
- [ ] Checkout accesible
- [ ] Puedes agregar productos al carrito
- [ ] Puedes seleccionar método de pago
- [ ] Redirección a MP funciona
- [ ] Puedes completar pago con tarjeta de prueba
- [ ] Redirección de vuelta funciona
- [ ] Orden se creó en base de datos

## 📚 Documentación Completa

Para información detallada, consulta:
- `GUIA_MERCADOPAGO.md` - Documentación completa
- [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)

## 🆘 Necesitas Ayuda?

1. Revisa los logs de consola
2. Activa debug: `MP_DEBUG=true`
3. Consulta GUIA_MERCADOPAGO.md
4. Revisa la documentación oficial
5. Contacta al equipo de desarrollo

---

**¡Listo!** Ya tienes Mercado Pago funcionando 🎉
