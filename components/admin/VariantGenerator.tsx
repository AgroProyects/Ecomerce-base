'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { generateVariants, previewGeneratedVariants } from '@/actions/variants';
import type { GenerateVariantsInput } from '@/schemas/variant.schema';

interface VariantGeneratorProps {
  productId: string;
  onGenerated: () => void;
}

interface AttributeOption {
  name: string;
  values: string[];
}

export function VariantGenerator({ productId, onGenerated }: VariantGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [attributes, setAttributes] = useState<AttributeOption[]>([
    { name: '', values: [] },
  ]);

  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [baseStock, setBaseStock] = useState<number>(0);
  const [newValue, setNewValue] = useState<string>('');
  const [preview, setPreview] = useState<
    Array<{ name: string; sku: string; attributes: any[] }>
  >([]);

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', values: [] }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeNameChange = (index: number, name: string) => {
    const updated = [...attributes];
    updated[index].name = name;
    setAttributes(updated);
  };

  const handleAddValue = (attributeIndex: number, value: string) => {
    if (!value.trim()) return;

    const updated = [...attributes];
    if (!updated[attributeIndex].values.includes(value.trim())) {
      updated[attributeIndex].values.push(value.trim());
      setAttributes(updated);
    }
  };

  const handleRemoveValue = (attributeIndex: number, valueIndex: number) => {
    const updated = [...attributes];
    updated[attributeIndex].values.splice(valueIndex, 1);
    setAttributes(updated);
  };

  const handlePreview = async () => {
    const validAttributes = attributes.filter(
      (attr) => attr.name && attr.values.length > 0
    );

    if (validAttributes.length === 0) {
      toast.error('Agrega al menos un atributo con valores');
      return;
    }

    startTransition(async () => {
      const input: GenerateVariantsInput = {
        product_id: productId,
        attributes: validAttributes,
        base_price: basePrice,
        base_stock: baseStock,
      };

      const result = await previewGeneratedVariants(input);

      if (result.success && result.data) {
        setPreview(result.data);
        setIsPreviewOpen(true);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Error al generar preview');
      }
    });
  };

  const handleGenerate = async () => {
    const validAttributes = attributes.filter(
      (attr) => attr.name && attr.values.length > 0
    );

    if (validAttributes.length === 0) {
      toast.error('Agrega al menos un atributo con valores');
      return;
    }

    if (
      !confirm(
        `Se generarán ${preview.length || 'múltiples'} variantes. ¿Continuar?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const input: GenerateVariantsInput = {
        product_id: productId,
        attributes: validAttributes,
        base_price: basePrice,
        base_stock: baseStock,
      };

      const result = await generateVariants(input);

      if (result.success) {
        toast.success(result.message || 'Variantes generadas exitosamente');
        setIsDialogOpen(false);
        setIsPreviewOpen(false);
        resetForm();
        onGenerated();
      } else {
        toast.error(result.error || 'Error al generar variantes');
      }
    });
  };

  const resetForm = () => {
    setAttributes([{ name: '', values: [] }]);
    setBasePrice(null);
    setBaseStock(0);
    setPreview([]);
  };

  const getTotalCombinations = () => {
    const validAttributes = attributes.filter(
      (attr) => attr.name && attr.values.length > 0
    );

    if (validAttributes.length === 0) return 0;

    return validAttributes.reduce((total, attr) => total * attr.values.length, 1);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={() => resetForm()}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Variantes Automáticamente
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Variantes Automáticamente</DialogTitle>
            <DialogDescription>
              Define los atributos y sus valores. Se generarán todas las combinaciones
              posibles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Configuración base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio base (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Dejar vacío para usar precio del producto"
                  value={basePrice || ''}
                  onChange={(e) =>
                    setBasePrice(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Stock inicial</Label>
                <Input
                  type="number"
                  min="0"
                  value={baseStock}
                  onChange={(e) => setBaseStock(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Atributos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Atributos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Atributo
                </Button>
              </div>

              {attributes.map((attr, attrIndex) => (
                <div
                  key={attrIndex}
                  className="border rounded-lg p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nombre del atributo (ej: Talla, Color)"
                      value={attr.name}
                      onChange={(e) =>
                        handleAttributeNameChange(attrIndex, e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttribute(attrIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Valores */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Agregar valor (ej: S, M, L)"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddValue(attrIndex, newValue);
                            setNewValue('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          handleAddValue(attrIndex, newValue);
                          setNewValue('');
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {attr.values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((value, valueIndex) => (
                          <div
                            key={valueIndex}
                            className="flex items-center gap-1 bg-white dark:bg-zinc-800 border rounded-md px-2 py-1"
                          >
                            <span className="text-sm">{value}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveValue(attrIndex, valueIndex)}
                              className="text-zinc-400 hover:text-zinc-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            {getTotalCombinations() > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Se generarán <strong>{getTotalCombinations()}</strong>{' '}
                  variante
                  {getTotalCombinations() !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={isPending}>
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Variantes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa de Variantes</DialogTitle>
            <DialogDescription>
              Se generarán {preview.length} variantes con las siguientes combinaciones
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Atributos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.attributes
                        .map((attr) => `${attr.name}: ${attr.value}`)
                        .join(', ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              Confirmar y Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
