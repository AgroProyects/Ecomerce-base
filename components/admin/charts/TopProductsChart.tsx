'use client'

import Image from 'next/image'
import { Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface TopProductsChartProps {
  data: {
    product_id: string
    product_name: string
    product_image: string | null
    total_quantity: number
    total_revenue: number
  }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-zinc-500">
        No hay datos de productos
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((p) => p.total_revenue))

  return (
    <div className="space-y-4">
      {data.map((product, index) => (
        <div key={product.product_id} className="flex items-center gap-4">
          {/* Ranking */}
          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {index + 1}
            </span>
          </div>

          {/* Image */}
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
            {product.product_image ? (
              <Image
                src={product.product_image}
                alt={product.product_name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-5 w-5 text-zinc-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {product.product_name}
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{product.total_quantity} vendidos</span>
              <span className="font-medium text-emerald-600">
                {formatPrice(product.total_revenue)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(product.total_revenue / maxRevenue) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
