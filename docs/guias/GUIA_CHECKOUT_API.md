# 🎯 Guía Completa de Checkout API - Mercado Pago

## ✅ Implementación Completada

He implementado **Checkout API** de Mercado Pago que te permite:
- ✅ Procesar pagos directamente en tu sitio (sin redirigir)
- ✅ Usar **tarjetas de prueba** con credenciales de producción
- ✅ Capturar datos de tarjeta de forma segura
- ✅ Procesar pagos en tiempo real

---

## 📁 Archivos Creados

### Backend
1. **`lib/mercadopago/checkout-api.ts`**
   - Servicio para crear pagos con Checkout API
   - Función `createPayment()` para procesar pagos
   - Función `getPayment()` para consultar pagos

2. **`app/api/mercadopago/process-payment/route.ts`**
   - Endpoint POST `/api/mercadopago/process-payment`
   - Recibe token de tarjeta y procesa el pago
   - Actualiza la orden automáticamente

### Frontend
3. **`components/checkout/MercadoPagoCardForm.tsx`**
   - Formulario completo de tarjeta de crédito
   - Integración con SDK de Mercado Pago
   - Detección automática del tipo de tarjeta
   - Tokenización segura de datos de tarjeta

---

## 🔧 Configuración Necesaria

### 1. Variables de Entorno

Ya agregué la variable necesaria en tu `.env`:

```env
# Para el SDK del frontend (ya configurado)
NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-4964dfb8-55cb-4f3d-a281-7ea12cb44c9f"

# Para el backend (ya existe)
MP_ACCESS_TOKEN="APP_USR-4956446418432939-120722-479b8467ef375af005bea04541450227-3043495025"
```

### 2. Reiniciar el Servidor

⚠️ **MUY IMPORTANTE:** Después de actualizar `.env`, reinicia el servidor:

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

---

## 🎨 Cómo Integrar en tu Página de Checkout

### Opción 1: Reemplazar Checkout Pro (Recomendado)

Actualiza tu página de checkout para usar el nuevo formulario:

```tsx
// En tu página de checkout (app/(store)/checkout/page.tsx)
import { MercadoPagoCardForm } from '@/components/checkout/MercadoPagoCardForm'

// Después de crear la orden, en lugar de redirigir:
<MercadoPagoCardForm
  orderId={order.id}
  amount={order.total}
  onSuccess={(paymentId) => {
    console.log('Pago exitoso:', paymentId)
    router.push(`/checkout/success?order_id=${order.id}`)
  }}
  onError={(error) => {
    console.error('Error en el pago:', error)
    toast.error(error)
  }}
/>
```

### Opción 2: Ofrecer Ambas Opciones

Puedes permitir al usuario elegir entre:
- **Checkout Pro** (redirige a Mercado Pago)
- **Checkout API** (paga directamente en tu sitio)

```tsx
const [checkoutMethod, setCheckoutMethod] = useState<'pro' | 'api'>('api')

{checkoutMethod === 'api' ? (
  <MercadoPagoCardForm
    orderId={order.id}
    amount={order.total}
    onSuccess={handleSuccess}
    onError={handleError}
  />
) : (
  <Button onClick={() => window.location.href = initPoint}>
    Pagar con Mercado Pago
  </Button>
)}
```

---

## 🧪 Tarjetas de Prueba para Checkout API

Con Checkout API puedes usar tarjetas de prueba **incluso con credenciales de producción**:

### ✅ Tarjetas Aprobadas

**Visa**
- **Número:** 4509 9535 6623 3704
- **CVV:** 123
- **Vencimiento:** 11/25
- **Titular:** APRO
- **DNI/CI:** 12345678

**Mastercard**
- **Número:** 5031 7557 3453 0604
- **CVV:** 123
- **Vencimiento:** 11/25
- **Titular:** APRO
- **DNI/CI:** 12345678

### ❌ Tarjetas Rechazadas (para probar errores)

**Fondos Insuficientes**
- **Número:** 4009 1752 7983 5283
- **Titular:** FUND

**Datos Inválidos**
- **Número:** 5031 4332 1540 6351
- **Titular:** OTHE

Más tarjetas: https://www.mercadopago.com.uy/developers/es/docs/checkout-api/testing

---

## 🚀 Flujo Completo de Pago

### 1. Usuario completa el formulario
```
┌─────────────────────────────┐
│ Formulario de Tarjeta       │
│ - Número: 4509 9535...      │
│ - Titular: APRO             │
│ - CVV: 123                  │
│ - Venc: 11/25               │
│ - DNI: 12345678             │
└──────────┬──────────────────┘
           │
           ▼
```

### 2. SDK genera token seguro
```
┌─────────────────────────────┐
│ Mercado Pago SDK            │
│ Tokeniza los datos          │
│ Token: abc123xyz...         │
└──────────┬──────────────────┘
           │
           ▼
```

### 3. Backend procesa el pago
```
┌─────────────────────────────┐
│ /api/mercadopago/           │
│ process-payment             │
│                             │
│ 1. Recibe token             │
│ 2. Crea pago en MP          │
│ 3. Actualiza orden          │
└──────────┬──────────────────┘
           │
           ▼
```

### 4. Resultado
```
┌─────────────────────────────┐
│ ✅ approved                 │
│ ⏳ pending                  │
│ ❌ rejected                 │
└─────────────────────────────┘
```

---

## 🔍 Logs y Debug

El sistema tiene logging completo. Verás en la consola:

### Frontend (Navegador)
```
SDK de Mercado Pago cargado
Método de pago detectado: visa
Creando token de tarjeta...
Token creado: abc123...
```

### Backend (Terminal)
```
=== Procesando pago con Checkout API ===
Order ID: 123-456-789
Payment Method: visa
Installments: 1
--- createPayment (Checkout API): Iniciando ---
Enviando request de pago a Mercado Pago...
Payment ID: 789456123
Status: approved
✓ Pago aprobado
```

---

## ⚙️ Estados de Pago

| Estado MP | Estado Orden | Descripción |
|-----------|-------------|-------------|
| `approved` | `paid` | Pago aprobado, orden completada |
| `pending` | `pending_payment` | Pago pendiente de confirmación |
| `in_process` | `pending_payment` | Pago en proceso |
| `rejected` | `cancelled` | Pago rechazado |
| `cancelled` | `cancelled` | Pago cancelado |

---

## 🛡️ Seguridad

### ✅ Datos Protegidos
- Los datos de la tarjeta **nunca tocan tu servidor**
- El SDK de Mercado Pago tokeniza los datos en el navegador
- Tu backend solo recibe el token (no los datos de la tarjeta)
- El token se usa una sola vez

### 🔒 PCI Compliance
- Mercado Pago es PCI DSS Level 1 certified
- No necesitas certificación PCI porque no manejas datos de tarjeta

---

## 🧪 Cómo Probar

### Paso 1: Reinicia el Servidor
```bash
npm run dev
```

### Paso 2: Crea un Producto de Prueba
- Precio bajo (ejemplo: $100 UYU)
- Agrega al carrito
- Ve al checkout

### Paso 3: Usa una Tarjeta de Prueba
```
Número: 4509 9535 6623 3704
Titular: APRO
CVV: 123
Vencimiento: 11/25
DNI: 12345678
```

### Paso 4: Observa los Logs
- **Navegador (F12 → Console):** Verás el flujo del frontend
- **Terminal:** Verás el procesamiento del pago

### Paso 5: Verifica el Resultado
- Si todo está bien, serás redirigido a la página de éxito
- La orden cambiará a estado `paid`
- El payment_id quedará guardado en la base de datos

---

## 🔄 Migrar de Checkout Pro a Checkout API

Si quieres cambiar completamente a Checkout API:

### 1. Modifica `actions/checkout/process.ts`

Busca la sección de Mercado Pago y reemplaza:

```typescript
// ANTES (Checkout Pro)
if (customer.paymentMethod === 'mercadopago') {
  const preference = await createPreference(...)
  return {
    preferenceId: preference.id,
    initPoint: preference.initPoint,
  }
}

// DESPUÉS (Checkout API)
if (customer.paymentMethod === 'mercadopago') {
  // Solo crear la orden, el pago se procesa en el frontend
  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
    // No se crea preferencia, el pago se procesa con el formulario
  }
}
```

### 2. Actualiza tu Página de Checkout

Reemplaza el botón de "Pagar" con el formulario:

```tsx
<MercadoPagoCardForm
  orderId={orderId}
  amount={total}
  onSuccess={(paymentId) => router.push(`/checkout/success?order_id=${orderId}`)}
  onError={(error) => toast.error(error)}
/>
```

---

## 📊 Ventajas de Checkout API

| Característica | Checkout Pro | Checkout API |
|---------------|-------------|-------------|
| Tarjetas de prueba | ❌ Solo con TEST | ✅ Con producción |
| Redirección | ✅ Sí | ❌ No |
| Control del UX | ⚠️ Limitado | ✅ Total |
| Personalización | ⚠️ Básica | ✅ Completa |
| Complejidad | ✅ Simple | ⚠️ Moderada |

---

## 🆘 Solución de Problemas

### Error: "SDK de Mercado Pago no cargado"
- ✅ Verifica que `NEXT_PUBLIC_MP_PUBLIC_KEY` esté en `.env`
- ✅ Reinicia el servidor
- ✅ Limpia el caché del navegador (Ctrl+Shift+R)

### Error: "Public Key de Mercado Pago no configurada"
- ✅ Asegúrate de que la variable empiece con `NEXT_PUBLIC_`
- ✅ El valor debe coincidir con `MP_PUBLIC_KEY`

### El pago siempre se rechaza
- ✅ Usa exactamente los datos de las tarjetas de prueba
- ✅ El titular debe ser "APRO" para aprobación
- ✅ Verifica los logs del backend para ver el error exacto

### No detecta el tipo de tarjeta
- ✅ Ingresa al menos 6 dígitos del número de tarjeta
- ✅ Verifica que no haya espacios extra

---

## 📝 Próximos Pasos

1. ✅ **Probar con tarjetas de prueba**
2. ✅ **Verificar que el webhook funcione** (debe actualizar la orden)
3. ✅ **Personalizar el diseño** del formulario según tu marca
4. ✅ **Agregar cuotas** (installments) si lo necesitas
5. ✅ **Implementar 3DS** para mayor seguridad (opcional)

---

## 🎉 ¡Listo para Probar!

Ahora tienes un sistema completo de pagos con Checkout API. Puedes:
- ✅ Probar con tarjetas de prueba sin gastar dinero real
- ✅ Ver los logs completos de todo el proceso
- ✅ Personalizar completamente la experiencia de pago
- ✅ Mantener a los usuarios en tu sitio (sin redirección)

**¿Necesitas ayuda para integrar el formulario en tu checkout?** Avísame y te ayudo con la integración específica.
