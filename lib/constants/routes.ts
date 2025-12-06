// Rutas de la aplicación centralizadas

export const ROUTES = {
  // Tienda pública
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT: (slug: string) => `/products/${slug}`,
  CATEGORY: (slug: string) => `/category/${slug}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  CHECKOUT_FAILURE: '/checkout/failure',
  CHECKOUT_PENDING: '/checkout/pending',

  // Autenticación
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    PRODUCT_NEW: '/admin/products/new',
    PRODUCT_EDIT: (id: string) => `/admin/products/${id}`,
    CATEGORIES: '/admin/categories',
    ORDERS: '/admin/orders',
    ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
    CUSTOMERS: '/admin/customers',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    SETTINGS_APPEARANCE: '/admin/settings/appearance',
    SETTINGS_PAYMENTS: '/admin/settings/payments',
    SETTINGS_SHIPPING: '/admin/settings/shipping',
    SETTINGS_SEO: '/admin/settings/seo',
    BANNERS: '/admin/banners',
  },
} as const

// Rutas que requieren autenticación
export const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard',
] as const

// Rutas de autenticación (redirigen si ya está logueado)
export const AUTH_ROUTES = [
  '/login',
  '/register',
] as const

// Rutas públicas de la tienda
export const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/category',
  '/cart',
  '/checkout',
] as const
