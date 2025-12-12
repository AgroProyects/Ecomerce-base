# Diagnostico de Error "Algo salio mal" - Mercado Pago

## Fecha: 2025-12-11

## Resumen del Problema
Cuando el usuario ingresa los datos de la tarjeta y ejecuta el pago, aparece un error generico "algo salio mal" sin detalles especificos.

---

## Analisis de la Implementacion Actual

### 1. PROBLEMA CRITICO: Archivos Duplicados de createPreference

Se encontraron **DOS implementaciones diferentes** de la funcion `createPreference`:

#### Archivo 1: `lib/mercadopago/checkout.ts` (USADO ACTUALMENTE)
- **Ubicacion**: `c:\Users\EnzoP\OneDrive\Escritorio\Proyectos 2026 ENZO - VALE\eccomerce_base\lib\mercadopago\checkout.ts`
- **Importado por**: `actions/checkout/process.ts` (linea 4)
- **Cliente usado**: `getMercadoPagoClient()` de `lib/mercadopago/client.ts`
- **Caracteristicas**:
  - Implementacion mas simple
  - No incluye logging detallado
  - No maneja errores con detalle
  - Falta manejo de excepciones especificas

#### Archivo 2: `lib/mercadopago/preferences.ts` (NO USADO)
- **Ubicacion**: `c:\Users\EnzoP\OneDrive\Escritorio\Proyectos 2026 ENZO - VALE\eccomerce_base\lib\mercadopago\preferences.ts`
- **Cliente usado**: `mercadoPagoClient` de `lib/mercadopago/config.ts`
- **Caracteristicas**:
  - Implementacion mas completa
  - Incluye logging con `mpLog` y `mpError`
  - Mejor manejo de errores
  - Mas configuraciones (auto_return, expires, payment_methods, etc.)
  - Validaciones adicionales

**IMPORTANTE**: Actualmente se esta usando la version menos completa (checkout.ts) que NO tiene logging ni manejo robusto de errores.

---

### 2. Problemas Identificados en el Flujo de Pago

#### 2.1 Manejo de Errores Insuficiente

**En `actions/checkout/process.ts` (lineas 300-314):**
```typescript
} catch {
  // Marcar la orden como fallida pero no eliminarla
  await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: 'Error al crear preferencia de pago',
    })
    .eq('id', order.id)

  return {
    success: false,
    error: 'Error al procesar el pago. Por favor, intenta nuevamente.',
  }
}
```

**PROBLEMAS:**
- El `catch` no captura el error especifico (catch sin parametros)
- No se loguea el error real
- El usuario recibe un mensaje generico sin detalles
- No se puede diagnosticar que fallo exactamente

#### 2.2 Falta de Validacion de Credenciales

**En `lib/mercadopago/client.ts`:**
```typescript
export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no esta configurado')
  }
  // ...
}
```

**PROBLEMAS:**
- Solo valida que exista el token
- No valida que el token sea valido
- No verifica que el token tenga el formato correcto (APP_USR-...)

#### 2.3 Problemas en la Creacion de Preferencia

**En `lib/mercadopago/checkout.ts` (lineas 89-94):**
```typescript
const response = await preference.create({
  body: preferenceBody,
})

if (!response.id || !response.init_point) {
  throw new Error('Error al crear la preferencia de pago')
}
```

**PROBLEMAS:**
- No hay try-catch especifico
- Si falla la API de Mercado Pago, el error no se captura adecuadamente
- No se validan otros campos de la respuesta
- El error lanzado es muy generico

#### 2.4 Configuracion de Items

**Posibles problemas en `preferenceItems`:**
```typescript
const preferenceItems = items.map((item) => {
  const itemId = item.variant?.id || item.product.id

  return {
    id: itemId,
    title: item.variant
      ? `${item.product.name} - ${item.variant.name}`
      : item.product.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: 'ARS',
    picture_url: item.product.images[0] || undefined,
  }
})
```

**VALIDACIONES FALTANTES:**
- No valida que `quantity` sea > 0
- No valida que `unit_price` sea > 0
- No valida que el titulo no exceda el limite de caracteres de MP
- `picture_url` puede ser undefined pero deberia ser string o no existir

#### 2.5 Configuracion del Payer

**Problema potencial en la division del nombre:**
```typescript
payer: {
  name: customer.name.split(' ')[0],
  surname: customer.name.split(' ').slice(1).join(' ') || '',
  email: customer.email,
  // ...
}
```

**PROBLEMAS:**
- Si el nombre tiene caracteres especiales puede fallar
- Si el nombre esta vacio, enviara strings vacios
- No valida que el email tenga formato valido

---

### 3. Configuracion de Credenciales

**Estado actual de las variables de entorno (.env):**
```
MP_ACCESS_TOKEN=APP_USR-4956446418432939-120722-479b8467ef375af005bea04541450227-3043495025
MP_PUBLIC_KEY=APP_USR-4964dfb8-55cb-4f3d-a281-7ea12cb44c9f
MP_WEBHOOK_SECRET=(vacio)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**ANALISIS:**
- Access Token: Formato correcto (APP_USR-...) - Produccion
- Public Key: Formato correcto (APP_USR-...) - Produccion
- Webhook Secret: No configurado (no es critico)
- App URL: Correcto para desarrollo

**ATENCION**: Estas son credenciales de PRODUCCION, no de TEST. Si se esta en desarrollo, deberian usarse credenciales de TEST que empiezan con "TEST-".

---

### 4. Flujo de Checkout Actual

```
1. Usuario completa formulario en checkout/page.tsx
2. Submit del formulario llama a processCheckout (actions/checkout/process.ts)
3. processCheckout:
   - Valida email verificado
   - Valida productos y stock
   - Crea orden en DB
   - Llama a createPreference (lib/mercadopago/checkout.ts)
4. createPreference:
   - Crea cliente de Mercado Pago
   - Construye items y datos del payer
   - Llama a preference.create()
   - Retorna initPoint o lanza error
5. Si exito: Redirige a Mercado Pago
   Si error: Muestra "Error al procesar el pago"
```

**PUNTO DE FALLA MAS PROBABLE**:
Paso 4 - La llamada a `preference.create()` esta fallando pero el error no se captura ni se loguea correctamente.

---

## Posibles Causas del Error

### Causas Mas Probables (Ordenadas por probabilidad):

1. **Error en la API de Mercado Pago no capturado**
   - La API retorna un error pero no se loguea
   - Posibles razones:
     - Credenciales invalidas o expiradas
     - Formato incorrecto en los datos enviados
     - Limite de tasa excedido
     - Problemas de red

2. **Validacion de datos falla en MP**
   - Precio en 0 o negativo
   - Cantidad en 0 o negativa
   - Titulo muy largo
   - Email invalido
   - Datos del payer incompletos

3. **Problema con el tipo de moneda**
   - Usando 'ARS' pero la cuenta puede ser de otro pais
   - Uruguay usa UYU, no ARS

4. **Problema con picture_url**
   - URL invalida
   - URL no accesible desde MP
   - Formato incorrecto

5. **Problema con back_urls o notification_url**
   - URLs no accesibles publicamente (localhost)
   - Formato incorrecto

---

## Informacion Adicional Necesaria

Para diagnosticar completamente el problema, necesitamos:

1. **Logs del servidor**: Verificar la consola cuando se ejecuta el pago
2. **Respuesta exacta de Mercado Pago**: Ver que error retorna la API
3. **Datos de prueba**: Que productos se estan comprando, precios, etc.
4. **Network tab del navegador**: Ver la respuesta del endpoint /checkout/process
5. **Logs de Mercado Pago**: En el panel de desarrolladores de MP

---

## Proximos Pasos Recomendados

### Paso 1: Habilitar Logging Completo (URGENTE)
- Modificar `actions/checkout/process.ts` para capturar y loguear errores
- Agregar console.log antes y despues de createPreference
- Capturar el error completo de Mercado Pago

### Paso 2: Cambiar a la Implementacion Correcta
- Cambiar el import en `actions/checkout/process.ts`
- Usar `lib/mercadopago/preferences.ts` en lugar de `checkout.ts`
- Esta version tiene mejor manejo de errores y logging

### Paso 3: Validar Credenciales
- Verificar que las credenciales sean validas en el panel de MP
- Si esta en desarrollo, cambiar a credenciales TEST
- Verificar permisos de la aplicacion en MP

### Paso 4: Agregar Validaciones
- Validar datos antes de enviar a MP
- Validar precios > 0
- Validar cantidades > 0
- Validar formato de email

### Paso 5: Configuracion de Moneda
- **CRITICO**: Verificar si la cuenta es de Uruguay o Argentina
- Si es Uruguay, cambiar 'ARS' por 'UYU' en toda la aplicacion
- Verificar que los precios esten en la moneda correcta

---

## Codigo de Solucion Temporal

Para obtener el error especifico, modificar `actions/checkout/process.ts`:

```typescript
// Linea 274-314, reemplazar el try-catch por:
try {
  console.log('[MP] Creando preferencia para orden:', order.id)
  console.log('[MP] Items:', JSON.stringify(cartItemsForMP, null, 2))
  console.log('[MP] Customer:', JSON.stringify(customer, null, 2))
  console.log('[MP] Shipping:', shippingCost)

  const preference = await createPreference({
    orderId: order.id,
    orderNumber: order.order_number,
    items: cartItemsForMP,
    customer,
    shippingCost,
  })

  console.log('[MP] Preferencia creada:', preference)

  // ... resto del codigo
} catch (error) {
  console.error('[MP] Error completo:', error)
  console.error('[MP] Error mensaje:', error instanceof Error ? error.message : 'Unknown error')
  console.error('[MP] Error stack:', error instanceof Error ? error.stack : 'No stack')

  // Si es un error de Mercado Pago, intentar extraer detalles
  if (error && typeof error === 'object') {
    console.error('[MP] Error details:', JSON.stringify(error, null, 2))
  }

  // Marcar la orden como fallida
  await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: `Error al crear preferencia: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    })
    .eq('id', order.id)

  return {
    success: false,
    error: `Error al procesar el pago: ${error instanceof Error ? error.message : 'Por favor, intenta nuevamente.'}`,
  }
}
```

---

## Resumen de Archivos Relevantes

1. **Frontend (Checkout)**:
   - `app/(store)/checkout/page.tsx` - Formulario de checkout

2. **Backend (Procesamiento)**:
   - `actions/checkout/process.ts` - Logica principal de checkout
   - `lib/mercadopago/checkout.ts` - Creacion de preferencia (USADO)
   - `lib/mercadopago/preferences.ts` - Creacion de preferencia (NO USADO, MAS COMPLETO)
   - `lib/mercadopago/client.ts` - Cliente de MP
   - `lib/mercadopago/config.ts` - Configuracion y utilidades

3. **Webhooks**:
   - `app/api/webhooks/mercadopago/route.ts` - Recibe notificaciones de MP
   - `lib/mercadopago/webhooks.ts` - Procesa webhooks

4. **Configuracion**:
   - `.env` - Variables de entorno

---

## Conclusion

El error "algo salio mal" es causado por:

1. **Manejo deficiente de errores** que no captura ni muestra el error real
2. **Falta de logging** que impide diagnosticar el problema
3. **Uso de implementacion incompleta** (checkout.ts en lugar de preferences.ts)
4. **Posible problema de moneda** (usando ARS en lugar de UYU si es Uruguay)
5. **Validaciones insuficientes** de datos antes de enviar a MP

**Recomendacion inmediata**: Agregar logging completo y cambiar a la implementacion de preferences.ts que tiene mejor manejo de errores.
