# 🔑 Cómo Obtener Credenciales TEST de Mercado Pago

## 🎯 Problema Actual

Estás intentando usar **tarjetas de prueba** con **credenciales de producción**, lo que causa este error:

```
❌ "Algo salió mal... Una de las partes con la que intentas hacer el pago es de prueba."
```

## ✅ Solución: Obtener Credenciales TEST

### Paso 1: Acceder al Panel de Desarrolladores

1. Ve a: https://www.mercadopago.com.uy/developers/panel/credentials
2. Inicia sesión con tu cuenta de Mercado Pago

### Paso 2: Seleccionar Credenciales de Prueba

En el panel verás dos pestañas:
- **Credenciales de producción** ← Aquí están tus credenciales actuales
- **Credenciales de prueba** ← Aquí debes ir

Haz clic en **"Credenciales de prueba"** o **"TEST"**

### Paso 3: Copiar las Credenciales

Verás dos credenciales:

1. **Access Token** (empieza con `TEST-`)
   ```
   Ejemplo: TEST-4956446418432939-120722-abc123def456-3043495025
   ```

2. **Public Key** (empieza con `TEST-`)
   ```
   Ejemplo: TEST-4964dfb8-55cb-4f3d-a281-7ea12cb44c9f
   ```

### Paso 4: Actualizar el archivo .env

Abre el archivo `.env` en la raíz del proyecto y reemplaza:

**ANTES (Producción):**
```env
MP_ACCESS_TOKEN="APP_USR-4956446418432939-120722-479b8467ef375af005bea04541450227-3043495025"
MP_PUBLIC_KEY="APP_USR-4964dfb8-55cb-4f3d-a281-7ea12cb44c9f"
```

**DESPUÉS (Test):**
```env
MP_ACCESS_TOKEN="TEST-tu-access-token-completo-aqui"
MP_PUBLIC_KEY="TEST-tu-public-key-completo-aqui"
```

⚠️ **IMPORTANTE:**
- Las credenciales deben empezar con `TEST-`
- Copia todo el token completo (no solo una parte)
- No uses comillas dobles extras ni espacios

### Paso 5: Guardar Credenciales de Producción

**MUY IMPORTANTE:** Antes de reemplazar, guarda tus credenciales de producción en un lugar seguro para usarlas cuando pases a producción.

Puedes comentarlas en el mismo .env:

```env
# Credenciales TEST (para desarrollo)
MP_ACCESS_TOKEN="TEST-..."
MP_PUBLIC_KEY="TEST-..."

# Credenciales PRODUCCIÓN (descomentar cuando vayas a producción)
# MP_ACCESS_TOKEN="APP_USR-4956446418432939-120722-479b8467ef375af005bea04541450227-3043495025"
# MP_PUBLIC_KEY="APP_USR-4964dfb8-55cb-4f3d-a281-7ea12cb44c9f"
```

### Paso 6: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

### Paso 7: Verificar en la Consola

Cuando reinicies, deberías ver en la consola:

```
🔑 Inicializando cliente de Mercado Pago
Access Token (primeros 20 chars): TEST-495644641843...
Tipo de credenciales: TEST (Sandbox)
✓ Cliente de Mercado Pago inicializado
```

Si ves **"TEST (Sandbox)"** significa que está configurado correctamente.

---

## 🧪 Tarjetas de Prueba para Uruguay

Una vez configuradas las credenciales TEST, usa estas tarjetas:

### Visa - Aprobada
- **Número:** 4548 8100 0000 0008
- **CVV:** 123
- **Vencimiento:** 11/25 (cualquier fecha futura)
- **Titular:** APRO

### Mastercard - Aprobada
- **Número:** 5031 7557 3453 0604
- **CVV:** 123
- **Vencimiento:** 11/25
- **Titular:** APRO

### Tarjeta Rechazada (para probar errores)
- **Número:** 4000 0000 0000 0010
- **CVV:** 123
- **Vencimiento:** 11/25
- **Titular:** OTHE

**Documentos de prueba:**
- DNI/CI: cualquier número de 8 dígitos (ej: 12345678)

Más tarjetas: https://www.mercadopago.com.uy/developers/es/docs/checkout-api/testing

---

## 🔄 Cuándo Cambiar a Producción

Cambia a credenciales de producción (`APP_USR-...`) cuando:

1. ✅ Hayas probado completamente el flujo de pagos
2. ✅ El webhook funcione correctamente
3. ✅ Estés listo para recibir pagos reales
4. ✅ Tengas una URL pública (no localhost)

Para cambiar a producción:
1. Descomenta las credenciales de producción en `.env`
2. Comenta las credenciales TEST
3. Actualiza la URL del webhook a tu dominio público
4. Reinicia el servidor

---

## 🆘 Solución de Problemas

### No veo la pestaña "Credenciales de prueba"

1. Asegúrate de estar logueado en https://www.mercadopago.com.uy
2. Ve a **Developers** → **Credenciales**
3. Si solo ves una pestaña, busca un botón para "Generar credenciales de prueba"

### El error persiste después de cambiar las credenciales

1. ✅ Verifica que las credenciales empiecen con `TEST-`
2. ✅ Reinicia el servidor completamente (Ctrl+C y `npm run dev`)
3. ✅ Limpia el caché del navegador (Ctrl+Shift+R)
4. ✅ Revisa la consola para confirmar que dice "TEST (Sandbox)"

### Necesito probar con dinero real

Si necesitas probar con pagos reales:
- Mantén las credenciales `APP_USR-...` (producción)
- Usa una tarjeta real (no de prueba)
- Ten en cuenta que se generará un cargo real

---

## 📞 Ayuda Adicional

Si después de seguir estos pasos el error persiste, comparte:
1. Una captura de las credenciales (oculta los últimos caracteres)
2. El mensaje exacto de la consola cuando inicializa MP
3. El error completo que aparece al intentar pagar

---

## ✅ Checklist Final

- [ ] Obtuve Access Token TEST (empieza con `TEST-`)
- [ ] Obtuve Public Key TEST (empieza con `TEST-`)
- [ ] Actualicé el archivo `.env`
- [ ] Guardé las credenciales de producción en un lugar seguro
- [ ] Reinicié el servidor con `npm run dev`
- [ ] La consola muestra "TEST (Sandbox)"
- [ ] Puedo completar una compra con tarjeta de prueba
