'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Palette, Ruler, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

// Atributos predefinidos comunes
const PRESET_ATTRIBUTES = [
  { name: 'Talla', icon: Ruler, values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { name: 'Color', icon: Palette, values: ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde'] },
  { name: 'Material', icon: Tag, values: ['Algodón', 'Poliéster', 'Lana', 'Seda'] },
];

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantConfig {
  enabled: boolean;
  attributes: VariantAttribute[];
  baseStock: number;
  priceOverride: number | null;
}

export interface GeneratedVariant {
  name: string;
  sku: string;
  attributes: { name: string; value: string }[];
  stock: number;
  price_override: number | null;
}

interface VariantSetupProps {
  config: VariantConfig;
  onChange: (config: VariantConfig) => void;
  productName?: string;
  basePrice?: number;
  disabled?: boolean;
}

export function VariantSetup({
  config,
  onChange,
  productName = '',
  basePrice,
  disabled = false,
}: VariantSetupProps) {
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const updateConfig = (updates: Partial<VariantConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleAddAttribute = () => {
    updateConfig({
      attributes: [...config.attributes, { name: '', values: [] }],
    });
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttrs = config.attributes.filter((_, i) => i !== index);
    updateConfig({ attributes: newAttrs });
  };

  const handleAttributeNameChange = (index: number, name: string) => {
    const newAttrs = [...config.attributes];
    newAttrs[index] = { ...newAttrs[index], name };
    updateConfig({ attributes: newAttrs });
  };

  const handleAddValue = (attrIndex: number, value: string) => {
    if (!value.trim()) return;

    const newAttrs = [...config.attributes];
    if (!newAttrs[attrIndex].values.includes(value.trim())) {
      newAttrs[attrIndex] = {
        ...newAttrs[attrIndex],
        values: [...newAttrs[attrIndex].values, value.trim()],
      };
      updateConfig({ attributes: newAttrs });
    }
    setNewValueInputs({ ...newValueInputs, [attrIndex]: '' });
  };

  const handleRemoveValue = (attrIndex: number, valueIndex: number) => {
    const newAttrs = [...config.attributes];
    newAttrs[attrIndex] = {
      ...newAttrs[attrIndex],
      values: newAttrs[attrIndex].values.filter((_, i) => i !== valueIndex),
    };
    updateConfig({ attributes: newAttrs });
  };

  const handleUsePreset = (preset: typeof PRESET_ATTRIBUTES[0]) => {
    // Check if attribute already exists
    const existingIndex = config.attributes.findIndex(
      (a) => a.name.toLowerCase() === preset.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Merge values
      const newAttrs = [...config.attributes];
      const existingValues = new Set(newAttrs[existingIndex].values);
      preset.values.forEach((v) => existingValues.add(v));
      newAttrs[existingIndex] = {
        ...newAttrs[existingIndex],
        values: Array.from(existingValues),
      };
      updateConfig({ attributes: newAttrs });
    } else {
      // Add new attribute
      updateConfig({
        attributes: [...config.attributes, { name: preset.name, values: [...preset.values] }],
      });
    }
  };

  // Calculate total combinations
  const getTotalCombinations = () => {
    const validAttrs = config.attributes.filter((a) => a.name && a.values.length > 0);
    if (validAttrs.length === 0) return 0;
    return validAttrs.reduce((total, attr) => total * attr.values.length, 1);
  };

  // Generate preview of variants
  const generatePreview = (): GeneratedVariant[] => {
    const validAttrs = config.attributes.filter((a) => a.name && a.values.length > 0);
    if (validAttrs.length === 0) return [];

    const combinations: { name: string; value: string }[][] = [[]];

    for (const attr of validAttrs) {
      const newCombinations: { name: string; value: string }[][] = [];
      for (const combo of combinations) {
        for (const value of attr.values) {
          newCombinations.push([...combo, { name: attr.name, value }]);
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations.map((attrs, index) => {
      const variantName = attrs.map((a) => a.value).join(' / ');
      const skuSuffix = attrs.map((a) => a.value.substring(0, 3).toUpperCase()).join('-');
      const baseSku = productName
        ? productName.substring(0, 10).toUpperCase().replace(/\s+/g, '-')
        : 'PROD';

      return {
        name: variantName,
        sku: `${baseSku}-${skuSuffix}-${index + 1}`,
        attributes: attrs,
        stock: config.baseStock,
        price_override: config.priceOverride,
      };
    });
  };

  const totalCombinations = getTotalCombinations();

  if (!config.enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
          <div>
            <p className="font-medium">Variantes del producto</p>
            <p className="text-sm text-zinc-500">
              Habilita esta opción si tu producto tiene diferentes opciones (tallas, colores, etc.)
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
        <div>
          <p className="font-medium">Variantes del producto</p>
          <p className="text-sm text-zinc-500">
            {totalCombinations > 0
              ? `${totalCombinations} variante${totalCombinations !== 1 ? 's' : ''} configurada${totalCombinations !== 1 ? 's' : ''}`
              : 'Configura los atributos y valores'}
          </p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => updateConfig({ enabled })}
          disabled={disabled}
        />
      </div>

      {/* Quick Presets */}
      <div>
        <Label className="mb-2 block">Atributos predefinidos</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ATTRIBUTES.map((preset) => {
            const Icon = preset.icon;
            return (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUsePreset(preset)}
                disabled={disabled}
              >
                <Icon className="h-4 w-4 mr-2" />
                {preset.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Base Configuration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Stock inicial por variante</Label>
          <Input
            type="number"
            min="0"
            value={config.baseStock}
            onChange={(e) => updateConfig({ baseStock: parseInt(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label>Precio personalizado (opcional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={basePrice ? `Precio base: $${basePrice}` : 'Usar precio del producto'}
              value={config.priceOverride || ''}
              onChange={(e) =>
                updateConfig({
                  priceOverride: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Atributos personalizados</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAttribute}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Atributo
          </Button>
        </div>

        {config.attributes.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Tag className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm text-zinc-500">
              No hay atributos configurados.
              <br />
              Usa los atributos predefinidos o crea uno nuevo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {config.attributes.map((attr, attrIndex) => (
              <div
                key={attrIndex}
                className="border rounded-lg p-4 space-y-3 bg-white dark:bg-zinc-950"
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nombre del atributo (ej: Talla, Color)"
                    value={attr.name}
                    onChange={(e) => handleAttributeNameChange(attrIndex, e.target.value)}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAttribute(attrIndex)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Values */}
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Valores</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar valor y presionar Enter"
                      value={newValueInputs[attrIndex] || ''}
                      onChange={(e) =>
                        setNewValueInputs({ ...newValueInputs, [attrIndex]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(attrIndex, newValueInputs[attrIndex] || '');
                        }
                      }}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddValue(attrIndex, newValueInputs[attrIndex] || '')}
                      disabled={disabled}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {attr.values.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {attr.values.map((value, valueIndex) => (
                        <Badge
                          key={valueIndex}
                          variant="secondary"
                          className="gap-1 pl-3 pr-1 py-1"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(attrIndex, valueIndex)}
                            disabled={disabled}
                            className="ml-1 rounded-full p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary / Preview */}
      {totalCombinations > 0 && (
        <div className="space-y-3">
          <div
            className={cn(
              'p-4 rounded-lg border',
              totalCombinations <= 50
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : totalCombinations <= 100
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Se crearán {totalCombinations} variante{totalCombinations !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {config.attributes
                    .filter((a) => a.name && a.values.length > 0)
                    .map((a) => `${a.name}: ${a.values.length}`)
                    .join(' × ')}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver preview
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          {showPreview && (
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Variante</th>
                    <th className="text-left px-4 py-2 font-medium">SKU</th>
                    <th className="text-right px-4 py-2 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {generatePreview().slice(0, 20).map((variant, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{variant.name}</td>
                      <td className="px-4 py-2 text-zinc-500">{variant.sku}</td>
                      <td className="px-4 py-2 text-right">{variant.stock}</td>
                    </tr>
                  ))}
                  {totalCombinations > 20 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-zinc-500">
                        ...y {totalCombinations - 20} más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to generate variants from config
export function generateVariantsFromConfig(
  config: VariantConfig,
  productName: string,
  productPrice: number
): GeneratedVariant[] {
  if (!config.enabled) return [];

  const validAttrs = config.attributes.filter((a) => a.name && a.values.length > 0);
  if (validAttrs.length === 0) return [];

  const combinations: { name: string; value: string }[][] = [[]];

  for (const attr of validAttrs) {
    const newCombinations: { name: string; value: string }[][] = [];
    for (const combo of combinations) {
      for (const value of attr.values) {
        newCombinations.push([...combo, { name: attr.name, value }]);
      }
    }
    combinations.length = 0;
    combinations.push(...newCombinations);
  }

  return combinations.map((attrs, index) => {
    const variantName = attrs.map((a) => a.value).join(' / ');
    const skuSuffix = attrs.map((a) => a.value.substring(0, 3).toUpperCase()).join('-');
    const baseSku = productName
      ? productName.substring(0, 10).toUpperCase().replace(/\s+/g, '-')
      : 'PROD';

    return {
      name: variantName,
      sku: `${baseSku}-${skuSuffix}-${index + 1}`,
      attributes: attrs,
      stock: config.baseStock,
      price_override: config.priceOverride,
    };
  });
}
