// Configuración global de la aplicación

export const APP_CONFIG = {
  name: 'E-Commerce Base',
  description: 'Plataforma e-commerce flexible y reutilizable',
  version: '1.0.0',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  ADMIN_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

export const IMAGES = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  PRODUCT_MAX_IMAGES: 10,
  PLACEHOLDER: '/images/placeholder.png',
} as const

export const STOCK = {
  LOW_THRESHOLD: 5,
  OUT_OF_STOCK: 0,
} as const

export const CURRENCY = {
  DEFAULT: 'ARS',
  SYMBOL: '$',
  LOCALE: 'es-AR',
} as const

export const ORDER_STATUS = {
  pending: {
    label: 'Pendiente',
    color: 'yellow',
    description: 'Esperando pago',
  },
  paid: {
    label: 'Pagado',
    color: 'green',
    description: 'Pago confirmado',
  },
  processing: {
    label: 'En preparación',
    color: 'blue',
    description: 'Preparando pedido',
  },
  shipped: {
    label: 'Enviado',
    color: 'purple',
    description: 'En camino',
  },
  delivered: {
    label: 'Entregado',
    color: 'green',
    description: 'Pedido completado',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'red',
    description: 'Pedido cancelado',
  },
  refunded: {
    label: 'Reembolsado',
    color: 'gray',
    description: 'Dinero devuelto',
  },
} as const

export const USER_ROLES = {
  super_admin: {
    label: 'Super Admin',
    description: 'Acceso total al sistema',
  },
  admin: {
    label: 'Administrador',
    description: 'Gestión de tienda',
  },
  editor: {
    label: 'Editor',
    description: 'Gestión de productos',
  },
  viewer: {
    label: 'Visor',
    description: 'Solo lectura',
  },
} as const

export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product-${id}`,
  CATEGORIES: 'categories',
  CATEGORY: (id: string) => `category-${id}`,
  ORDERS: 'orders',
  ORDER: (id: string) => `order-${id}`,
  SETTINGS: 'store-settings',
  BANNERS: 'banners',
} as const
