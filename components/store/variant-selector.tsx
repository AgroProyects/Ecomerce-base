'use client'

import { cn } from '@/lib/utils/cn'
import type { ProductVariant } from '@/types/database'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
  className?: string
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
  className,
}: VariantSelectorProps) {
  if (variants.length === 0) {
    return null
  }

  // Agrupar variantes por tipo de atributo
  const attributeGroups = groupVariantsByAttribute(variants)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Si las variantes tienen atributos estructurados */}
      {attributeGroups.length > 0 ? (
        attributeGroups.map((group) => (
          <div key={group.name}>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {group.name}
            </label>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const variant = variants.find((v) =>
                  v.attributes?.some(
                    (attr: { name: string; value: string }) =>
                      attr.name === group.name && attr.value === value
                  )
                )
                const isSelected = selectedVariant?.id === variant?.id
                const isOutOfStock = variant && variant.stock <= 0

                return (
                  <button
                    key={value}
                    onClick={() => variant && onSelect(variant)}
                    disabled={isOutOfStock}
                    className={cn(
                      'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-600',
                      isOutOfStock && 'cursor-not-allowed opacity-50 line-through'
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        /* Si las variantes son simples (solo nombre) */
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Variante
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id
              const isOutOfStock = variant.stock <= 0

              return (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant)}
                  disabled={isOutOfStock}
                  className={cn(
                    'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-600',
                    isOutOfStock && 'cursor-not-allowed opacity-50 line-through'
                  )}
                >
                  {variant.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface AttributeGroup {
  name: string
  values: string[]
}

function groupVariantsByAttribute(variants: ProductVariant[]): AttributeGroup[] {
  const groups: Map<string, Set<string>> = new Map()

  variants.forEach((variant) => {
    if (variant.attributes && Array.isArray(variant.attributes)) {
      variant.attributes.forEach((attr: { name: string; value: string }) => {
        if (!groups.has(attr.name)) {
          groups.set(attr.name, new Set())
        }
        groups.get(attr.name)!.add(attr.value)
      })
    }
  })

  return Array.from(groups.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))
}
