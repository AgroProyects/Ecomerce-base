'use client'

import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

// Mapeo de nombres de iconos a componentes
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
}

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: string
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-zinc-100 dark:bg-zinc-800',
    iconColor: 'text-zinc-600 dark:text-zinc-400',
  },
  success: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant]
  const Icon = iconMap[icon] || Package

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return TrendingUp
    if (trend.value < 0) return TrendingDown
    return Minus
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {value}
              </p>
              {trend && TrendIcon && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    trend.value > 0 && 'text-emerald-600',
                    trend.value < 0 && 'text-red-600',
                    trend.value === 0 && 'text-zinc-500'
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(trend.value).toFixed(1)}%</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
            {trend && (
              <p className="text-xs text-zinc-400">{trend.label}</p>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-xl',
              styles.iconBg
            )}
          >
            <Icon className={cn('h-6 w-6', styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
