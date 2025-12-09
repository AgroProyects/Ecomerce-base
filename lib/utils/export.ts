import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
  subtitle?: string
}

export interface SalesReportData {
  dailySales: {
    date: string
    revenue: number
    orders: number
  }[]
  topProducts: {
    product_name: string
    total_quantity: number
    total_revenue: number
  }[]
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    period: string
  }
}

// Formatear precio para exportación
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

// Formatear fecha para exportación
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Exportar a Excel
export function exportToExcel(data: SalesReportData, filename: string = 'reporte-ventas') {
  const workbook = XLSX.utils.book_new()

  // Hoja de resumen
  const summaryData = [
    ['Reporte de Ventas'],
    [''],
    ['Período:', data.summary.period],
    ['Total de Ingresos:', formatPrice(data.summary.totalRevenue)],
    ['Total de Pedidos:', data.summary.totalOrders.toString()],
    ['Ticket Promedio:', formatPrice(data.summary.averageOrderValue)],
    [''],
    ['Generado el:', new Date().toLocaleString('es-AR')],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Ajustar anchos de columna
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  // Hoja de ventas diarias
  const salesHeaders = ['Fecha', 'Ingresos', 'Pedidos']
  const salesRows = data.dailySales.map((sale) => [
    formatDate(sale.date),
    formatPrice(sale.revenue),
    sale.orders,
  ])
  const salesData = [salesHeaders, ...salesRows]
  const salesSheet = XLSX.utils.aoa_to_sheet(salesData)
  salesSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas Diarias')

  // Hoja de productos más vendidos
  const productsHeaders = ['Producto', 'Cantidad Vendida', 'Ingresos']
  const productsRows = data.topProducts.map((product) => [
    product.product_name,
    product.total_quantity,
    formatPrice(product.total_revenue),
  ])
  const productsData = [productsHeaders, ...productsRows]
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
  productsSheet['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Productos')

  // Descargar archivo
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Exportar a PDF
export function exportToPDF(data: SalesReportData, filename: string = 'reporte-ventas') {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Título
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte de Ventas', pageWidth / 2, 20, { align: 'center' })

  // Subtítulo con período
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.summary.period, pageWidth / 2, 28, { align: 'center' })

  // Fecha de generación
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, pageWidth / 2, 35, {
    align: 'center',
  })
  doc.setTextColor(0)

  // Resumen en cards
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen', 14, 50)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  // Crear tabla de resumen
  autoTable(doc, {
    startY: 55,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Ingresos', formatPrice(data.summary.totalRevenue)],
      ['Total de Pedidos', data.summary.totalOrders.toString()],
      ['Ticket Promedio', formatPrice(data.summary.averageOrderValue)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  })

  // Ventas diarias
  const finalY1 = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Ventas Diarias', 14, finalY1)

  autoTable(doc, {
    startY: finalY1 + 5,
    head: [['Fecha', 'Ingresos', 'Pedidos']],
    body: data.dailySales.slice(0, 15).map((sale) => [
      formatDate(sale.date),
      formatPrice(sale.revenue),
      sale.orders.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
  })

  // Nueva página para productos
  doc.addPage()

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Productos Más Vendidos', 14, 20)

  autoTable(doc, {
    startY: 25,
    head: [['Producto', 'Cantidad', 'Ingresos']],
    body: data.topProducts.map((product) => [
      product.product_name.length > 35
        ? product.product_name.substring(0, 35) + '...'
        : product.product_name,
      product.total_quantity.toString(),
      formatPrice(product.total_revenue),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
    },
  })

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Descargar archivo
  doc.save(`${filename}.pdf`)
}

// Exportar datos crudos a CSV
export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string = 'datos'
) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
