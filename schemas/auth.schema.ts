import { z } from 'zod'

/**
 * Schema de validación de contraseña con política de seguridad mejorada
 *
 * Requisitos:
 * - Mínimo 10 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un número (0-9)
 * - Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener mínimo 10 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
    'La contraseña debe contener al menos un carácter especial (!@#$%^&*)'
  )

/**
 * Schema para registro de usuario
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener mínimo 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
})

/**
 * Schema para registro con confirmación de contraseña
 */
export const registerWithConfirmSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener mínimo 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

/**
 * Schema para cambio de contraseña
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })

/**
 * Schema para reset de contraseña
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * Schema para solicitud de reset de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

/**
 * Types derivados de los schemas
 */
export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterWithConfirmInput = z.infer<typeof registerWithConfirmSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Helper para validar fortaleza de contraseña
 *
 * @param password - Contraseña a validar
 * @returns Objeto con nivel de fortaleza y mensaje
 */
export function getPasswordStrength(password: string): {
  level: 'weak' | 'medium' | 'strong' | 'very-strong'
  message: string
  score: number
} {
  let score = 0

  // Longitud
  if (password.length >= 10) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Caracteres
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 1

  // Diversidad
  const uniqueChars = new Set(password).size
  if (uniqueChars >= 8) score += 1

  if (score <= 3) {
    return { level: 'weak', message: 'Contraseña débil', score }
  } else if (score <= 5) {
    return { level: 'medium', message: 'Contraseña media', score }
  } else if (score <= 7) {
    return { level: 'strong', message: 'Contraseña fuerte', score }
  } else {
    return { level: 'very-strong', message: 'Contraseña muy fuerte', score }
  }
}
