/**
 * Middleware de validación de autenticación y autorización
 * Protege API routes contra CSRF y acceso no autorizado
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

/**
 * Valida que el usuario esté autenticado
 *
 * @returns Session si está autenticado, NextResponse con error 401 si no lo está
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const sessionOrError = await requireAuth()
 *   if (sessionOrError instanceof NextResponse) return sessionOrError
 *
 *   const session = sessionOrError
 *   // Usuario autenticado, continuar...
 * }
 * ```
 */
export async function requireAuth() {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  return session
}

/**
 * Valida que el usuario tenga rol de admin o super_admin
 *
 * @returns Session si es admin, NextResponse con error si no lo es
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const sessionOrError = await requireAdmin()
 *   if (sessionOrError instanceof NextResponse) return sessionOrError
 *
 *   const session = sessionOrError
 *   // Usuario es admin, continuar...
 * }
 * ```
 */
export async function requireAdmin() {
  const sessionOrError = await requireAuth()

  if (sessionOrError instanceof NextResponse) {
    return sessionOrError
  }

  const session = sessionOrError

  if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Acceso denegado. Se requieren permisos de administrador.' },
      { status: 403 }
    )
  }

  return session
}

/**
 * Valida que el usuario tenga un rol específico
 *
 * @param allowedRoles - Array de roles permitidos
 * @returns Session si tiene el rol, NextResponse con error si no lo tiene
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const sessionOrError = await requireRole(['admin', 'moderator'])
 *   if (sessionOrError instanceof NextResponse) return sessionOrError
 *
 *   const session = sessionOrError
 *   // Usuario tiene rol permitido, continuar...
 * }
 * ```
 */
export async function requireRole(allowedRoles: string[]) {
  const sessionOrError = await requireAuth()

  if (sessionOrError instanceof NextResponse) {
    return sessionOrError
  }

  const session = sessionOrError

  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      {
        error: 'Acceso denegado. No tienes los permisos necesarios.',
        requiredRoles: allowedRoles,
      },
      { status: 403 }
    )
  }

  return session
}

/**
 * Valida que el usuario sea el dueño del recurso
 *
 * @param userId - ID del usuario dueño del recurso
 * @returns Session si es el dueño o admin, NextResponse con error si no lo es
 *
 * @example
 * ```typescript
 * export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
 *   const { data: order } = await supabase
 *     .from('orders')
 *     .select('customer_id')
 *     .eq('id', params.id)
 *     .single()
 *
 *   const sessionOrError = await requireOwnerOrAdmin(order.customer_id)
 *   if (sessionOrError instanceof NextResponse) return sessionOrError
 *
 *   // Usuario es dueño o admin, continuar...
 * }
 * ```
 */
export async function requireOwnerOrAdmin(resourceOwnerId: string) {
  const sessionOrError = await requireAuth()

  if (sessionOrError instanceof NextResponse) {
    return sessionOrError
  }

  const session = sessionOrError

  // Admins pueden acceder a cualquier recurso
  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin'
  const isOwner = session.user.id === resourceOwnerId

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Acceso denegado. No tienes permiso para acceder a este recurso.' },
      { status: 403 }
    )
  }

  return session
}
