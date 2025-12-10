import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  // Admin routes (except /admin/login)
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAdminLoginRoute = pathname === '/admin/login'

  // Customer routes that require authentication
  const isCustomerProtectedRoute =
    pathname.startsWith('/mi-cuenta') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/favoritos')

  const isCustomerLoginRoute = pathname === '/login'

  // Protect admin routes - require admin/super_admin role
  if (isAdminRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Check admin role for admin routes
  if (isAdminRoute && session) {
    const role = (session.user as any)?.role
    if (role !== 'admin' && role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated admins away from admin login
  if (isAdminLoginRoute && session) {
    const role = (session.user as any)?.role
    if (role === 'admin' || role === 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Protect customer routes
  if (isCustomerProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login based on role
  if (isCustomerLoginRoute && session) {
    const role = (session.user as any)?.role
    const url = request.nextUrl.clone()

    // Admins go to admin dashboard, customers to their account
    if (role === 'admin' || role === 'super_admin') {
      url.pathname = '/admin/dashboard'
    } else {
      url.pathname = '/mi-cuenta'
    }

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/mi-cuenta/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/favoritos',
  ],
}
