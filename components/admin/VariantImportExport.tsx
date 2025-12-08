'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { parseCSV, downloadCSV } from '@/lib/utils/csv';
import { bulkCreateVariants } from '@/actions/variants';
import type { ProductVariant } from '@/types/database';

interface VariantImportExportProps {
  productId: string;
  variants: ProductVariant[];
  onImportComplete: () => void;
}

export function VariantImportExport({
  productId,
  variants,
  onImportComplete,
}: VariantImportExportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exportar variantes a CSV
  const handleExport = () => {
    if (variants.length === 0) {
      toast.error('No hay variantes para exportar');
      return;
    }

    const headers = [
      'name',
      'sku',
      'price_override',
      'stock',
      'attributes',
      'image_url',
      'is_active',
      'sort_order',
    ];

    const rows = variants.map((variant) => {
      const attributes = variant.attributes as Array<{ name: string; value: string }>;
      const attributesStr = JSON.stringify(attributes);

      return [
        variant.name,
        variant.sku || '',
        variant.price_override?.toString() || '',
        variant.stock?.toString() || '0',
        attributesStr,
        variant.image_url || '',
        variant.is_active ? 'true' : 'false',
        variant.sort_order?.toString() || '0',
      ];
    });

    const csvData = [headers, ...rows];
    downloadCSV(csvData, `variantes_producto_${productId}.csv`);
    toast.success('CSV exportado exitosamente');
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);

        if (parsed.length < 2) {
          setImportError('El archivo CSV debe contener al menos una fila de datos');
          return;
        }

        const headers = parsed[0];
        const dataRows = parsed.slice(1);

        // Validar headers requeridos
        const requiredHeaders = ['name', 'stock', 'attributes'];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          setImportError(
            `Faltan columnas requeridas: ${missingHeaders.join(', ')}`
          );
          return;
        }

        // Convertir a objetos
        const variantsData = dataRows.map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        setImportPreview(variantsData);
        setImportError(null);
      } catch (error) {
        setImportError('Error al procesar el archivo CSV');
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  // Confirmar importación
  const handleConfirmImport = async () => {
    if (importPreview.length === 0) {
      toast.error('No hay datos para importar');
      return;
    }

    setIsProcessing(true);

    try {
      // Convertir preview a formato de variantes
      const variantsToCreate = importPreview.map((item, index) => {
        let attributes = [];
        try {
          attributes = JSON.parse(item.attributes || '[]');
        } catch {
          attributes = [];
        }

        return {
          name: item.name,
          sku: item.sku || null,
          price_override: item.price_override ? parseFloat(item.price_override) : null,
          stock: parseInt(item.stock) || 0,
          attributes,
          image_url: item.image_url || null,
          is_active: item.is_active === 'true',
          sort_order: item.sort_order ? parseInt(item.sort_order) : index,
        };
      });

      const result = await bulkCreateVariants({
        product_id: productId,
        variants: variantsToCreate,
      });

      if (result.success) {
        toast.success(result.message || 'Variantes importadas exitosamente');
        setIsImportDialogOpen(false);
        setImportPreview([]);
        onImportComplete();

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(result.error || 'Error al importar variantes');
      }
    } catch (error) {
      toast.error('Error inesperado al importar');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Descargar plantilla CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'name',
      'sku',
      'price_override',
      'stock',
      'attributes',
      'image_url',
      'is_active',
      'sort_order',
    ];

    const exampleRow = [
      'Talla M / Rojo',
      'PROD-M-RED',
      '29.99',
      '100',
      '[{"name":"Talla","value":"M"},{"name":"Color","value":"Rojo"}]',
      'https://ejemplo.com/imagen.jpg',
      'true',
      '0',
    ];

    const csvData = [headers, exampleRow];
    downloadCSV(csvData, 'plantilla_variantes.csv');
    toast.success('Plantilla descargada');
  };

  return (
    <div className="flex gap-2">
      {/* Botón Exportar */}
      <Button variant="outline" onClick={handleExport} disabled={variants.length === 0}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>

      {/* Botón Importar */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Variantes desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con las variantes a importar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Botón descargar plantilla */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    ¿Primera vez importando?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Descarga la plantilla para ver el formato correcto del CSV
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="border-blue-300 dark:border-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                </div>
              </div>
            </div>

            {/* Input de archivo */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Seleccionar archivo CSV
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-zinc-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-zinc-900 file:text-white
                  dark:file:bg-white dark:file:text-zinc-900
                  hover:file:bg-zinc-800 dark:hover:file:bg-zinc-100
                  cursor-pointer"
              />
            </div>

            {/* Error */}
            {importError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Error en el archivo
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {importError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {importPreview.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Vista previa ({importPreview.length} variante{importPreview.length !== 1 ? 's' : ''})
                </p>
                <div className="border rounded-lg overflow-auto max-h-[300px]">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                          SKU
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                          Stock
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                      {importPreview.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm">{item.name}</td>
                          <td className="px-3 py-2 text-sm text-zinc-500">{item.sku || '-'}</td>
                          <td className="px-3 py-2 text-sm">{item.stock}</td>
                          <td className="px-3 py-2 text-sm">
                            {item.price_override ? `$${item.price_override}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportPreview([]);
                setImportError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importPreview.length === 0 || isProcessing}
            >
              {isProcessing ? 'Importando...' : 'Confirmar Importación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
