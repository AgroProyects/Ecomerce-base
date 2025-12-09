'use client'

import { useState, useEffect, useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface PriceRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  onChangeEnd?: (value: [number, number]) => void
  step?: number
  className?: string
}

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  onChangeEnd,
  step = 100,
  className,
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleValueChange = useCallback((newValue: number[]) => {
    const typedValue: [number, number] = [newValue[0], newValue[1]]
    setLocalValue(typedValue)
    onChange(typedValue)
  }, [onChange])

  const handleValueCommit = useCallback((newValue: number[]) => {
    const typedValue: [number, number] = [newValue[0], newValue[1]]
    onChangeEnd?.(typedValue)
  }, [onChangeEnd])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Price Labels */}
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Min</span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatPrice(localValue[0])}
          </p>
        </div>
        <div className="flex-1 px-4">
          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="rounded-lg bg-zinc-100 px-3 py-1.5 text-right dark:bg-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Max</span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatPrice(localValue[1])}
          </p>
        </div>
      </div>

      {/* Slider */}
      <Slider
        value={localValue}
        min={min}
        max={max}
        step={step}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="py-2"
      />

      {/* Range indicators */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>
    </div>
  )
}
