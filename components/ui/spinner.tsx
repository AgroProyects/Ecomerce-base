import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

export interface SpinnerProps {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'default', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-zinc-500', sizeClasses[size], className)}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export function ButtonSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />
}
