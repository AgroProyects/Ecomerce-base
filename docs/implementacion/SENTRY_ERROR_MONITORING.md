# Sentry Error Monitoring - Implementación Completa

## 📋 Tabla de Contenidos

1. [Resumen](#resumen)
2. [Archivos de Configuración](#archivos-de-configuración)
3. [Integraciones Implementadas](#integraciones-implementadas)
4. [Testing](#testing)
5. [Monitoreo y Alertas](#monitoreo-y-alertas)
6. [Mejores Prácticas](#mejores-prácticas)

---

## Resumen

Sentry está completamente configurado y funcionando en la aplicación para monitorear errores en tiempo real, tanto en el servidor como en el cliente.

### ✅ Estado de Implementación

- ✅ **Servidor**: Configurado con sanitización de datos sensibles
- ✅ **Cliente**: Configurado con Session Replay para debugging visual
- ✅ **Edge Runtime**: Configurado para middleware y edge routes
- ✅ **API Routes**: Integrado en endpoints críticos (checkout, webhooks, auth)
- ✅ **Server Actions**: Integrado en acciones críticas (checkout, orders)
- ✅ **Variables de Entorno**: Configuradas correctamente
- ✅ **Endpoint de Testing**: Disponible para verificar funcionamiento

### 🎯 Beneficios Clave

1. **Detección Proactiva**: Errores reportados automáticamente antes de que usuarios los reporten
2. **Debugging Visual**: Session Replay graba la sesión del usuario cuando ocurre un error
3. **Contexto Rico**: Cada error incluye tags, metadata y stack traces completos
4. **Privacidad**: Datos sensibles (passwords, tarjetas, tokens) automáticamente redactados
5. **Performance**: Sampling configurado (10% en producción) para minimizar costos

---

## Archivos de Configuración

### 1. Server Configuration ([sentry.server.config.ts](../../sentry.server.config.ts))

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sendDefaultPii: false,

  // Ignorar errores comunes no críticos
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'AbortError',
    'Network request failed',
  ],

  // Sanitizar datos sensibles antes de enviar a Sentry
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Sentry event (dev mode):', event);
      return null; // No enviar en desarrollo
    }

    // Redactar datos sensibles
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.password) data.password = '[REDACTED]';
      if (data.cardNumber) data.cardNumber = '[REDACTED]';
      if (data.cvv) data.cvv = '[REDACTED]';
      if (data.token) data.token = '[REDACTED]';
    }

    return event;
  },
})
```

**Características Clave:**
- ✅ No envía errores en desarrollo (ahorro de cuota)
- ✅ Sampling 10% en producción (reduce costos)
- ✅ Sanitiza passwords, tarjetas, tokens automáticamente
- ✅ Ignora errores comunes del navegador

### 2. Client Configuration ([sentry.client.config.ts](../../sentry.client.config.ts))

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay: Graba sesiones para debugging visual
  replaysSessionSampleRate: 0.1,       // 10% de sesiones normales
  replaysOnErrorSampleRate: 1.0,       // 100% cuando hay error

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,        // Ocultar texto sensible
      blockAllMedia: true,      // Ocultar imágenes/videos
      maskAllInputs: true,      // Ocultar inputs
    }),
  ],
})
```

**Session Replay:**
- 📹 Graba la sesión del usuario cuando ocurre un error
- 🔒 Todo el texto e inputs están enmascarados por privacidad
- 🎥 Permite ver exactamente qué hizo el usuario antes del error

### 3. Edge Configuration ([sentry.edge.config.ts](../../sentry.edge.config.ts))

Configuración simplificada para middleware y edge routes.

---

## Integraciones Implementadas

### API Routes con Sentry

#### 1. Checkout - Mercado Pago ([app/api/mercadopago/process-payment/route.ts](../../app/api/mercadopago/process-payment/route.ts:149-161))

```typescript
catch (error) {
  // Capturar error en Sentry con contexto útil
  Sentry.captureException(error, {
    tags: {
      module: 'checkout',
      endpoint: '/api/mercadopago/process-payment',
      payment_method: 'mercadopago',
    },
    extra: {
      hasBody: !!request.body,
      // NO incluir datos sensibles como token o tarjeta
    },
    level: 'error',
  })

  return NextResponse.json({ error: '...' }, { status: 500 })
}
```

#### 2. Webhooks - Mercado Pago ([app/api/webhooks/mercadopago/route.ts](../../app/api/webhooks/mercadopago/route.ts:121-130))

```typescript
catch (error) {
  // Capturar error crítico en Sentry
  Sentry.captureException(error, {
    tags: {
      module: 'webhooks',
      endpoint: '/api/webhooks/mercadopago',
    },
    level: 'error',
    extra: {
      webhookBody: body,
    },
  })
}
```

#### 3. Registro de Usuarios ([app/api/auth/register/route.ts](../../app/api/auth/register/route.ts:137-148))

```typescript
catch (emailError) {
  // Capturar error de email en Sentry
  Sentry.captureException(emailError, {
    tags: {
      module: 'auth',
      endpoint: '/api/auth/register',
      error_type: 'email_sending',
    },
    extra: {
      userId: authData.user.id,
      // NO incluir el email completo por privacidad
    },
    level: 'warning',
  })
}
```

### Server Actions con Sentry

#### 1. Process Checkout ([actions/checkout/process.ts](../../actions/checkout/process.ts:327-341))

```typescript
catch (error) {
  // Capturar error en Sentry
  Sentry.captureException(error, {
    tags: {
      module: 'checkout',
      action: 'processCheckout',
      payment_method: 'mercadopago',
      error_type: 'preference_creation',
    },
    extra: {
      orderId: order.id,
      orderNumber: order.order_number,
      itemsCount: items.length,
      totalAmount: total,
    },
    level: 'error',
  })
}
```

#### 2. Create Order ([actions/orders/mutations.ts](../../actions/orders/mutations.ts:135-145))

```typescript
catch (error) {
  // Capturar error en Sentry
  Sentry.captureException(error, {
    tags: {
      module: 'orders',
      action: 'createOrder',
    },
    extra: {
      itemsCount: input.items?.length || 0,
    },
    level: 'error',
  })
}
```

---

## Testing

### 1. Endpoint de Testing

**Ubicación**: [app/api/sentry-example-api/route.ts](../../app/api/sentry-example-api/route.ts)

**Uso**:

```bash
# Test 1: Enviar un error de prueba
curl http://localhost:3000/api/sentry-example-api?type=error

# Test 2: Enviar un mensaje informativo
curl http://localhost:3000/api/sentry-example-api?type=message

# Test 3: Enviar una advertencia
curl http://localhost:3000/api/sentry-example-api?type=warning
```

**Resultado Esperado**:
- El error/mensaje/warning aparece en tu Dashboard de Sentry
- En desarrollo: Solo aparece en la consola (no se envía a Sentry)
- En producción: Se envía a Sentry con todos los tags y metadata

### 2. Testing Manual en Código

```typescript
// En cualquier API route o server action
import * as Sentry from '@sentry/nextjs'

// Capturar un mensaje
Sentry.captureMessage('Test message', 'info')

// Capturar una excepción
try {
  throw new Error('Test error')
} catch (e) {
  Sentry.captureException(e, {
    tags: { test: 'true' },
    extra: { timestamp: Date.now() }
  })
}
```

### 3. Verificación en Dashboard de Sentry

1. Ve a [https://sentry.io](https://sentry.io)
2. Selecciona tu proyecto
3. Deberías ver los errores de prueba en "Issues"
4. Haz click en un error para ver:
   - Stack trace completo
   - Tags y metadata
   - Session Replay (si fue en el cliente)
   - Breadcrumbs (acciones previas del usuario)

---

## Monitoreo y Alertas

### Dashboard de Sentry

**Métricas Clave a Monitorear**:

1. **Error Rate**: Porcentaje de requests con errores
2. **Most Frequent Errors**: Los errores más comunes
3. **Performance**: Transacciones lentas
4. **Release Health**: Crashes y adoption de nuevas versiones

### Configurar Alertas

**Recomendaciones**:

```yaml
Alertas Sugeridas:
  - Error rate > 5% en 5 minutos → Alerta inmediata
  - Nuevo tipo de error → Alerta inmediata
  - Error en checkout/payments → Alerta crítica
  - Error en webhooks → Alerta alta prioridad
```

**Configuración en Sentry**:
1. Project Settings → Alerts
2. Create Alert Rule
3. Condición: "When event frequency is > X"
4. Action: Email / Slack / PagerDuty

---

## Mejores Prácticas

### ✅ DO - Qué Hacer

1. **Usar Tags para Filtrar**
   ```typescript
   Sentry.captureException(error, {
     tags: {
       module: 'checkout',      // Módulo afectado
       payment_method: 'mp',    // Método de pago
       user_type: 'premium',    // Tipo de usuario
     }
   })
   ```

2. **Agregar Contexto Útil**
   ```typescript
   Sentry.captureException(error, {
     extra: {
       orderId: '12345',
       itemsCount: 3,
       totalAmount: 150.00,
       // Datos que ayuden a reproducir el error
     }
   })
   ```

3. **Usar Niveles Apropiados**
   ```typescript
   Sentry.captureMessage('Info', 'info')      // Informativo
   Sentry.captureMessage('Warning', 'warning') // Advertencia
   Sentry.captureException(error, { level: 'error' })   // Error
   Sentry.captureException(error, { level: 'fatal' })   // Crítico
   ```

4. **Capturar Errores Esperados como Warnings**
   ```typescript
   // Si el error es "esperado" pero quieres monitorearlo
   if (emailError) {
     Sentry.captureException(emailError, {
       level: 'warning',  // No es crítico, pero queremos saberlo
     })
   }
   ```

### ❌ DON'T - Qué NO Hacer

1. **NO Enviar Datos Sensibles**
   ```typescript
   // ❌ MAL
   Sentry.captureException(error, {
     extra: {
       password: user.password,      // NUNCA
       cardNumber: payment.card,     // NUNCA
       token: session.token,         // NUNCA
     }
   })

   // ✅ BIEN
   Sentry.captureException(error, {
     extra: {
       userId: user.id,              // OK
       hasPassword: !!user.password, // OK (booleano)
       paymentMethod: 'card',        // OK (tipo, no número)
     }
   })
   ```

2. **NO Capturar Errores Esperados como Errores**
   ```typescript
   // ❌ MAL - Validation errors no son "errores"
   if (!email) {
     Sentry.captureException(new Error('Email required'))
     return { error: 'Email required' }
   }

   // ✅ BIEN - Solo capturar errores inesperados
   try {
     await sendEmail(email)
   } catch (error) {
     Sentry.captureException(error)  // Esto sí es inesperado
   }
   ```

3. **NO Ignorar el beforeSend Hook**
   - Siempre sanitiza datos antes de enviar
   - Usa el hook `beforeSend` en la configuración

---

## Variables de Entorno

### Archivo `.env`

```bash
# Sentry Error Monitoring
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```

### Explicación

- `SENTRY_DSN`: Usado en servidor (server.config.ts)
- `NEXT_PUBLIC_SENTRY_DSN`: Usado en cliente (client.config.ts)
- Mismo valor para ambos (pueden ser proyectos diferentes si prefieres)

---

## Resumen de Archivos Modificados

### Configuración (3 archivos)
- ✅ [sentry.server.config.ts](../../sentry.server.config.ts) - Configuración servidor
- ✅ [sentry.client.config.ts](../../sentry.client.config.ts) - Configuración cliente
- ✅ [sentry.edge.config.ts](../../sentry.edge.config.ts) - Configuración edge

### API Routes (4 archivos)
- ✅ [app/api/mercadopago/process-payment/route.ts](../../app/api/mercadopago/process-payment/route.ts)
- ✅ [app/api/webhooks/mercadopago/route.ts](../../app/api/webhooks/mercadopago/route.ts)
- ✅ [app/api/auth/register/route.ts](../../app/api/auth/register/route.ts)
- ✅ [app/api/sentry-example-api/route.ts](../../app/api/sentry-example-api/route.ts)

### Server Actions (2 archivos)
- ✅ [actions/checkout/process.ts](../../actions/checkout/process.ts)
- ✅ [actions/orders/mutations.ts](../../actions/orders/mutations.ts)

### Variables de Entorno (1 archivo)
- ✅ [.env](.env) - Agregado NEXT_PUBLIC_SENTRY_DSN

---

## Próximos Pasos Recomendados

1. **Configurar Alertas en Sentry Dashboard**
   - Alertas para error rate > 5%
   - Alertas para errores críticos (checkout, payments)

2. **Integrar con Slack/Discord** (Opcional)
   - Recibir notificaciones en tiempo real
   - Settings → Integrations → Slack

3. **Configurar Release Tracking** (Opcional)
   - Asociar errores con versiones específicas
   - Útil para identificar rápidamente qué deployment causó errores

4. **Habilitar Performance Monitoring** (Opcional)
   - Monitorear transacciones lentas
   - Identificar cuellos de botella

---

## Soporte

**Documentación Oficial**: [https://docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

**Dashboard**: [https://sentry.io](https://sentry.io)

**Issues Conocidos**: Ninguno actualmente

---

**Implementado**: ✅ 100% Completo
**Testing**: ✅ Endpoint disponible
**Producción**: ✅ Listo para deploy
