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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      toast.error('Error al cargar los cupones')
    } finally {
      setIsLoading(false)
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
        return <Badge variant="secondary">Inactivo</Badge>
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Programado</Badge>
      case 'active':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Activo</Badge>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Cupones de Descuento
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los códigos promocionales de tu tienda
          </p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-zinc-500">Total de cupones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-zinc-500">Cupones activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-zinc-500">Usos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.percentageType}</p>
                <p className="text-xs text-zinc-500">Descuentos %</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
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
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-zinc-400" />
            </div>
            {coupons.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  No hay cupones creados
                </h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                  Crea tu primer cupón de descuento para ofrecer promociones a tus clientes.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => {
                    setEditingCoupon(null)
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Cupón
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  No se encontraron resultados
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Intenta con otros términos de búsqueda o filtros.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
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
                className={`transition-all hover:shadow-md ${
                  isDisabled ? 'opacity-70' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:items-center">
                    {/* Coupon Code Section */}
                    <div className="flex items-center gap-4 p-4 lg:p-6 lg:min-w-[280px] border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                          coupon.discount_type === 'percentage'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                            : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                        }`}
                      >
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="h-6 w-6 text-white" />
                        ) : (
                          <DollarSign className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="flex items-center gap-2 group"
                        >
                          <span className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                            {coupon.code}
                          </span>
                          {copiedCode === coupon.code ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(coupon)}
                          {coupon.first_purchase_only && (
                            <Badge variant="outline" className="text-xs">
                              1ra compra
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Discount Info */}
                    <div className="flex-1 p-4 lg:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Descuento */}
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Descuento</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
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
                          <p className="text-xs text-zinc-500 mb-1">Compra mín.</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {coupon.min_purchase_amount > 0
                              ? formatPrice(coupon.min_purchase_amount)
                              : 'Sin mínimo'}
                          </p>
                        </div>

                        {/* Usos */}
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Usos</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {coupon.usage_count}
                            {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                          </p>
                          {coupon.usage_limit && (
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
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
                          <p className="text-xs text-zinc-500 mb-1">Vigencia</p>
                          {coupon.starts_at || coupon.expires_at ? (
                            <div className="text-sm">
                              {coupon.starts_at && (
                                <p className="text-zinc-600 dark:text-zinc-400">
                                  Desde: {formatDate(coupon.starts_at)}
                                </p>
                              )}
                              {coupon.expires_at && (
                                <p className={status === 'expired' ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}>
                                  Hasta: {formatDate(coupon.expires_at)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              Sin límite
                            </p>
                          )}
                        </div>
                      </div>

                      {coupon.description && (
                        <p className="mt-3 text-sm text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
