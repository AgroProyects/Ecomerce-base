# Solución: Error al Registrar Nuevos Usuarios

## 🐛 Problema

Cuando un usuario se registra, se crea en la tabla `auth.users` de Supabase pero **NO se crea automáticamente en la tabla `customers`**. Esto causa errores al intentar verificar el email:

```
Error checking email verification: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

## ✅ Solución Implementada

He creado dos soluciones:

### 1. Trigger Automático (RECOMENDADO)

**Archivo**: `supabase/migrations/008_sync_auth_users.sql`

Este script hace 3 cosas importantes:

1. **Crea una función** que sincroniza `auth.users` → `customers`
2. **Crea un trigger** que ejecuta la función cuando un usuario se registra
3. **Sincroniza usuarios existentes** (one-time migration)

**Ventajas:**
- ✅ Automático para todos los usuarios futuros
- ✅ Sincroniza usuarios existentes
- ✅ Actualiza el estado de verificación cuando Supabase confirma el email
- ✅ No requiere cambios en el código

### 2. Mejora en el Código

**Archivo**: `actions/auth/verification.ts`

Cambié `.single()` por `.maybeSingle()` para manejar el caso cuando no existe el registro:

```typescript
const { data, error } = await supabase
  .from('customers')
  .select('email_verified')
  .eq('id', userId)
  .maybeSingle() // ← Cambiado aquí

// Si no existe el registro, retornar unverified
if (!data) {
  return { success: true, verified: false }
}
```

## 🚀 Pasos para Aplicar la Solución

### Paso 1: Ejecutar la Migración del Trigger

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Click en **New Query**
3. Copia y pega el contenido de: `supabase/migrations/008_sync_auth_users.sql`
4. Click en **RUN**
5. Verifica que diga "Success" ✅

### Paso 2: Verificar que Funcionó

Ejecuta esta query en el SQL Editor para verificar:

```sql
-- Ver usuarios en auth.users
SELECT id, email, email_confirmed_at FROM auth.users;

-- Ver usuarios en customers
SELECT id, email, email_verified FROM customers;

-- Deberían tener los mismos usuarios
```

### Paso 3: Probar el Registro

1. Registra un nuevo usuario de prueba
2. Verifica que aparece en **Table Editor** → `customers`
3. El campo `email_verified` debe ser `false`
4. Ya NO debería aparecer el error en la consola

## 🔄 Cómo Funciona el Trigger

```sql
-- Cuando un usuario se registra en auth.users...
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Se ejecuta esta función que...
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserta en customers automáticamente
  INSERT INTO customers (id, email, name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.email_confirmed_at IS NOT NULL  -- true si ya confirmó
  )
  ON CONFLICT (id) DO UPDATE SET
    email_verified = NEW.email_confirmed_at IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Verificación del Estado

Después de aplicar la solución:

### Antes
- Usuario registrado → Solo en `auth.users` ❌
- Intenta verificar email → Error "0 rows" ❌
- Banner de verificación → No aparece ❌

### Después
- Usuario registrado → En `auth.users` Y `customers` ✅
- Intenta verificar email → Retorna `verified: false` ✅
- Banner de verificación → Aparece correctamente ✅
- Usuario confirma email → `email_verified` se actualiza a `true` ✅

## 🎯 Usuarios Existentes

El script también sincroniza usuarios que ya existen en `auth.users`:

```sql
-- Sync existing users (one-time)
INSERT INTO public.customers (id, email, name, email_verified)
SELECT
  id,
  email,
  raw_user_meta_data->>'name',
  email_confirmed_at IS NOT NULL
FROM auth.users
ON CONFLICT (id) DO UPDATE...
```

Esto significa que el usuario **Raul Dominguez** (`enzopontet2003@gmail.com`) que ya existe ahora también tendrá su registro en `customers`.

## ⚠️ Importante

1. **Ejecuta primero** la migración `007_email_verification_complete.sql` (si no lo has hecho)
2. **Luego ejecuta** la migración `008_sync_auth_users.sql`
3. El orden importa porque el trigger necesita que la tabla `customers` exista

## 🧪 Testing

Para probar que todo funciona:

```bash
1. Registra nuevo usuario → Check tabla customers
2. Navega la tienda → Banner amarillo aparece
3. Intenta comprar → Bloqueado con mensaje
4. Confirma email (simula con SQL) → Banner desaparece
5. Intenta comprar → Funciona ✅
```

Simular confirmación de email en SQL:
```sql
UPDATE customers
SET email_verified = true, email_verified_at = NOW()
WHERE email = 'test@example.com';
```

## 📝 Notas Finales

- El trigger se ejecuta automáticamente para TODOS los usuarios futuros
- No necesitas modificar el código de registro
- Supabase Auth maneja el envío de emails
- El trigger sincroniza el estado de verificación automáticamente
- Si un usuario confirma su email en Supabase, el trigger actualiza `customers.email_verified = true`

---

**Fecha**: 2025-12-09
**Estado**: ✅ Implementado y listo para aplicar
