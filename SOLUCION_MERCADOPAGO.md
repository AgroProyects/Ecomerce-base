# Soluciones para el Error de Mercado Pago

## Solucion Inmediata (Debug y Diagnostico)

### Paso 1: Agregar Logging Detallado

Modificar el archivo `actions/checkout/process.ts` para capturar errores correctamente:

**Ubicacion**: Lineas 272-314

**ANTES:**
```typescript
if (customer.paymentMethod === 'mercadopago') {
  // Crear preferencia de Mercado Pago
  try {
    const preference = await createPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      items: cartItemsForMP,
      customer,
      shippingCost,
    })
    // ...
  } catch {
    // ...
    return {
      success: false,
      error: 'Error al procesar el pago. Por favor, intenta nuevamente.',
    }
  }
}
```

**DESPUES:**
```typescript
if (customer.paymentMethod === 'mercadopago') {
  // Crear preferencia de Mercado Pago
  try {
    console.log('=== MERCADO PAGO DEBUG ===')
    console.log('1. Orden ID:', order.id)
    console.log('2. Items a procesar:', JSON.stringify(cartItemsForMP, null, 2))
    console.log('3. Datos del cliente:', {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    })
    console.log('4. Costo de envio:', shippingCost)
    console.log('5. Access Token configurado:', process.env.MP_ACCESS_TOKEN ? 'SI' : 'NO')
    console.log('6. Access Token (primeros 20 chars):', process.env.MP_ACCESS_TOKEN?.substring(0, 20))

    const preference = await createPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      items: cartItemsForMP,
      customer,
      shippingCost,
    })

    console.log('7. Preferencia creada exitosamente:', {
      id: preference.id,
      initPoint: preference.initPoint,
    })
    console.log('=== FIN DEBUG ===')

    // Actualizar orden con ID de preferencia
    await supabase
      .from('orders')
      .update({ mp_preference_id: preference.id })
      .eq('id', order.id)

    return {
      success: true,
      data: {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        paymentMethod: 'mercadopago',
        preferenceId: preference.id,
        initPoint: preference.initPoint,
      },
    }
  } catch (error) {
    console.error('=== ERROR MERCADO PAGO ===')
    console.error('Tipo de error:', typeof error)
    console.error('Error completo:', error)

    if (error instanceof Error) {
      console.error('Error.message:', error.message)
      console.error('Error.name:', error.name)
      console.error('Error.stack:', error.stack)
    }

    if (error && typeof error === 'object') {
      console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    }

    // Si el error viene de Mercado Pago SDK, puede tener estructura especial
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error('Error.cause:', error.cause)
    }

    console.error('=== FIN ERROR ===')

    // Marcar la orden como fallida pero no eliminarla
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: `Error al crear preferencia de pago: ${errorMessage}`,
      })
      .eq('id', order.id)

    return {
      success: false,
      error: `Error al procesar el pago: ${errorMessage}. Por favor, contacta a soporte.`,
    }
  }
}
```

### Paso 2: Agregar Logging a createPreference

Modificar `lib/mercadopago/checkout.ts`:

**ANTES:**
```typescript
export async function createPreference({
  orderId,
  orderNumber,
  items,
  customer,
  shippingCost,
}: CreatePreferenceParams): Promise<PreferenceResult> {
  const client = getMercadoPagoClient()
  const preference = new Preference(client)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const preferenceItems = items.map((item) => {
    // ...
  })

  const preferenceBody = {
    // ...
  }

  const response = await preference.create({
    body: preferenceBody,
  })

  if (!response.id || !response.init_point) {
    throw new Error('Error al crear la preferencia de pago')
  }

  return {
    id: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point || response.init_point,
  }
}
```

**DESPUES:**
```typescript
export async function createPreference({
  orderId,
  orderNumber,
  items,
  customer,
  shippingCost,
}: CreatePreferenceParams): Promise<PreferenceResult> {
  try {
    console.log('[createPreference] Iniciando creacion de preferencia')

    const client = getMercadoPagoClient()
    console.log('[createPreference] Cliente MP obtenido')

    const preference = new Preference(client)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('[createPreference] Base URL:', baseUrl)

    const preferenceItems = items.map((item) => {
      const itemId = item.variant?.id || item.product.id

      return {
        id: itemId,
        title: item.variant
          ? `${item.product.name} - ${item.variant.name}`
          : item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'UYU', // CAMBIADO: Uruguay usa UYU, no ARS
        picture_url: item.product.images[0] || undefined,
      }
    })

    // Agregar costo de envio si existe
    if (shippingCost > 0) {
      preferenceItems.push({
        id: 'shipping',
        title: 'Costo de envio',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'UYU', // CAMBIADO: Uruguay usa UYU, no ARS
        picture_url: undefined,
      })
    }

    console.log('[createPreference] Items procesados:', preferenceItems.length)
    console.log('[createPreference] Items detalle:', JSON.stringify(preferenceItems, null, 2))

    const preferenceBody = {
      items: preferenceItems,
      payer: {
        name: customer.name.split(' ')[0],
        surname: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: {
          area_code: '',
          number: customer.phone || '',
        },
        address: {
          street_name: customer.address.street,
          street_number: customer.address.number,
          zip_code: customer.address.postal_code,
        },
      },
      back_urls: {
        success: `${baseUrl}/checkout/success?order_id=${orderId}`,
        failure: `${baseUrl}/checkout/failure?order_id=${orderId}`,
        pending: `${baseUrl}/checkout/pending?order_id=${orderId}`,
      },
      auto_return: 'approved' as const,
      external_reference: orderId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'TIENDA ONLINE',
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
      },
    }

    console.log('[createPreference] Preference body preparado:', JSON.stringify(preferenceBody, null, 2))

    console.log('[createPreference] Enviando request a Mercado Pago...')
    const response = await preference.create({
      body: preferenceBody,
    })

    console.log('[createPreference] Respuesta de MP recibida:', {
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    })

    if (!response.id || !response.init_point) {
      console.error('[createPreference] Respuesta invalida de MP:', response)
      throw new Error('Error al crear la preferencia de pago: respuesta invalida de Mercado Pago')
    }

    console.log('[createPreference] Preferencia creada exitosamente')

    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point || response.init_point,
    }
  } catch (error) {
    console.error('[createPreference] Error al crear preferencia:', error)

    if (error instanceof Error) {
      console.error('[createPreference] Error.message:', error.message)
      console.error('[createPreference] Error.stack:', error.stack)
    }

    // Re-lanzar el error para que lo capture el nivel superior
    throw error
  }
}
```

---

## Solucion Permanente (Corregir la Implementacion)

### Opcion 1: Usar preferences.ts (RECOMENDADO)

Esta es la solucion mas rapida y robusta.

**1. Modificar `actions/checkout/process.ts`:**

Cambiar la linea 4:
```typescript
// ANTES:
import { createPreference } from '@/lib/mercadopago/checkout'

// DESPUES:
import { createPreference } from '@/lib/mercadopago/preferences'
```

**2. Modificar `lib/mercadopago/preferences.ts`:**

Cambiar la moneda de ARS a UYU (lineas 64 y 78):

```typescript
// ANTES:
currency_id: 'ARS', // Peso argentino

// DESPUES:
currency_id: 'UYU', // Peso uruguayo
```

**3. Agregar validaciones adicionales:**

En `lib/mercadopago/preferences.ts`, despues de la linea 48, agregar:

```typescript
// Validar items antes de crear la preferencia
const items = input.items.map((item) => {
  // Validaciones
  if (!item.product || !item.product.id) {
    throw new Error('Item sin producto valido')
  }

  if (item.quantity <= 0) {
    throw new Error(`Cantidad invalida para ${item.product.name}: ${item.quantity}`)
  }

  if (item.unitPrice <= 0) {
    throw new Error(`Precio invalido para ${item.product.name}: ${item.unitPrice}`)
  }

  const productName = item.variant
    ? `${item.product.name} - ${item.variant.name}`
    : item.product.name

  // Mercado Pago limita el titulo a 256 caracteres
  const title = productName.length > 256 ? productName.substring(0, 253) + '...' : productName

  return {
    id: item.variant?.id || item.product.id,
    title,
    description: item.product.name,
    picture_url: item.product.images?.[0] || undefined,
    category_id: 'products',
    quantity: item.quantity,
    currency_id: 'UYU', // Peso uruguayo
    unit_price: item.unitPrice,
  }
})
```

### Opcion 2: Corregir checkout.ts

Si prefieres mantener checkout.ts, aqui estan las correcciones necesarias:

**1. Cambiar moneda:**
```typescript
currency_id: 'UYU', // En lugar de 'ARS'
```

**2. Agregar try-catch:**
```typescript
export async function createPreference({
  orderId,
  orderNumber,
  items,
  customer,
  shippingCost,
}: CreatePreferenceParams): Promise<PreferenceResult> {
  try {
    // ... codigo existente ...
  } catch (error) {
    console.error('[createPreference] Error:', error)
    throw error
  }
}
```

**3. Agregar auto_return:**
```typescript
const preferenceBody = {
  // ... campos existentes ...
  auto_return: 'approved' as const,
}
```

**4. Agregar validaciones:**
```typescript
const preferenceItems = items.map((item) => {
  if (item.quantity <= 0) {
    throw new Error(`Cantidad invalida: ${item.quantity}`)
  }

  if (item.unitPrice <= 0) {
    throw new Error(`Precio invalido: ${item.unitPrice}`)
  }

  const itemId = item.variant?.id || item.product.id
  const title = item.variant
    ? `${item.product.name} - ${item.variant.name}`
    : item.product.name

  return {
    id: itemId,
    title: title.substring(0, 256), // Limitar a 256 chars
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: 'UYU',
    picture_url: item.product.images[0] || undefined,
  }
})
```

---

## Verificacion de Credenciales

### Paso 1: Verificar el Pais de la Cuenta

Las credenciales actuales son de Argentina (usan ARS), pero si la tienda es de Uruguay, necesitas:

1. Crear una cuenta de Mercado Pago Uruguay
2. Obtener credenciales de Uruguay (usan UYU)
3. Actualizar las variables de entorno

### Paso 2: Usar Credenciales de TEST en Desarrollo

Para desarrollo, usa credenciales TEST:

```env
# .env
MP_ACCESS_TOKEN=TEST-4956446418432939-120722-...
MP_PUBLIC_KEY=TEST-4964dfb8-55cb-4f3d-...
```

Las credenciales TEST empiezan con `TEST-` en lugar de `APP_USR-`.

### Paso 3: Verificar Credenciales en el Panel

1. Ir a https://www.mercadopago.com.uy/developers/panel/app (o .com.ar segun pais)
2. Seleccionar tu aplicacion
3. Verificar que las credenciales esten activas
4. Copiar las credenciales correctas (TEST para desarrollo, PROD para produccion)

---

## Script de Verificacion

Crear un archivo `scripts/test-mercadopago.ts`:

```typescript
import { getMercadoPagoClient } from '@/lib/mercadopago/client'
import { Preference } from 'mercadopago'

async function testMercadoPago() {
  try {
    console.log('=== TEST MERCADO PAGO ===')

    // 1. Verificar credenciales
    console.log('1. Verificando credenciales...')
    const accessToken = process.env.MP_ACCESS_TOKEN
    console.log('   Access Token presente:', !!accessToken)
    console.log('   Access Token tipo:', accessToken?.startsWith('TEST-') ? 'TEST' : 'PRODUCCION')
    console.log('   Access Token (primeros 20):', accessToken?.substring(0, 20))

    // 2. Crear cliente
    console.log('2. Creando cliente...')
    const client = getMercadoPagoClient()
    console.log('   Cliente creado: OK')

    // 3. Crear preferencia de prueba
    console.log('3. Creando preferencia de prueba...')
    const preference = new Preference(client)

    const testPreference = await preference.create({
      body: {
        items: [
          {
            id: 'test-item',
            title: 'Producto de Prueba',
            quantity: 1,
            unit_price: 100,
            currency_id: 'UYU', // Cambiar segun pais
          }
        ],
        payer: {
          email: 'test@test.com',
        },
        back_urls: {
          success: 'http://localhost:3000/success',
          failure: 'http://localhost:3000/failure',
          pending: 'http://localhost:3000/pending',
        },
        external_reference: 'test-' + Date.now(),
      }
    })

    console.log('   Preferencia creada: OK')
    console.log('   ID:', testPreference.id)
    console.log('   Init Point:', testPreference.init_point)

    console.log('=== TEST EXITOSO ===')
    return true
  } catch (error) {
    console.error('=== TEST FALLIDO ===')
    console.error('Error:', error)

    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }

    return false
  }
}

testMercadoPago()
  .then(success => {
    console.log('\nResultado:', success ? 'EXITO' : 'FALLO')
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Error no capturado:', error)
    process.exit(1)
  })
```

Ejecutar con:
```bash
npx tsx scripts/test-mercadopago.ts
```

---

## Checklist de Solucion

- [ ] Agregar logging detallado en `actions/checkout/process.ts`
- [ ] Agregar logging en `lib/mercadopago/checkout.ts`
- [ ] Cambiar moneda de ARS a UYU (si es Uruguay)
- [ ] Agregar validaciones de items (quantity > 0, price > 0)
- [ ] Agregar try-catch apropiado
- [ ] Verificar credenciales en panel de MP
- [ ] Usar credenciales TEST en desarrollo
- [ ] Verificar pais de la cuenta MP
- [ ] Ejecutar script de verificacion
- [ ] Probar checkout completo
- [ ] Revisar logs de servidor durante la prueba
- [ ] Verificar que se cree la preferencia correctamente
- [ ] Verificar redireccion a Mercado Pago

---

## Contacto con Soporte de Mercado Pago

Si despues de estas correcciones sigue el error:

1. **Recopilar informacion**:
   - Logs completos del error
   - Credenciales usadas (ocultando valores sensibles)
   - Datos enviados en la preferencia
   - Respuesta de la API de MP

2. **Contactar soporte**:
   - Email: developers@mercadopago.com
   - Forum: https://www.mercadopago.com.uy/developers/es/support
   - Panel de desarrolladores > Soporte

3. **Informacion a proporcionar**:
   - ID de la aplicacion
   - Timestamp del error
   - Logs del request/response
   - Pais de operacion
   - Tipo de integracion (Checkout Pro)
