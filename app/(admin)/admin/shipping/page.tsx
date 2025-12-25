'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  MapPin,
  Save,
  RefreshCw,
  Check,
  Clock,
  Gift,
  AlertCircle,
  Pencil,
  X,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ShippingCost } from '@/types/database'

interface EditingState {
  [key: string]: {
    cost: string
    free_shipping_threshold: string
    estimated_days_min: string
    estimated_days_max: string
    is_active: boolean
  }
}

export default function AdminShippingPage() {
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingState, setEditingState] = useState<EditingState>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [globalThreshold, setGlobalThreshold] = useState<string>('')
  const [showGlobalThreshold, setShowGlobalThreshold] = useState(false)

  const fetchShippingCosts = async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    try {
      const response = await fetch('/api/shipping/calculate')
      const result = await response.json()
      if (result.success) {
        setShippingCosts(result.data || [])
      }
    } catch (error) {
      toast.error('Error al cargar los costos de envío')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchShippingCosts()
  }, [])

  const startEditing = (cost: ShippingCost) => {
    setEditingId(cost.id)
    setEditingState({
      [cost.id]: {
        cost: cost.cost.toString(),
        free_shipping_threshold: cost.free_shipping_threshold?.toString() || '',
        estimated_days_min: cost.estimated_days_min.toString(),
        estimated_days_max: cost.estimated_days_max.toString(),
        is_active: cost.is_active,
      },
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingState({})
  }

  const handleFieldChange = (id: string, field: keyof EditingState[string], value: string | boolean) => {
    setEditingState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const saveSingleCost = async (id: string) => {
    const editing = editingState[id]
    if (!editing) return

    // Validaciones
    const cost = parseFloat(editing.cost)
    const threshold = editing.free_shipping_threshold ? parseFloat(editing.free_shipping_threshold) : null
    const daysMin = parseInt(editing.estimated_days_min)
    const daysMax = parseInt(editing.estimated_days_max)

    if (isNaN(cost) || cost < 0) {
      toast.error('El costo debe ser un número positivo')
      return
    }

    if (threshold !== null && threshold < 0) {
      toast.error('El umbral de envío gratis debe ser positivo')
      return
    }

    if (isNaN(daysMin) || daysMin < 0 || isNaN(daysMax) || daysMax < 0) {
      toast.error('Los días estimados deben ser números positivos')
      return
    }

    if (daysMin > daysMax) {
      toast.error('Los días mínimos no pueden ser mayores a los máximos')
      return
    }

    setIsSaving(true)
    try {
      const { updateShippingCost } = await import('@/actions/shipping')
      const result = await updateShippingCost({
        id,
        cost,
        free_shipping_threshold: threshold,
        estimated_days_min: daysMin,
        estimated_days_max: daysMax,
        is_active: editing.is_active,
      })

      if (result.success) {
        toast.success('Costo de envío actualizado')
        setEditingId(null)
        setEditingState({})
        setHasChanges(false)
        fetchShippingCosts(true)
      } else {
        toast.error(result.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const applyGlobalThreshold = async () => {
    const threshold = globalThreshold ? parseFloat(globalThreshold) : null

    if (threshold !== null && (isNaN(threshold) || threshold < 0)) {
      toast.error('El umbral debe ser un número positivo')
      return
    }

    setIsSaving(true)
    try {
      const { setGlobalFreeShippingThreshold } = await import('@/actions/shipping')
      const result = await setGlobalFreeShippingThreshold(threshold)

      if (result.success) {
        toast.success(result.message)
        setShowGlobalThreshold(false)
        setGlobalThreshold('')
        fetchShippingCosts(true)
      } else {
        toast.error(result.error || 'Error al aplicar')
      }
    } catch (error) {
      toast.error('Error al aplicar umbral global')
    } finally {
      setIsSaving(false)
    }
  }

  // Estadísticas
  const stats = {
    total: shippingCosts.length,
    active: shippingCosts.filter((c) => c.is_active).length,
    avgCost: shippingCosts.length > 0
      ? Math.round(shippingCosts.reduce((sum, c) => sum + c.cost, 0) / shippingCosts.length)
      : 0,
    withFreeShipping: shippingCosts.filter((c) => c.free_shipping_threshold !== null).length,
  }

  // Agrupar departamentos por región
  const groupedCosts = {
    metropolitana: shippingCosts.filter(c => ['Montevideo', 'Canelones', 'San José'].includes(c.department)),
    costa: shippingCosts.filter(c => ['Maldonado', 'Rocha', 'Colonia'].includes(c.department)),
    interior: shippingCosts.filter(c => !['Montevideo', 'Canelones', 'San José', 'Maldonado', 'Rocha', 'Colonia'].includes(c.department)),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <Truck className="h-5 w-5 text-white" />
            </div>
            Costos de Envío
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Configura los costos de envío por departamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchShippingCosts(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGlobalThreshold(!showGlobalThreshold)}
            className="gap-2"
          >
            <Gift className="h-4 w-4" />
            Envío Gratis Global
          </Button>
        </div>
      </div>

      {/* Global Free Shipping Threshold */}
      {showGlobalThreshold && (
        <Card className="border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <Label className="text-amber-800 dark:text-amber-200">
                  Umbral de envío gratis para todos los departamentos
                </Label>
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                  Los clientes con compras superiores a este monto tendrán envío gratis.
                  Deja vacío para desactivar.
                </p>
                <div className="relative max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="number"
                    placeholder="Ej: 5000"
                    value={globalThreshold}
                    onChange={(e) => setGlobalThreshold(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGlobalThreshold(false)
                    setGlobalThreshold('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={applyGlobalThreshold}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Aplicar a todos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div key="content" className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Departamentos</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
              </div>
            </div>
            <div key="gradient" className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div key="content" className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Activos</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.active}</p>
              </div>
            </div>
            <div key="gradient" className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div key="content" className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Costo promedio</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatPrice(stats.avgCost)}</p>
              </div>
            </div>
            <div key="gradient" className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div key="content" className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Con envío gratis</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.withFreeShipping}</p>
              </div>
            </div>
            <div key="gradient" className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          </CardContent>
        </Card>
      </div>

      {/* Shipping Costs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shippingCosts.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <AlertCircle className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No hay costos de envío configurados
            </h3>
            <p className="mt-1 text-center text-zinc-500 max-w-sm">
              Ejecuta la migración de base de datos para crear los costos de envío iniciales.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Región Metropolitana */}
          {groupedCosts.metropolitana.length > 0 && (
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Región Metropolitana</CardTitle>
                    <CardDescription>Montevideo, Canelones y San José</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
                {groupedCosts.metropolitana.map((cost) => (
                  <ShippingCostRow
                    key={cost.id}
                    cost={cost}
                    isEditing={editingId === cost.id}
                    editingState={editingState[cost.id]}
                    onStartEdit={() => startEditing(cost)}
                    onCancelEdit={cancelEditing}
                    onSave={() => saveSingleCost(cost.id)}
                    onFieldChange={(field, value) => handleFieldChange(cost.id, field, value)}
                    isSaving={isSaving}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Costa */}
          {groupedCosts.costa.length > 0 && (
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Costa</CardTitle>
                    <CardDescription>Maldonado, Rocha y Colonia</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
                {groupedCosts.costa.map((cost) => (
                  <ShippingCostRow
                    key={cost.id}
                    cost={cost}
                    isEditing={editingId === cost.id}
                    editingState={editingState[cost.id]}
                    onStartEdit={() => startEditing(cost)}
                    onCancelEdit={cancelEditing}
                    onSave={() => saveSingleCost(cost.id)}
                    onFieldChange={(field, value) => handleFieldChange(cost.id, field, value)}
                    isSaving={isSaving}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Interior */}
          {groupedCosts.interior.length > 0 && (
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Interior</CardTitle>
                    <CardDescription>Resto del país</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
                {groupedCosts.interior.map((cost) => (
                  <ShippingCostRow
                    key={cost.id}
                    cost={cost}
                    isEditing={editingId === cost.id}
                    editingState={editingState[cost.id]}
                    onStartEdit={() => startEditing(cost)}
                    onCancelEdit={cancelEditing}
                    onSave={() => saveSingleCost(cost.id)}
                    onFieldChange={(field, value) => handleFieldChange(cost.id, field, value)}
                    isSaving={isSaving}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

interface ShippingCostRowProps {
  cost: ShippingCost
  isEditing: boolean
  editingState?: EditingState[string]
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onFieldChange: (field: keyof EditingState[string], value: string | boolean) => void
  isSaving: boolean
}

function ShippingCostRow({
  cost,
  isEditing,
  editingState,
  onStartEdit,
  onCancelEdit,
  onSave,
  onFieldChange,
  isSaving,
}: ShippingCostRowProps) {
  if (isEditing && editingState) {
    return (
      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{cost.department}</h4>
            <p className="text-sm text-zinc-500">Editando configuración</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">Costo de envío</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                value={editingState.cost}
                onChange={(e) => onFieldChange('cost', e.target.value)}
                className="pl-10"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Envío gratis desde</Label>
            <div className="relative mt-1">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                value={editingState.free_shipping_threshold}
                onChange={(e) => onFieldChange('free_shipping_threshold', e.target.value)}
                className="pl-10"
                placeholder="Sin envío gratis"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Días mín.</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                value={editingState.estimated_days_min}
                onChange={(e) => onFieldChange('estimated_days_min', e.target.value)}
                className="pl-10"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Días máx.</Label>
            <div className="relative mt-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                value={editingState.estimated_days_max}
                onChange={(e) => onFieldChange('estimated_days_max', e.target.value)}
                className="pl-10"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Estado</Label>
            <div className="flex items-center gap-2 mt-2">
              <Switch
                checked={editingState.is_active}
                onCheckedChange={(checked) => onFieldChange('is_active', checked)}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {editingState.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancelEdit} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      !cost.is_active && "opacity-60"
    )}>
      <div className="flex items-center gap-3 sm:min-w-[200px]">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
          cost.is_active
            ? "bg-zinc-100 dark:bg-zinc-800"
            : "bg-zinc-100/50 dark:bg-zinc-800/50"
        )}>
          <MapPin className={cn(
            "h-5 w-5",
            cost.is_active
              ? "text-zinc-600 dark:text-zinc-400"
              : "text-zinc-400 dark:text-zinc-600"
          )} />
        </div>
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-zinc-50">{cost.department}</h4>
          {!cost.is_active && (
            <Badge variant="outline" className="text-xs mt-1">Inactivo</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-0.5">Costo</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatPrice(cost.cost)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-0.5">Envío gratis</p>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            {cost.free_shipping_threshold
              ? `Desde ${formatPrice(cost.free_shipping_threshold)}`
              : <span className="text-zinc-400">No aplica</span>}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-0.5">Tiempo estimado</p>
          <p className="text-sm text-zinc-900 dark:text-zinc-50">
            {cost.estimated_days_min === cost.estimated_days_max
              ? `${cost.estimated_days_min} día${cost.estimated_days_min !== 1 ? 's' : ''}`
              : `${cost.estimated_days_min}-${cost.estimated_days_max} días`}
          </p>
        </div>

        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEdit}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>
    </div>
  )
}
