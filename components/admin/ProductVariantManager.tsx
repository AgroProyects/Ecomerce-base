'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Edit2, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  createVariant,
  updateVariant,
  deleteVariant,
  updateVariantStock,
} from '@/actions/variants';
import type { ProductVariant } from '@/types/database';
import type { CreateVariantInput } from '@/schemas/variant.schema';

interface ProductVariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onUpdate: () => void;
}

interface VariantFormData {
  name: string;
  sku: string;
  price_override: number | null;
  stock: number;
  attributes: Array<{ name: string; value: string }>;
  is_active: boolean;
}

export function ProductVariantManager({
  productId,
  variants,
  onUpdate,
}: ProductVariantManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [attributeInput, setAttributeInput] = useState({ name: '', value: '' });

  const [formData, setFormData] = useState<VariantFormData>({
    name: '',
    sku: '',
    price_override: null,
    stock: 0,
    attributes: [],
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price_override: null,
      stock: 0,
      attributes: [],
      is_active: true,
    });
    setEditingVariant(null);
    setAttributeInput({ name: '', value: '' });
  };

  const openEditDialog = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      sku: variant.sku || '',
      price_override: variant.price_override,
      stock: variant.stock || 0,
      attributes: (variant.attributes as Array<{ name: string; value: string }>) || [],
      is_active: variant.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleAddAttribute = () => {
    if (!attributeInput.name || !attributeInput.value) {
      toast.error('Nombre y valor del atributo son requeridos');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, attributeInput],
    }));
    setAttributeInput({ name: '', value: '' });
  };

  const handleRemoveAttribute = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('El nombre de la variante es requerido');
      return;
    }

    startTransition(async () => {
      try {
        let result;

        if (editingVariant) {
          // Actualizar variante existente
          result = await updateVariant({
            id: editingVariant.id,
            ...formData,
          });
        } else {
          // Crear nueva variante
          const createData: CreateVariantInput = {
            product_id: productId,
            ...formData,
            sort_order: variants.length, // Agregar al final
          };
          result = await createVariant(createData);
        }

        if (result.success) {
          toast.success(result.message || 'Variante guardada exitosamente');
          setIsDialogOpen(false);
          resetForm();
          onUpdate();
        } else {
          toast.error(result.error || 'Error al guardar la variante');
        }
      } catch (error) {
        toast.error('Error inesperado al guardar la variante');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta variante?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteVariant(id);

      if (result.success) {
        toast.success('Variante eliminada exitosamente');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al eliminar la variante');
      }
    });
  };

  const handleQuickStockUpdate = async (id: string, stock: number) => {
    startTransition(async () => {
      const result = await updateVariantStock({ id, stock });

      if (result.success) {
        toast.success('Stock actualizado');
        onUpdate();
      } else {
        toast.error(result.error || 'Error al actualizar stock');
      }
    });
  };

  const formatAttributes = (attributes: any) => {
    if (!attributes || !Array.isArray(attributes)) return '';
    return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(', ');
  };

  const getTotalStock = () => {
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Variantes del Producto</h3>
          <p className="text-sm text-zinc-500">
            {variants.length} variante{variants.length !== 1 ? 's' : ''} •{' '}
            Stock total: {getTotalStock()} unidades
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Variante
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
              </DialogTitle>
              <DialogDescription>
                {editingVariant
                  ? 'Modifica los datos de la variante'
                  : 'Completa los datos para crear una nueva variante'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="variant-name">Nombre *</Label>
                <Input
                  id="variant-name"
                  placeholder="ej: Talla M - Rojo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU</Label>
                <Input
                  id="variant-sku"
                  placeholder="ej: PROD-M-RED"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  }
                />
              </div>

              {/* Precio Override */}
              <div className="space-y-2">
                <Label htmlFor="variant-price">
                  Precio (opcional - deja vacío para usar el precio del producto)
                </Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price_override || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price_override: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                />
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="variant-stock">Stock</Label>
                <Input
                  id="variant-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stock: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              {/* Atributos */}
              <div className="space-y-2">
                <Label>Atributos</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {/* Lista de atributos */}
                  {formData.attributes.length > 0 && (
                    <div className="space-y-2">
                      {formData.attributes.map((attr, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-2 rounded"
                        >
                          <span className="text-sm">
                            <strong>{attr.name}:</strong> {attr.value}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttribute(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar atributo */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre (ej: Talla)"
                      value={attributeInput.name}
                      onChange={(e) =>
                        setAttributeInput((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Valor (ej: M)"
                      value={attributeInput.value}
                      onChange={(e) =>
                        setAttributeInput((prev) => ({ ...prev, value: e.target.value }))
                      }
                    />
                    <Button type="button" onClick={handleAddAttribute} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="variant-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: !!checked }))
                  }
                />
                <Label htmlFor="variant-active" className="cursor-pointer">
                  Variante activa
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {editingVariant ? 'Actualizar' : 'Crear'} Variante
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de variantes */}
      {variants.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Package className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay variantes</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Crea variantes para productos con diferentes tallas, colores, etc.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Atributos</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {formatAttributes(variant.attributes)}
                  </TableCell>
                  <TableCell className="text-sm">{variant.sku || '-'}</TableCell>
                  <TableCell>
                    {variant.price_override ? (
                      <span>${variant.price_override.toFixed(2)}</span>
                    ) : (
                      <span className="text-zinc-400">Predeterminado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock || 0}
                      onChange={(e) => {
                        const newStock = parseInt(e.target.value) || 0;
                        handleQuickStockUpdate(variant.id, newStock);
                      }}
                      className="w-20"
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    {variant.is_active ? (
                      <Badge variant="default">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    {(variant.stock || 0) === 0 && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sin stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(variant)}
                        disabled={isPending}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(variant.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
