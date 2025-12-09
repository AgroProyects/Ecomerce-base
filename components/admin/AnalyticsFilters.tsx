'use client'

import { useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronDown,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { exportToExcel, exportToPDF, type SalesReportData } from '@/lib/utils/export'

export type DateRange = '7days' | '30days' | '90days' | 'year' | 'all'

interface AnalyticsFiltersProps {
  currentRange: DateRange
  onRangeChange: (range: DateRange) => void
  exportData: SalesReportData | null
  isLoading?: boolean
}

const dateRangeLabels: Record<DateRange, string> = {
  '7days': 'Últimos 7 días',
  '30days': 'Últimos 30 días',
  '90days': 'Últimos 90 días',
  'year': 'Este año',
  'all': 'Todo el tiempo',
}

export function AnalyticsFilters({
  currentRange,
  onRangeChange,
  exportData,
  isLoading = false,
}: AnalyticsFiltersProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    if (!exportData) return
    setIsExporting(true)
    try {
      const filename = `reporte-ventas-${currentRange}-${new Date().toISOString().split('T')[0]}`
      exportToExcel(exportData, filename)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!exportData) return
    setIsExporting(true)
    try {
      const filename = `reporte-ventas-${currentRange}-${new Date().toISOString().split('T')[0]}`
      exportToPDF(exportData, filename)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filtro de fecha */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros:</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isLoading}>
                  <Calendar className="h-4 w-4" />
                  {dateRangeLabels[currentRange]}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Período de tiempo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => onRangeChange(range)}
                    className={currentRange === range ? 'bg-primary/10 text-primary' : ''}
                  >
                    {dateRangeLabels[range]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Botones de exportación */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2"
                  disabled={isLoading || isExporting || !exportData}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <div className="flex flex-col">
                    <span>Excel (.xlsx)</span>
                    <span className="text-xs text-zinc-500">Hojas con datos detallados</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div className="flex flex-col">
                    <span>PDF (.pdf)</span>
                    <span className="text-xs text-zinc-500">Reporte visual formateado</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info del período seleccionado */}
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Mostrando datos de: <span className="font-medium text-zinc-700 dark:text-zinc-300">{dateRangeLabels[currentRange]}</span>
            {exportData && (
              <span className="ml-2">
                • {exportData.summary.totalOrders} pedidos • {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(exportData.summary.totalRevenue)} en ventas
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
