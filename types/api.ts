// API Response types

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// Query params
export interface ProductsQueryParams {
  page?: number
  pageSize?: number
  categoryId?: string
  categorySlug?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'name' | 'price' | 'created_at' | 'stock'
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
  isFeatured?: boolean
}

export type OrderStatus = 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type PaymentMethod = 'mercadopago' | 'bank_transfer' | 'cash_on_delivery'

export interface OrdersQueryParams {
  page?: number
  pageSize?: number
  status?: OrderStatus
  search?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  paymentMethod?: PaymentMethod
  sortBy?: 'created_at' | 'total' | 'order_number'
  sortOrder?: 'asc' | 'desc'
}

// Analytics types
export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueChange: number
  ordersChange: number
  averageOrderValue: number
}

export interface SalesDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  image: string
  totalSold: number
  revenue: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}
