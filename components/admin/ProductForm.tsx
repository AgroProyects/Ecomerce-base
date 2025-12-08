'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductInput, type CreateProductFormInput } from '@/schemas/product.schema';
import { createProduct, updateProduct } from '@/actions/products';
import { slugify } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ProductImageManager } from './ProductImageManager';
import { ProductVariantManager } from './ProductVariantManager';
import { VariantGenerator } from './VariantGenerator';
import { VariantImportExport } from './VariantImportExport';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getAllProductVariants } from '@/actions/variants';
import type { Product, Category, ProductVariant } from '@/types/database';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateProductFormInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      price: product?.price || 0,
      compare_price: product?.compare_price || null,
      cost_price: product?.cost_price || null,
      images: product?.images || [],
      category_id: product?.category_id || null,
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      track_inventory: product?.track_inventory ?? true,
      stock: product?.stock || 0,
      low_stock_threshold: product?.low_stock_threshold || 5,
      seo_title: product?.seo_title || null,
      seo_description: product?.seo_description || null,
      metadata: (product?.metadata as Record<string, unknown>) || null,
    },
  });

  const name = watch('name');
  const trackInventory = watch('track_inventory');

  // Cargar variantes si el producto existe
  useEffect(() => {
    if (product?.id) {
      loadVariants();
    }
  }, [product?.id]);

  const loadVariants = async () => {
    if (!product?.id) return;

    setLoadingVariants(true);
    const result = await getAllProductVariants(product.id);
    if (result.success && result.data) {
      setVariants(result.data);
    }
    setLoadingVariants(false);
  };

  // Auto-generar slug desde el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!product) { // Solo auto-generar en creación
      setValue('slug', slugify(value));
    }
  };

  const onSubmit = async (data: CreateProductFormInput) => {
    // Validar que haya al menos una imagen
    if (images.length === 0) {
      toast.error('Debes agregar al menos una imagen');
      return;
    }

    const formData: CreateProductInput = {
      ...data,
      images,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      track_inventory: data.track_inventory ?? true,
      stock: data.stock ?? 0,
      low_stock_threshold: data.low_stock_threshold ?? 5,
    };

    startTransition(async () => {
      try {
        let result;

        if (product) {
          // Actualizar producto existente
          result = await updateProduct({
            ...formData,
            id: product.id,
          });
        } else {
          // Crear nuevo producto
          result = await createProduct(formData);
        }

        if (result.success) {
          toast.success(result.message || 'Producto guardado exitosamente');
          router.push('/admin/products');
          router.refresh();
        } else {
          toast.error(result.error || 'Error al guardar el producto');
        }
      } catch (error) {
        toast.error('Error inesperado al guardar el producto');
        console.error(error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Información básica</h3>
          <p className="text-sm text-gray-500">
            Información general del producto
          </p>
        </div>

        <Separator />

        <div className="grid gap-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="name">
              Nombre del producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              onChange={(e) => {
                register('name').onChange(e);
                handleNameChange(e);
              }}
              placeholder="Ej: Camiseta básica negra"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">
              URL (slug) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="camiseta-basica-negra"
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              URL amigable para el producto. Solo letras minúsculas, números y guiones.
            </p>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={5}
              placeholder="Describe el producto..."
              className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <Label htmlFor="category_id">Categoría</Label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Imágenes</h3>
          <p className="text-sm text-gray-500">
            Agrega imágenes del producto
          </p>
        </div>

        <Separator />

        <ProductImageManager
          images={images}
          onChange={setImages}
          disabled={isPending}
        />
      </div>

      {/* Precios */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Precios</h3>
          <p className="text-sm text-gray-500">
            Configura los precios del producto
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          {/* Precio */}
          <div>
            <Label htmlFor="price">
              Precio <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                className={`pl-7 ${errors.price ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
            )}
          </div>

          {/* Precio de comparación */}
          <div>
            <Label htmlFor="compare_price">Precio de comparación</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="compare_price"
                type="number"
                step="0.01"
                {...register('compare_price', { valueAsNumber: true, setValueAs: v => v || null })}
                placeholder="0.00"
                className={`pl-7 ${errors.compare_price ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.compare_price && (
              <p className="text-sm text-red-500 mt-1">{errors.compare_price.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Precio anterior para mostrar descuento
            </p>
          </div>

          {/* Costo */}
          <div>
            <Label htmlFor="cost_price">Costo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                {...register('cost_price', { valueAsNumber: true, setValueAs: v => v || null })}
                placeholder="0.00"
                className={`pl-7 ${errors.cost_price ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.cost_price && (
              <p className="text-sm text-red-500 mt-1">{errors.cost_price.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Costo del producto (no visible al público)
            </p>
          </div>
        </div>
      </div>

      {/* Inventario */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Inventario</h3>
          <p className="text-sm text-gray-500">
            Gestiona el stock del producto
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          {/* Track inventory */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="track_inventory"
              checked={trackInventory}
              onCheckedChange={(checked) => setValue('track_inventory', !!checked)}
            />
            <Label htmlFor="track_inventory" className="cursor-pointer">
              Realizar seguimiento del inventario
            </Label>
          </div>

          {trackInventory && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Stock */}
              <div>
                <Label htmlFor="stock">Stock disponible</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.stock ? 'border-red-500' : ''}
                />
                {errors.stock && (
                  <p className="text-sm text-red-500 mt-1">{errors.stock.message}</p>
                )}
              </div>

              {/* Low stock threshold */}
              <div>
                <Label htmlFor="low_stock_threshold">Umbral de stock bajo</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  {...register('low_stock_threshold', { valueAsNumber: true })}
                  placeholder="5"
                  className={errors.low_stock_threshold ? 'border-red-500' : ''}
                />
                {errors.low_stock_threshold && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.low_stock_threshold.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Se te notificará cuando el stock llegue a este nivel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variantes - Solo mostrar si el producto ya existe */}
      {product && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Variantes del Producto</h3>
            <p className="text-sm text-gray-500">
              Gestiona variantes como tallas, colores, etc.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex gap-2">
              <VariantGenerator productId={product.id} onGenerated={loadVariants} />
              <VariantImportExport
                productId={product.id}
                variants={variants}
                onImportComplete={loadVariants}
              />
            </div>

            {loadingVariants ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
                <p className="text-sm text-zinc-500 mt-2">Cargando variantes...</p>
              </div>
            ) : (
              <ProductVariantManager
                productId={product.id}
                variants={variants}
                onUpdate={loadVariants}
              />
            )}
          </div>
        </div>
      )}

      {/* SEO */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">SEO</h3>
          <p className="text-sm text-gray-500">
            Optimiza el producto para motores de búsqueda
          </p>
        </div>

        <Separator />

        <div className="grid gap-4">
          {/* SEO Title */}
          <div>
            <Label htmlFor="seo_title">Título SEO</Label>
            <Input
              id="seo_title"
              {...register('seo_title')}
              placeholder="Deja vacío para usar el nombre del producto"
              maxLength={60}
              className={errors.seo_title ? 'border-red-500' : ''}
            />
            {errors.seo_title && (
              <p className="text-sm text-red-500 mt-1">{errors.seo_title.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Máximo 60 caracteres
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <Label htmlFor="seo_description">Descripción SEO</Label>
            <textarea
              id="seo_description"
              {...register('seo_description')}
              rows={3}
              placeholder="Deja vacío para usar la descripción del producto"
              maxLength={160}
              className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                errors.seo_description ? 'border-red-500' : ''
              }`}
            />
            {errors.seo_description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.seo_description.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Máximo 160 caracteres
            </p>
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Estado</h3>
          <p className="text-sm text-gray-500">
            Controla la visibilidad del producto
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              defaultChecked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', !!checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Producto activo (visible en la tienda)
            </Label>
          </div>

          {/* Is Featured */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_featured"
              defaultChecked={watch('is_featured')}
              onCheckedChange={(checked) => setValue('is_featured', !!checked)}
            />
            <Label htmlFor="is_featured" className="cursor-pointer">
              Producto destacado (aparece en la página principal)
            </Label>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {product ? 'Actualizar producto' : 'Crear producto'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
