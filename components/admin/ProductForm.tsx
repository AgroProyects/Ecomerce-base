'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductInput, type CreateProductFormInput } from '@/schemas/product.schema';
import { createProduct, updateProduct } from '@/actions/products';
import { bulkCreateVariants } from '@/actions/variants';
import { slugify } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductImageManager } from './ProductImageManager';
import { ProductVariantManager } from './ProductVariantManager';
import { VariantGenerator } from './VariantGenerator';
import { VariantImportExport } from './VariantImportExport';
import { VariantSetup, generateVariantsFromConfig, type VariantConfig } from './VariantSetup';
import {
  Loader2,
  Save,
  ArrowLeft,
  Package,
  DollarSign,
  Boxes,
  Eye,
  EyeOff,
  Star,
  Hash,
  FileText,
  FolderTree,
  Search,
  ImageIcon,
  Sparkles,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllProductVariants } from '@/actions/variants';
import { cn } from '@/lib/utils/cn';
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
  const [variantConfig, setVariantConfig] = useState<VariantConfig>({
    enabled: false,
    attributes: [],
    baseStock: 10,
    priceOverride: null,
  });

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
      category_id: product?.category_id || '',
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

  const trackInventory = watch('track_inventory');
  const isActive = watch('is_active');
  const isFeatured = watch('is_featured');
  const currentStock = watch('stock');
  const lowStockThreshold = watch('low_stock_threshold');

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
    if (!product) {
      setValue('slug', slugify(value));
    }
  };

  const onSubmit = async (data: CreateProductFormInput) => {
    if (images.length === 0) {
      toast.error('Debes agregar al menos una imagen');
      return;
    }

    const formData: CreateProductInput = {
      ...data,
      images,
      category_id: data.category_id || null,
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
          result = await updateProduct({
            ...formData,
            id: product.id,
          });
        } else {
          result = await createProduct(formData);
        }

        if (result.success) {
          // Si es un producto nuevo y tiene variantes configuradas, crearlas
          if (!product && variantConfig.enabled && variantConfig.attributes.length > 0 && result.data?.id) {
            const generatedVariants = generateVariantsFromConfig(
              variantConfig,
              data.name,
              data.price
            );

            if (generatedVariants.length > 0) {
              const variantsToCreate = generatedVariants.map((v, index) => ({
                name: v.name,
                sku: v.sku,
                attributes: v.attributes,
                price_override: v.price_override,
                stock: v.stock,
                is_active: true,
                sort_order: index,
              }));

              const variantResult = await bulkCreateVariants({
                product_id: result.data!.id,
                variants: variantsToCreate,
              });

              if (variantResult.success) {
                toast.success(`Producto creado con ${generatedVariants.length} variantes`);
              } else {
                toast.warning('Producto creado, pero hubo un error al crear las variantes');
              }
            } else {
              toast.success(result.message || 'Producto guardado exitosamente');
            }
          } else {
            toast.success(result.message || 'Producto guardado exitosamente');
          }

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

  // Stock status
  const stockStatus = trackInventory
    ? (currentStock ?? 0) <= 0
      ? 'out'
      : (currentStock ?? 0) <= (lowStockThreshold || 5)
        ? 'low'
        : 'ok'
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Botón volver */}
      <Link
        href="/admin/products"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a productos
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Información Básica
              </CardTitle>
              <CardDescription>
                Datos principales del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" />
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
                  className={cn('h-11', errors.name && 'border-red-500')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-zinc-400" />
                  URL (slug) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">/products/</span>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="camiseta-basica-negra"
                    className={cn('h-11 pl-20', errors.slug && 'border-red-500')}
                  />
                </div>
                {errors.slug ? (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    URL amigable. Solo letras minúsculas, números y guiones.
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={5}
                  placeholder="Describe el producto en detalle..."
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
                    errors.description && 'border-red-500'
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category_id" className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-zinc-400" />
                  Categoría
                </Label>
                <select
                  id="category_id"
                  {...register('category_id')}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Imágenes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imágenes
              </CardTitle>
              <CardDescription>
                Agrega imágenes del producto (mínimo 1)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImageManager
                images={images}
                onChange={setImages}
                disabled={isPending}
              />
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Precios
              </CardTitle>
              <CardDescription>
                Configura los precios del producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Precio */}
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Precio de venta <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', { valueAsNumber: true })}
                      placeholder="0.00"
                      className={cn('h-11 pl-8', errors.price && 'border-red-500')}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-red-500">{errors.price.message}</p>
                  )}
                </div>

                {/* Precio de comparación */}
                <div className="space-y-2">
                  <Label htmlFor="compare_price">Precio anterior</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <Input
                      id="compare_price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('compare_price', { valueAsNumber: true, setValueAs: v => v || null })}
                      placeholder="0.00"
                      className="h-11 pl-8"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Para mostrar descuento</p>
                </div>

                {/* Costo */}
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Costo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cost_price', { valueAsNumber: true, setValueAs: v => v || null })}
                      placeholder="0.00"
                      className="h-11 pl-8"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">No visible al público</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                Inventario
              </CardTitle>
              <CardDescription>
                Gestiona el stock del producto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Seguimiento de inventario</p>
                  <p className="text-sm text-zinc-500">
                    Controla el stock disponible del producto
                  </p>
                </div>
                <Switch
                  checked={trackInventory}
                  onCheckedChange={(checked) => setValue('track_inventory', checked)}
                />
              </div>

              {trackInventory && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  {/* Stock */}
                  <div className="space-y-2">
                    <Label htmlFor="stock" className="flex items-center gap-2">
                      Stock disponible
                      {stockStatus === 'out' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {stockStatus === 'low' && (
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                      )}
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      {...register('stock', { valueAsNumber: true })}
                      placeholder="0"
                      className={cn(
                        'h-11',
                        stockStatus === 'out' && 'border-red-500',
                        stockStatus === 'low' && 'border-amber-500'
                      )}
                    />
                    {stockStatus === 'out' && (
                      <p className="text-sm text-red-500">Sin stock</p>
                    )}
                    {stockStatus === 'low' && (
                      <p className="text-sm text-amber-500">Stock bajo</p>
                    )}
                  </div>

                  {/* Umbral */}
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">Alerta de stock bajo</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      min="0"
                      {...register('low_stock_threshold', { valueAsNumber: true })}
                      placeholder="5"
                      className="h-11"
                    />
                    <p className="text-xs text-zinc-500">
                      Se alertará cuando el stock llegue a este nivel
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Variantes - Solo para productos nuevos */}
          {!product && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Variantes del Producto
                </CardTitle>
                <CardDescription>
                  Configura variantes como tallas, colores, etc. durante la creación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VariantSetup
                  config={variantConfig}
                  onChange={setVariantConfig}
                  productName={watch('name') || 'Producto'}
                  basePrice={watch('price') || 0}
                />
              </CardContent>
            </Card>
          )}

          {/* Variantes existentes - Solo si el producto existe */}
          {product && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Variantes
                </CardTitle>
                <CardDescription>
                  Gestiona variantes como tallas, colores, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                SEO
              </CardTitle>
              <CardDescription>
                Optimiza el producto para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  {...register('seo_title')}
                  placeholder="Deja vacío para usar el nombre del producto"
                  maxLength={60}
                  className="h-11"
                />
                <p className="text-xs text-zinc-500">Máximo 60 caracteres</p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta descripción</Label>
                <textarea
                  id="seo_description"
                  {...register('seo_description')}
                  rows={3}
                  placeholder="Deja vacío para usar la descripción del producto"
                  maxLength={160}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <p className="text-xs text-zinc-500">Máximo 160 caracteres</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isActive ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-zinc-400" />
                )}
                Visibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activo */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isActive ? 'Publicado' : 'Borrador'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {isActive
                      ? 'Visible en la tienda'
                      : 'Oculto para clientes'}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
              </div>

              {/* Destacado */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Star className={cn('h-5 w-5', isFeatured ? 'text-amber-500 fill-amber-500' : 'text-zinc-400')} />
                  <div>
                    <p className="font-medium">Destacado</p>
                    <p className="text-sm text-zinc-500">
                      Mostrar en página principal
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={(checked) => setValue('is_featured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          {(images.length > 0 || watch('name')) && (
            <Card>
              <CardHeader>
                <CardTitle>Vista previa</CardTitle>
              </CardHeader>
              <CardContent>
                {images[0] && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 mb-4">
                    <img
                      src={images[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-medium line-clamp-2">
                  {watch('name') || 'Nombre del producto'}
                </h3>
                <p className="text-lg font-bold mt-2">
                  ${watch('price')?.toLocaleString() || '0'}
                </p>
                {watch('compare_price') && (
                  <p className="text-sm text-zinc-500 line-through">
                    ${watch('compare_price')?.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {product ? 'Actualizar' : 'Crear'} Producto
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                  disabled={isPending}
                  className="w-full h-11"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
