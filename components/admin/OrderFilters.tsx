'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OrderStatus, PaymentMethod } from '@/types/api'

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Todos los estados', color: 'bg-zinc-500' },
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500' },
  { value: 'pending_payment', label: 'Esperando pago', color: 'bg-orange-500' },
  { value: 'paid', label: 'Pagado', color: 'bg-blue-500' },
  { value: 'processing', label: 'Procesando', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Enviado', color: 'bg-cyan-500' },
  { value: 'delivered', label: 'Entregado', color: 'bg-emerald-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
  { value: 'refunded', label: 'Reembolsado', color: 'bg-pink-500' },
]

const PAYMENT_OPTIONS: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'cash_on_delivery', label: 'Efectivo' },
]

const DATE_PRESETS = [
  { label: 'Hoy', getValue: () => {
    const today = new Date().toISOString().split('T')[0]
    return { startDate: today, endDate: today }
  }},
  { label: 'Ayer', getValue: () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]
    return { startDate: date, endDate: date }
  }},
  { label: 'Últimos 7 días', getValue: () => {
    const end = new Date().toISOString().split('T')[0]
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return { startDate: start.toISOString().split('T')[0], endDate: end }
  }},
  { label: 'Últimos 30 días', getValue: () => {
    const end = new Date().toISOString().split('T')[0]
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return { startDate: start.toISOString().split('T')[0], endDate: end }
  }},
  { label: 'Este mes', getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const end = new Date().toISOString().split('T')[0]
    return { startDate: start, endDate: end }
  }},
  { label: 'Mes pasado', getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
    return { startDate: start, endDate: end }
  }},
]

interface OrderFiltersProps {
  totalOrders: number
}

export function OrderFilters({ totalOrders }: OrderFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estado local para los filtros
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<OrderStatus | 'all'>(
    (searchParams.get('status') as OrderStatus) || 'all'
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'all'>(
    (searchParams.get('paymentMethod') as PaymentMethod) || 'all'
  )
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '')
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sincronizar estado con URL al cargar
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setStatus((searchParams.get('status') as OrderStatus) || 'all')
    setPaymentMethod((searchParams.get('paymentMethod') as PaymentMethod) || 'all')
    setStartDate(searchParams.get('startDate') || '')
    setEndDate(searchParams.get('endDate') || '')
    setMinAmount(searchParams.get('minAmount') || '')
    setMaxAmount(searchParams.get('maxAmount') || '')
  }, [searchParams])

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()

    if (search) params.set('search', search)
    if (status && status !== 'all') params.set('status', status)
    if (paymentMethod && paymentMethod !== 'all') params.set('paymentMethod', paymentMethod)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (minAmount) params.set('minAmount', minAmount)
    if (maxAmount) params.set('maxAmount', maxAmount)

    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
  }, [search, status, paymentMethod, startDate, endDate, minAmount, maxAmount, pathname, router])

  // Limpiar filtros
  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setPaymentMethod('all')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    router.push(pathname)
  }

  // Aplicar preset de fecha
  const applyDatePreset = (preset: typeof DATE_PRESETS[0]) => {
    const { startDate: start, endDate: end } = preset.getValue()
    setStartDate(start)
    setEndDate(end)
  }

  // Contar filtros activos
  const activeFiltersCount = [
    search,
    status !== 'all' ? status : null,
    paymentMethod !== 'all' ? paymentMethod : null,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ].filter(Boolean).length

  // Manejar búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        applyFilters()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Primera fila: Búsqueda y estado */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por orden, cliente, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Estado */}
          <SelectRoot
            value={status}
            onValueChange={(value) => {
              setStatus(value as OrderStatus | 'all')
              setTimeout(applyFilters, 0)
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>

          {/* Botón filtros avanzados */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {/* Fechas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Período de tiempo
              </Label>
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="startDate" className="text-xs text-zinc-500">Desde</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs text-zinc-500">Hasta</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Monto y método de pago */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Monto mínimo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  Monto mínimo
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              {/* Monto máximo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Monto máximo</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  Método de pago
                </Label>
                <SelectRoot
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-zinc-500">
                {totalOrders} pedidos encontrados
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros activos (chips) */}
        {activeFiltersCount > 0 && !showAdvanced && (
          <div className="flex flex-wrap gap-2 pt-2">
            {status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Estado: {STATUS_OPTIONS.find(s => s.value === status)?.label}
                <button onClick={() => { setStatus('all'); setTimeout(applyFilters, 0) }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {paymentMethod !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Pago: {PAYMENT_OPTIONS.find(p => p.value === paymentMethod)?.label}
                <button onClick={() => { setPaymentMethod('all'); setTimeout(applyFilters, 0) }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(startDate || endDate) && (
              <Badge variant="secondary" className="gap-1">
                Fecha: {startDate || '...'} - {endDate || '...'}
                <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(applyFilters, 0) }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(minAmount || maxAmount) && (
              <Badge variant="secondary" className="gap-1">
                Monto: ${minAmount || '0'} - ${maxAmount || '∞'}
                <button onClick={() => { setMinAmount(''); setMaxAmount(''); setTimeout(applyFilters, 0) }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
              Limpiar todo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
