'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CreateCategoryInput } from '@/schemas/category.schema';
import { createCategory, updateCategory } from '@/actions/categories';
import { slugify } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Save,
  ImageIcon,
  Upload,
  X,
  FolderTree,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Hash,
  FileText,
  Layers,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { Category } from '@/types/database';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const STORAGE_BUCKETS = {
  CATEGORIES: 'categories' as const,
};

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description ?? null,
      image_url: category?.image_url ?? null,
      parent_id: category?.parent_id ?? null,
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order ?? 0,
    },
  });

  const { upload, isUploading, progress } = useFileUpload({
    bucket: STORAGE_BUCKETS.CATEGORIES,
    maxSize: 5,
    allowedTypes: ['image/*'],
    onSuccess: (result) => {
      if (result.publicUrl) {
        setImageUrl(result.publicUrl);
        setValue('image_url', result.publicUrl);
        toast.success('Imagen subida exitosamente');
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const isActive = watch('is_active');

  // Auto-generar slug desde el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!category) {
      setValue('slug', slugify(value));
    }
  };

  // Actualizar image_url cuando cambia imageUrl
  useEffect(() => {
    setValue('image_url', imageUrl);
  }, [imageUrl, setValue]);

  const onSubmit = async (data: Record<string, unknown>) => {
    const formData: CreateCategoryInput = {
      name: data.name as string,
      slug: data.slug as string,
      description: (data.description as string | null) ?? null,
      image_url: imageUrl,
      parent_id: (data.parent_id as string | null) ?? null,
      is_active: data.is_active as boolean,
      sort_order: data.sort_order as number,
    };

    startTransition(async () => {
      try {
        let result;

        if (category) {
          result = await updateCategory({
            ...formData,
            id: category.id,
          });
        } else {
          result = await createCategory(formData);
        }

        if (result.success) {
          toast.success(result.message || 'Categoría guardada exitosamente');
          router.push('/admin/categories');
          router.refresh();
        } else {
          toast.error(result.error || 'Error al guardar la categoría');
        }
      } catch (error) {
        toast.error('Error inesperado al guardar la categoría');
      }
    });
  };

  const handleImageUpload = async (file: File) => {
    await upload(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      toast.error('Por favor, arrastra una imagen válida');
    }
  };

  // Filtrar categorías disponibles para parent (evitar ciclos)
  const availableParentCategories = categories.filter((cat) => {
    if (category && cat.id === category.id) return false;
    if (category && cat.parent_id === category.id) return false;
    return !cat.parent_id; // Solo categorías principales
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Botón volver */}
      <Link
        href="/admin/categories"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a categorías
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
                Datos principales de la categoría
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={(e) => {
                    register('name').onChange(e);
                    handleNameChange(e);
                  }}
                  placeholder="ej: Electrónica"
                  className={cn(
                    'h-11',
                    errors.name && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-zinc-400" />
                  Slug <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">/</span>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="electronica"
                    className={cn(
                      'h-11 pl-7',
                      errors.slug && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                </div>
                {errors.slug ? (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Se usa en la URL. Solo letras minúsculas, números y guiones.
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  placeholder="Describe la categoría para ayudar a los clientes a encontrar lo que buscan..."
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none',
                    errors.description && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Imagen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imagen
              </CardTitle>
              <CardDescription>
                Imagen representativa de la categoría (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="relative group">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Cambiar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setImageUrl(null);
                          setValue('image_url', null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative aspect-video w-full rounded-lg border-2 border-dashed cursor-pointer transition-all',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-primary hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  )}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-sm text-zinc-500">Subiendo... {Math.round(progress)}%</p>
                        <div className="w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <Upload className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Arrastra una imagen aquí
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            o haz clic para seleccionar
                          </p>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2">
                          JPG, PNG, WebP • Máx. 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
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
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isActive ? 'Activa' : 'Inactiva'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {isActive
                      ? 'Visible en la tienda'
                      : 'Oculta para los clientes'}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Jerarquía */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Organización
              </CardTitle>
              <CardDescription>
                Configura la jerarquía y orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categoría padre */}
              <div className="space-y-2">
                <Label htmlFor="parent_id" className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-zinc-400" />
                  Categoría Padre
                </Label>
                <select
                  id="parent_id"
                  {...register('parent_id')}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sin categoría padre</option>
                  {availableParentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500">
                  Déjalo vacío para crear una categoría principal
                </p>
              </div>

              {/* Orden */}
              <div className="space-y-2">
                <Label htmlFor="sort_order" className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-zinc-400" />
                  Orden de visualización
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  {...register('sort_order', { valueAsNumber: true })}
                  placeholder="0"
                  className={cn(
                    'h-11',
                    errors.sort_order && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.sort_order ? (
                  <p className="text-sm text-red-500">{errors.sort_order.message}</p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Menor número = aparece primero
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isPending || isUploading}
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
                      {category ? 'Actualizar' : 'Crear'} Categoría
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/categories')}
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
