'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Plus, FolderTree, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteCategory } from '@/actions/categories';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const handleDelete = async (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    startTransition(async () => {
      const result = await deleteCategory(categoryToDelete.id);

      if (result.success) {
        toast.success(result.message || 'Categoría eliminada');
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Error al eliminar');
      }
    });
  };

  // Build tree structure
  const buildTree = (parentId: string | null = null): CategoryWithChildren[] => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        ...cat,
        children: buildTree(cat.id),
      }));
  };

  const parentCategories = buildTree();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Categorías
          </h1>
          <p className="text-zinc-500">{categories.length} categoría{categories.length !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? 'Ver Tabla' : 'Ver Tarjetas'}
          </Button>
          <Link href="/admin/categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {parentCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-lg font-medium">No hay categorías</p>
            <p className="text-zinc-500 mb-4">Crea una categoría para organizar tus productos</p>
            <Link href="/admin/categories/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Categoría
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parentCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Subcategorías</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onDelete={handleDelete}
                    isPending={isPending}
                    level={0}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría "{categoryToDelete?.name}".
              {categoryToDelete && categories.filter(c => c.parent_id === categoryToDelete.id).length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ Esta categoría tiene subcategorías que quedarán sin padre.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Category Card Component
function CategoryCard({
  category,
  onDelete,
  isPending,
}: {
  category: CategoryWithChildren;
  onDelete: (category: Category) => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          {category.slug && (
            <p className="text-xs text-zinc-500 mt-1">/{category.slug}</p>
          )}
        </div>
        <div className="flex gap-1">
          {!category.is_active ? (
            <Badge variant="secondary">
              <EyeOff className="h-3 w-3 mr-1" />
              Inactivo
            </Badge>
          ) : (
            <Badge variant="default">
              <Eye className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {category.image_url && (
          <div className="mb-3 aspect-video relative rounded-md overflow-hidden bg-zinc-100">
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
          {category.description || 'Sin descripción'}
        </p>

        {category.children.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-zinc-500 mb-2">
              Subcategorías ({category.children.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {category.children.slice(0, 3).map((sub) => (
                <Badge key={sub.id} variant="outline" className="text-xs">
                  {sub.name}
                </Badge>
              ))}
              {category.children.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{category.children.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/admin/categories/${category.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category)}
            disabled={isPending}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Category Row Component (for table view)
function CategoryRow({
  category,
  onDelete,
  isPending,
  level,
}: {
  category: CategoryWithChildren;
  onDelete: (category: Category) => void;
  isPending: boolean;
  level: number;
}) {
  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && <span className="text-zinc-400">└─</span>}
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="text-zinc-500">/{category.slug}</TableCell>
        <TableCell>
          {category.children.length > 0 && (
            <Badge variant="secondary">{category.children.length}</Badge>
          )}
        </TableCell>
        <TableCell>
          {category.is_active ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </TableCell>
        <TableCell>{category.sort_order}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Link href={`/admin/categories/${category.id}`}>
              <Button variant="ghost" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category)}
              disabled={isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {category.children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          onDelete={onDelete}
          isPending={isPending}
          level={level + 1}
        />
      ))}
    </>
  );
}
