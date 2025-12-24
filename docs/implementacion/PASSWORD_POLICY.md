# Política de Contraseñas - Seguridad Mejorada

**Fecha:** 23 de Diciembre, 2025
**Schema:** `schemas/auth.schema.ts`
**Objetivo:** Mejorar seguridad de cuentas de usuario

---

## 📋 Resumen

Se implementó una política de contraseñas robusta siguiendo las recomendaciones de OWASP y NIST para proteger las cuentas de usuarios contra ataques de fuerza bruta y diccionario.

**Cambios principales:**
- ⬆️ Longitud mínima: 6 → **10 caracteres**
- ✅ Requiere mayúsculas (A-Z)
- ✅ Requiere minúsculas (a-z)
- ✅ Requiere números (0-9)
- ✅ Requiere caracteres especiales (!@#$%^&*)

---

## 🔐 Requisitos de Contraseña

### Política Implementada

```typescript
passwordSchema = z.string()
  .min(10, 'La contraseña debe tener mínimo 10 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Debe contener al menos un carácter especial')
```

### Ejemplos Válidos ✅

- `MyP@ssw0rd123` ✅ (12 caracteres, cumple todos los requisitos)
- `Secur3!Pass` ✅ (11 caracteres, cumple todos los requisitos)
- `C0mpl3x#2024` ✅ (12 caracteres, cumple todos los requisitos)
- `Str0ng&Passw0rd!` ✅ (16 caracteres, muy fuerte)

### Ejemplos Inválidos ❌

- `password` ❌ (muy corta, falta mayúsculas, números y símbolos)
- `password123` ❌ (falta mayúsculas y símbolos)
- `Password123` ❌ (falta símbolos especiales)
- `Pass123!` ❌ (menos de 10 caracteres)
- `MYPASSWORD123!` ❌ (falta minúsculas)

---

## 🎯 Niveles de Fortaleza

El sistema incluye un helper `getPasswordStrength()` que evalúa la contraseña:

```typescript
getPasswordStrength('MyP@ssw0rd123')
// {
//   level: 'strong',
//   message: 'Contraseña fuerte',
//   score: 6
// }
```

### Criterios de Evaluación

| Puntos | Criterio |
|--------|----------|
| +1 | Longitud ≥ 10 caracteres |
| +1 | Longitud ≥ 12 caracteres |
| +1 | Longitud ≥ 16 caracteres |
| +1 | Contiene minúsculas |
| +1 | Contiene mayúsculas |
| +1 | Contiene números |
| +1 | Contiene símbolos especiales |
| +1 | Al menos 8 caracteres únicos |

### Niveles

| Score | Nivel | Descripción |
|-------|-------|-------------|
| 0-3 | **Débil** 🔴 | Insegura, fácil de adivinar |
| 4-5 | **Media** 🟡 | Aceptable pero mejorable |
| 6-7 | **Fuerte** 🟢 | Buena seguridad |
| 8+ | **Muy Fuerte** 🟢🟢 | Excelente seguridad |

---

## 📝 Schemas Disponibles

### 1. Registro Simple

```typescript
import { registerSchema } from '@/schemas/auth.schema'

const result = registerSchema.safeParse({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'MyP@ssw0rd123'
})
```

### 2. Registro con Confirmación

```typescript
import { registerWithConfirmSchema } from '@/schemas/auth.schema'

const result = registerWithConfirmSchema.safeParse({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'MyP@ssw0rd123',
  confirmPassword: 'MyP@ssw0rd123'
})
```

### 3. Cambio de Contraseña

```typescript
import { changePasswordSchema } from '@/schemas/auth.schema'

const result = changePasswordSchema.safeParse({
  currentPassword: 'OldP@ss123',
  newPassword: 'NewP@ssw0rd456',
  confirmNewPassword: 'NewP@ssw0rd456'
})
```

**Validaciones adicionales:**
- ✅ Nueva contraseña debe ser diferente a la actual
- ✅ Contraseñas de confirmación deben coincidir

### 4. Reset de Contraseña

```typescript
import { resetPasswordSchema } from '@/schemas/auth.schema'

const result = resetPasswordSchema.safeParse({
  password: 'NewP@ssw0rd789',
  confirmPassword: 'NewP@ssw0rd789'
})
```

### 5. Solicitud de Reset

```typescript
import { forgotPasswordSchema } from '@/schemas/auth.schema'

const result = forgotPasswordSchema.safeParse({
  email: 'usuario@example.com'
})
```

---

## 🔧 Implementación

### API Route (Backend)

**Archivo:** `app/api/auth/register/route.ts`

```typescript
import { registerSchema } from '@/schemas/auth.schema'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validar con el nuevo schema
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name, email, password } = result.data

  // Crear usuario...
}
```

### Formulario (Frontend)

**Ejemplo con React Hook Form:**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerWithConfirmSchema, type RegisterWithConfirmInput } from '@/schemas/auth.schema'

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterWithConfirmInput>({
    resolver: zodResolver(registerWithConfirmSchema)
  })

  const onSubmit = async (data: RegisterWithConfirmInput) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    // Manejar respuesta...
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Nombre" />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} placeholder="Email" type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} placeholder="Contraseña" type="password" />
      {errors.password && <span>{errors.password.message}</span>}

      <input {...register('confirmPassword')} placeholder="Confirmar contraseña" type="password" />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit">Registrarse</button>
    </form>
  )
}
```

### Indicador de Fortaleza

**Componente de ejemplo:**

```typescript
'use client'

import { useState } from 'react'
import { getPasswordStrength } from '@/schemas/auth.schema'

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password)

  const colors = {
    'weak': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-green-600'
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded ${
              level <= Math.ceil(strength.score / 2)
                ? colors[strength.level]
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm mt-1">{strength.message}</p>
    </div>
  )
}
```

---

## 🚨 Mensajes de Error

### Español (Default)

- "La contraseña debe tener mínimo 10 caracteres"
- "La contraseña debe contener al menos una letra mayúscula"
- "La contraseña debe contener al menos una letra minúscula"
- "La contraseña debe contener al menos un número"
- "La contraseña debe contener al menos un carácter especial (!@#$%^&*)"
- "Las contraseñas no coinciden"
- "La nueva contraseña debe ser diferente a la actual"

### Personalización

Para cambiar los mensajes de error, edita `schemas/auth.schema.ts`:

```typescript
export const passwordSchema = z.string()
  .min(10, 'Tu mensaje personalizado aquí')
  .regex(/[A-Z]/, 'Tu mensaje para mayúsculas')
  // ...
```

---

## 📊 Migración de Usuarios Existentes

### Usuarios con Contraseñas Antiguas

Los usuarios existentes con contraseñas que no cumplan la nueva política:

1. **No se forzará cambio inmediato** - pueden seguir usando sus contraseñas actuales
2. **Al cambiar contraseña** - se aplicará la nueva política
3. **Notificación opcional** - se puede enviar email recomendando actualizar

### Script de Migración (Opcional)

Si quieres forzar a usuarios a actualizar:

```typescript
// app/api/auth/check-password-strength/route.ts
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar si la contraseña cumple nueva política
  // Nota: No podemos leer la contraseña hasheada,
  // pero podemos marcar al usuario para que la cambie en su próximo login

  return NextResponse.json({
    requiresPasswordUpdate: true,
    message: 'Tu contraseña no cumple con nuestra nueva política de seguridad'
  })
}
```

---

## ✅ Checklist de Validación

- [x] Schema `passwordSchema` creado con validaciones
- [x] Schema `registerSchema` actualizado
- [x] API route `/api/auth/register` actualizada
- [x] Exports agregados a `schemas/index.ts`
- [x] Helper `getPasswordStrength()` implementado
- [ ] Formulario de frontend actualizado (pendiente)
- [ ] Indicador de fortaleza agregado a UI (pendiente)
- [ ] Tests escritos para validaciones (pendiente)
- [ ] Documentación de usuario actualizada (pendiente)

---

## 🔒 Mejores Prácticas

### ✅ Hacer

1. **Almacenar hashes, nunca plaintext:**
   ```typescript
   // Supabase Auth ya hashea automáticamente
   await supabase.auth.admin.createUser({ email, password })
   ```

2. **Validar en backend Y frontend:**
   - Frontend: UX mejorada con validación inmediata
   - Backend: Seguridad real (frontend puede ser bypaseado)

3. **Dar feedback útil:**
   - ❌ "Contraseña inválida"
   - ✅ "La contraseña debe tener al menos una mayúscula"

4. **No limitar caracteres especiales:**
   - Permitir cualquier símbolo Unicode
   - Solo requerir al menos uno de los básicos

### ❌ Evitar

1. **No mostrar contraseña en logs:**
   ```typescript
   // ❌ MAL
   console.log('User password:', password)

   // ✅ BIEN
   console.log('Password length:', password.length)
   ```

2. **No enviar contraseña en URLs:**
   ```typescript
   // ❌ MAL
   `/api/reset?password=${newPassword}`

   // ✅ BIEN
   fetch('/api/reset', {
     method: 'POST',
     body: JSON.stringify({ password: newPassword })
   })
   ```

3. **No forzar cambios frecuentes:**
   - NIST recomienda NO expirar contraseñas periódicamente
   - Solo forzar cambio si hay indicios de compromiso

---

## 📚 Referencias

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Última actualización:** 23 de Diciembre, 2025
