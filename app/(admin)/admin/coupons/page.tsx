'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Tag,
  Percent,
  DollarSign,
  Search,
  Filter,
  Calendar,
  Users,
  ShoppingCart,
  Clock,
  AlertCircle,
  MoreVertical,
  Power,
  Eye,
  TrendingUp,
  RefreshCw,
  Ticket,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { CouponDialog } from './coupon-dialog'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  usage_limit_per_user: number
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  first_purchase_only: boolean
  created_at: string
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'expired' | 'scheduled'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const fetchCoupons = async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/coupons')
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      toast.error('Error al cargar los cupones')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  // Filtrar cupones
  useEffect(() => {
    let filtered = [...coupons]

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter((coupon) => {
        const status = getCouponStatus(coupon)
        return status === filterStatus
      })
    }

    setFilteredCoupons(filtered)
  }, [coupons, searchQuery, filterStatus])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Código copiado al portapapeles')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Cupón eliminado correctamente')
        fetchCoupons()
      } else {
        toast.error('Error al eliminar el cupón')
      }
    } catch (error) {
      toast.error('Error al eliminar el cupón')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (response.ok) {
        toast.success(coupon.is_active ? 'Cupón desactivado' : 'Cupón activado')
        fetchCoupons()
      }
    } catch (error) {
      toast.error('Error al actualizar el cupón')
    }
  }

  const getCouponStatus = (coupon: Coupon): FilterStatus => {
    if (!coupon.is_active) return 'inactive'
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 'expired'
    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) return 'scheduled'
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return 'inactive'
    return 'active'
  }

  const getStatusBadge = (coupon: Coupon) => {
    const status = getCouponStatus(coupon)
    switch (status) {
      case 'inactive':
        return (
          <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Inactivo
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Expirado
          </Badge>
        )
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="mr-1 h-3 w-3" />
            Programado
          </Badge>
        )
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Check className="mr-1 h-3 w-3" />
            Activo
          </Badge>
        )
      default:
        return null
    }
  }

  // Estadísticas
  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => getCouponStatus(c) === 'active').length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usage_count, 0),
    percentageType: coupons.filter((c) => c.discount_type === 'percentage').length,
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            Cupones de Descuento
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {stats.total} cupones · {stats.active} activos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchCoupons(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            onClick={() => {
              setEditingCoupon(null)
              setDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cupón
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Activos</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.active}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Usos totales</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalUsage}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Descuentos %</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.percentageType}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <SelectRoot
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as FilterStatus)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-zinc-400" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="scheduled">Programados</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="h-1 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
                <div className="flex flex-col lg:flex-row lg:items-center p-6">
                  <div className="flex items-center gap-4 lg:min-w-[280px]">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 lg:mt-0 lg:ml-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Ticket className="h-8 w-8 text-zinc-400" />
            </div>
            {coupons.length === 0 ? (
              <>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No hay cupones creados
                </h3>
                <p className="mt-1 text-center text-zinc-500 max-w-sm">
                  Crea tu primer cupón de descuento para ofrecer promociones a tus clientes.
                </p>
                <Button
                  className="mt-6 gap-2"
                  onClick={() => {
                    setEditingCoupon(null)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Crear Cupón
                </Button>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No se encontraron resultados
                </h3>
                <p className="mt-1 text-center text-zinc-500">
                  Intenta con otros términos de búsqueda o filtros.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                >
                  Limpiar filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon)
            const isDisabled = status === 'expired' || status === 'inactive'

            return (
              <Card
                key={coupon.id}
                className={cn(
                  "overflow-hidden border-0 shadow-sm transition-all hover:shadow-md",
                  isDisabled && "opacity-70"
                )}
              >
                <CardContent className="p-0">
                  {/* Top gradient bar */}
                  <div className={cn(
                    "h-1",
                    coupon.discount_type === 'percentage'
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  )} />

                  <div className="flex flex-col lg:flex-row lg:items-center">
                    {/* Coupon Code Section */}
                    <div className="flex items-center gap-4 p-4 lg:p-6 lg:min-w-[300px] border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl shrink-0",
                          coupon.discount_type === 'percentage'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        )}
                      >
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="h-6 w-6 text-white" />
                        ) : (
                          <DollarSign className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="flex items-center gap-2 group"
                        >
                          <span className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                            {coupon.code}
                          </span>
                          {copiedCode === coupon.code ? (
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors shrink-0" />
                          )}
                        </button>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {getStatusBadge(coupon)}
                          {coupon.first_purchase_only && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              1ra compra
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Discount Info */}
                    <div className="flex-1 p-4 lg:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                        {/* Descuento */}
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Descuento</p>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}%`
                              : formatPrice(coupon.discount_value)}
                          </p>
                          {coupon.max_discount_amount && (
                            <p className="text-xs text-zinc-500">
                              máx. {formatPrice(coupon.max_discount_amount)}
                            </p>
                          )}
                        </div>

                        {/* Mínimo */}
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Compra mín.</p>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {coupon.min_purchase_amount > 0
                              ? formatPrice(coupon.min_purchase_amount)
                              : 'Sin mínimo'}
                          </p>
                        </div>

                        {/* Usos */}
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Usos</p>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {coupon.usage_count}
                            {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                          </p>
                          {coupon.usage_limit && (
                            <div className="w-full max-w-[100px] h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  coupon.discount_type === 'percentage'
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                )}
                                style={{
                                  width: `${Math.min(
                                    (coupon.usage_count / coupon.usage_limit) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Vigencia */}
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-1">Vigencia</p>
                          {coupon.starts_at || coupon.expires_at ? (
                            <div className="text-sm space-y-0.5">
                              {coupon.starts_at && (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                  Desde: {formatDate(coupon.starts_at)}
                                </p>
                              )}
                              {coupon.expires_at && (
                                <p className={cn(
                                  status === 'expired' ? 'text-red-500 font-medium' : 'text-zinc-600 dark:text-zinc-400'
                                )}>
                                  Hasta: {formatDate(coupon.expires_at)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                              Sin límite
                            </p>
                          )}
                        </div>
                      </div>

                      {coupon.description && (
                        <p className="mt-4 text-sm text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingCoupon(coupon)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar código
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(coupon)}>
                            <Power className="mr-2 h-4 w-4" />
                            {coupon.is_active ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(coupon.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog */}
      <CouponDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coupon={editingCoupon}
        onSuccess={() => {
          setDialogOpen(false)
          fetchCoupons()
        }}
      />
    </div>
  )
}
