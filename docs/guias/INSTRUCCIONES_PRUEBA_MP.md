# Instrucciones para Probar Mercado Pago

## 🔧 Cambios Implementados

### 1. **Logging Detallado**
- ✅ Agregado logging completo en `actions/checkout/process.ts`
- ✅ Agregado logging en `lib/mercadopago/checkout.ts`
- ✅ Agregado logging en `lib/mercadopago/client.ts`

### 2. **Cambio de Moneda**
- ✅ Cambiado de `ARS` (Peso Argentino) a `UYU` (Peso Uruguayo)
- 📍 Ubicación: `lib/mercadopago/checkout.ts` líneas 59 y 71

### 3. **Validaciones Agregadas**
- ✅ Validación de email
- ✅ Validación de items (nombre, cantidad, precio)
- ✅ Límite de título a 256 caracteres
- ✅ Validación de parámetros requeridos

### 4. **Webhook Secret**
- ✅ Variable `MP_WEBHOOK_SECRET` ya está configurada en `.env`

---

## 🧪 Cómo Probar la Integración

### Paso 1: Iniciar el Servidor
```bash
npm run dev
```

### Paso 2: Abrir la Consola del Servidor
**IMPORTANTE:** Mantén visible la terminal donde corre `npm run dev` para ver todos los logs.

### Paso 3: Realizar una Compra de Prueba

1. Ve a tu tienda: http://localhost:3000
2. Agrega productos al carrito
3. Ve al checkout
4. Selecciona **Mercado Pago** como método de pago
5. Completa todos los datos del formulario
6. Haz clic en **Pagar**

### Paso 4: Observar los Logs en la Consola

Deberías ver logs como estos:

```
=== INICIANDO CREACIÓN DE PREFERENCIA DE MERCADO PAGO ===
Order ID: abc-123
Order Number: 00001
Items count: 2
Shipping cost: 150
Total: 2350

--- createPreference: Iniciando ---
Params: { orderId: 'abc-123', orderNumber: '00001', itemsCount: 2, shippingCost: 150 }

🔑 Inicializando cliente de Mercado Pago
Access Token (primeros 20 chars): APP_USR-495644641843...
Tipo de credenciales: PRODUCCIÓN

Base URL: http://localhost:3000

--- Preference Body (Request) ---
{
  "items": [
    {
      "id": "product-123",
      "title": "Producto de Ejemplo",
      "quantity": 1,
      "unit_price": 1200,
      "currency_id": "UYU"
    }
  ],
  ...
}

Enviando request a Mercado Pago...
```

---

## 🔍 Qué Buscar en los Logs

### ✅ Si TODO Sale Bien:
```
✓ Preferencia creada exitosamente en checkout.ts
Response ID: 123456-abc-def
Init Point: https://www.mercadopago.com.uy/checkout/v1/redirect?pref_id=...
✓ Orden actualizada con preference_id
```

### ❌ Si HAY un Error:
```
=== ERROR AL CREAR PREFERENCIA DE MERCADO PAGO ===
Error completo: [AQUÍ VERÁS EL ERROR EXACTO]
Error message: [MENSAJE DEL ERROR]
```

---

## 🐛 Errores Comunes y Soluciones

### Error: "currency_id inválido"
**Causa:** Las credenciales son de Argentina pero estás usando UYU
**Solución:**
- Si tu cuenta de MP es de Argentina, cambia `UYU` por `ARS` en `lib/mercadopago/checkout.ts` líneas 59 y 71
- Si tu cuenta es de Uruguay, verifica que las credenciales sean correctas

### Error: "access_token inválido"
**Causa:** El token no es válido o expiró
**Solución:**
1. Ve a https://www.mercadopago.com.uy/developers/panel/credentials
2. Copia el **Access Token de Producción** (o TEST si es para pruebas)
3. Actualiza `MP_ACCESS_TOKEN` en `.env`
4. Reinicia el servidor

### Error: "payer.email inválido"
**Causa:** El formato del email no es válido
**Solución:** Verifica que el email ingresado en el checkout sea válido

### Error: "items[0].title es demasiado largo"
**Causa:** El nombre del producto excede 256 caracteres
**Solución:** Ya implementada - se trunca automáticamente

---

## 📝 Después de la Prueba

### Una vez que veas el error exacto:

1. **Copia el mensaje de error completo** de la consola
2. **Toma una captura de pantalla** de la consola
3. **Comparte el error** para que pueda ayudarte específicamente

---

## 🎯 Verificaciones Adicionales

### Verificar Credenciales de Mercado Pago

```bash
# En PowerShell, verifica que las variables existan:
echo $env:MP_ACCESS_TOKEN
echo $env:MP_PUBLIC_KEY
```

Deberían mostrar tus credenciales. Si están vacías:
```bash
# Reinicia el servidor después de modificar .env
npm run dev
```

### Verificar País de la Cuenta

1. Inicia sesión en https://www.mercadopago.com.uy (Uruguay) o https://www.mercadopago.com.ar (Argentina)
2. Ve a **Credenciales**
3. Verifica el país de tu cuenta
4. Usa la moneda correcta:
   - **Uruguay:** `UYU`
   - **Argentina:** `ARS`
   - **Brasil:** `BRL`
   - **México:** `MXN`

---

## 🚀 Próximos Pasos Después de Solucionar

1. ✅ Corregir el error identificado
2. ✅ Probar con tarjetas de prueba de Mercado Pago
3. ✅ Verificar que el webhook funcione correctamente
4. ✅ Probar el flujo completo: checkout → pago → webhook → actualización de orden

---

## 📞 Soporte

Si ves algún error que no entiendes, **copia y pega TODO el log de error** y te ayudaré a solucionarlo.

### Tarjetas de Prueba de Mercado Pago

Para Uruguay (UYU):
- **Visa aprobada:** 4548 8100 0000 0008
- **Mastercard aprobada:** 5031 7557 3453 0604
- CVV: cualquiera de 3 dígitos
- Fecha: cualquier fecha futura
- Nombre: cualquier nombre

Para más tarjetas: https://www.mercadopago.com.uy/developers/es/docs/checkout-api/testing

---

## ⚠️ Notas Importantes

1. **Credenciales de Producción:** Actualmente estás usando credenciales de producción. Si solo estás probando, deberías usar credenciales TEST.

2. **URL del Webhook:** Configuraste `https://n5712wbh-3000.brs.devtunnels.ms/api/mercadopago/pagos`
   - ⚠️ La ruta debería ser `/api/webhooks/mercadopago` (sin `/pagos`)
   - ✅ URL correcta: `https://n5712wbh-3000.brs.devtunnels.ms/api/webhooks/mercadopago`
   - Ve a https://www.mercadopago.com.uy/developers/panel/notifications/webhooks y actualiza la URL

3. **Dev Tunnel:** Asegúrate de que el tunnel esté activo mientras pruebas el webhook.
