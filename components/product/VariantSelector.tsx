'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/database';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
  className?: string;
}

interface AttributeGroup {
  name: string;
  values: string[];
}

export function VariantSelector({
  variants,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Agrupar variantes por atributos
  const attributeGroups = getAttributeGroups(variants);

  // Encontrar variante que coincida con los atributos seleccionados
  useEffect(() => {
    const variant = findMatchingVariant(variants, selectedAttributes);
    setSelectedVariant(variant);
    onVariantChange(variant);
  }, [selectedAttributes, variants, onVariantChange]);

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };

  const isAttributeValueAvailable = (attributeName: string, value: string): boolean => {
    // Crear atributos temporales con el nuevo valor
    const tempAttributes = {
      ...selectedAttributes,
      [attributeName]: value,
    };

    // Verificar si existe alguna variante con stock que coincida
    return variants.some((variant) => {
      if (!variant.is_active || (variant.stock || 0) <= 0) return false;

      return Object.entries(tempAttributes).every(([name, val]) => {
        const attr = (variant.attributes as Array<{ name: string; value: string }>).find(
          (a) => a.name === name
        );
        return attr?.value === val;
      });
    });
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {attributeGroups.map((group) => (
        <div key={group.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {group.name}
            </label>
            {selectedAttributes[group.name] && (
              <span className="text-sm text-zinc-500">
                {selectedAttributes[group.name]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isSelected = selectedAttributes[group.name] === value;
              const isAvailable = isAttributeValueAvailable(group.name, value);

              return (
                <button
                  key={value}
                  onClick={() => handleAttributeSelect(group.name, value)}
                  disabled={!isAvailable}
                  className={cn(
                    'relative min-w-[60px] px-4 py-2 text-sm font-medium rounded-md border transition-all',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500',
                    !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                  )}
                >
                  {value}
                  {isSelected && (
                    <Check className="absolute top-1 right-1 h-3 w-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Información de la variante seleccionada */}
      {selectedVariant && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-md text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Stock disponible:
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedVariant.stock} unidades
            </span>
          </div>
          {selectedVariant.price_override && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-zinc-600 dark:text-zinc-400">
                Precio:
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                ${selectedVariant.price_override.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Advertencia si no hay variante seleccionada */}
      {Object.keys(selectedAttributes).length < attributeGroups.length && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Por favor selecciona todas las opciones
        </p>
      )}

      {/* Advertencia si la variante seleccionada no tiene stock */}
      {selectedVariant && (selectedVariant.stock || 0) <= 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Esta combinación está agotada
        </p>
      )}
    </div>
  );
}

// Helpers
function getAttributeGroups(variants: ProductVariant[]): AttributeGroup[] {
  const groups = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    if (!variant.is_active) return;

    const attributes = variant.attributes as Array<{ name: string; value: string }>;
    attributes.forEach((attr) => {
      if (!groups.has(attr.name)) {
        groups.set(attr.name, new Set());
      }
      groups.get(attr.name)!.add(attr.value);
    });
  });

  return Array.from(groups.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values).sort(),
  }));
}

function findMatchingVariant(
  variants: ProductVariant[],
  selectedAttributes: Record<string, string>
): ProductVariant | null {
  return (
    variants.find((variant) => {
      if (!variant.is_active) return false;

      const attributes = variant.attributes as Array<{ name: string; value: string }>;

      return Object.entries(selectedAttributes).every(([name, value]) => {
        return attributes.some((attr) => attr.name === name && attr.value === value);
      });
    }) || null
  );
}
