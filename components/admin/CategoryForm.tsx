'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CreateCategoryInput } from '@/schemas/category.schema';
import { createCategory, updateCategory } from '@/actions/categories';
import { slugify } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { Category } from '@/types/database';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      image_url: category?.image_url || null,
      parent_id: category?.parent_id || null,
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order || 0,
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

  const name = watch('name');

  // Auto-generar slug desde el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!category) {
      // Solo auto-generar en creación
      setValue('slug', slugify(value));
    }
  };

  // Actualizar image_url cuando cambia imageUrl
  useEffect(() => {
    setValue('image_url', imageUrl);
  }, [imageUrl, setValue]);

  const onSubmit = async (data: CreateCategoryInput) => {
    const formData = {
      ...data,
      image_url: imageUrl,
    };

    startTransition(async () => {
      try {
        let result;

        if (category) {
          // Actualizar categoría existente
          result = await updateCategory({
            ...formData,
            id: category.id,
          });
        } else {
          // Crear nueva categoría
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await upload(file);
  };

  // Filtrar categorías disponibles para parent (evitar ciclos)
  const availableParentCategories = categories.filter((cat) => {
    if (category && cat.id === category.id) return false; // No puede ser su propio padre
    if (category && cat.parent_id === category.id) return false; // No puede ser hijo
    return true;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Información Básica</h3>
          <p className="text-sm text-gray-500">
            Datos principales de la categoría
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre */}
          <div>
            <Label htmlFor="name">
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
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="electronica"
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Se usa en la URL. Solo letras minúsculas, números y guiones.
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Descripción de la categoría"
            className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Imagen */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Imagen</h3>
          <p className="text-sm text-gray-500">
            Imagen de la categoría
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          {/* Preview de imagen */}
          {imageUrl && (
            <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2"
              >
                Eliminar
              </Button>
            </div>
          )}

          {/* Upload */}
          <div>
            <Label htmlFor="image">Subir Imagen</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {isUploading && (
              <div className="mt-2">
                <div className="text-sm text-gray-600">
                  Subiendo... {Math.round(progress)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Formatos: JPG, PNG, WebP. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Jerarquía */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Jerarquía</h3>
          <p className="text-sm text-gray-500">
            Organización de la categoría
          </p>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Categoría padre */}
          <div>
            <Label htmlFor="parent_id">Categoría Padre (opcional)</Label>
            <select
              id="parent_id"
              {...register('parent_id')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin categoría padre</option>
              {availableParentCategories
                .filter((cat) => !cat.parent_id) // Solo categorías principales
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Si seleccionas una categoría padre, esta será una subcategoría.
            </p>
          </div>

          {/* Orden */}
          <div>
            <Label htmlFor="sort_order">Orden</Label>
            <Input
              id="sort_order"
              type="number"
              {...register('sort_order', { valueAsNumber: true })}
              placeholder="0"
              className={errors.sort_order ? 'border-red-500' : ''}
            />
            {errors.sort_order && (
              <p className="text-sm text-red-500 mt-1">{errors.sort_order.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Menor número = aparece primero
            </p>
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Estado</h3>
          <p className="text-sm text-gray-500">
            Controla la visibilidad de la categoría
          </p>
        </div>

        <Separator />

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            defaultChecked={watch('is_active')}
            onCheckedChange={(checked) => setValue('is_active', !!checked)}
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Categoría activa (visible en la tienda)
          </Label>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/categories')}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || isUploading}>
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
      </div>
    </form>
  );
}
