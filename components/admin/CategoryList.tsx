'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Edit2,
  Trash2,
  Plus,
  FolderTree,
  Eye,
  EyeOff,
  Layers,
  LayoutGrid,
  TableIcon,
  MoreVertical,
  FolderOpen,
  Hash,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { deleteCategory } from '@/actions/categories'
import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types/database'

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

interface CategoryListProps {
  categories: Category[]
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const handleDelete = async (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    startTransition(async () => {
      const result = await deleteCategory(categoryToDelete.id)

      if (result.success) {
        toast.success(result.message || 'Categoría eliminada')
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  // Build tree structure
  const buildTree = (parentId: string | null = null): CategoryWithChildren[] => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => ({
        ...cat,
        children: buildTree(cat.id),
      }))
  }

  const parentCategories = buildTree()

  // Calculate stats
  const activeCategories = categories.filter((c) => c.is_active).length
  const inactiveCategories = categories.filter((c) => !c.is_active).length
  const rootCategories = categories.filter((c) => !c.parent_id).length
  const subCategories = categories.filter((c) => c.parent_id).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <FolderTree className="h-5 w-5 text-white" />
            </div>
            Categorías
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
          <Link href="/admin/categories/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FolderTree className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{categories.length}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Eye className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Activas</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{activeCategories}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <FolderOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Principales</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{rootCategories}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Layers className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Subcategorías</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{subCategories}</p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {parentCategories.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <FolderTree className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No hay categorías
            </h3>
            <p className="mt-1 text-center text-zinc-500">
              Crea una categoría para organizar tus productos
            </p>
            <Link href="/admin/categories/new">
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
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
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Slug</TableHead>
                  <TableHead className="font-semibold">Subcategorías</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Orden</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
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
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              ¿Eliminar categoría?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Esta acción eliminará la categoría &ldquo;{categoryToDelete?.name}&rdquo;.
              {categoryToDelete && categories.filter(c => c.parent_id === categoryToDelete.id).length > 0 && (
                <span className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <Layers className="h-4 w-4 shrink-0" />
                  Esta categoría tiene subcategorías que quedarán sin padre.
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
  )
}

// Category Card Component
function CategoryCard({
  category,
  onDelete,
  isPending,
}: {
  category: CategoryWithChildren
  onDelete: (category: Category) => void
  isPending: boolean
}) {
  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute right-3 top-3">
            <Badge
              className={cn(
                'text-xs',
                category.is_active
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-zinc-500'
              )}
            >
              {category.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Link href={`/admin/categories/${category.id}`}>
              <Button size="sm" variant="secondary" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                {category.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500">
                <Hash className="h-3 w-3" />
                {category.slug}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/categories/${category.id}`}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(category)}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {category.description && (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
              {category.description}
            </p>
          )}

          {/* Subcategories */}
          {category.children.length > 0 && (
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-500">
                <Layers className="h-3 w-3" />
                {category.children.length} subcategoría{category.children.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1">
                {category.children.slice(0, 3).map((sub) => (
                  <Badge
                    key={sub.id}
                    variant="secondary"
                    className="text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {sub.name}
                  </Badge>
                ))}
                {category.children.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    +{category.children.length - 3} más
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Category Row Component (for table view)
function CategoryRow({
  category,
  onDelete,
  isPending,
  level,
}: {
  category: CategoryWithChildren
  onDelete: (category: Category) => void
  isPending: boolean
  level: number
}) {
  return (
    <>
      <TableRow className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && (
              <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <FolderTree className="h-4 w-4 text-zinc-500" />
            </div>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {category.name}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-zinc-500">/{category.slug}</span>
        </TableCell>
        <TableCell>
          {category.children.length > 0 ? (
            <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {category.children.length}
            </Badge>
          ) : (
            <span className="text-zinc-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <Badge
            className={cn(
              'text-xs',
              category.is_active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            )}
          >
            {category.is_active ? (
              <>
                <Eye className="mr-1 h-3 w-3" />
                Activo
              </>
            ) : (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                Inactivo
              </>
            )}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-zinc-500">{category.sort_order}</span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/admin/categories/${category.id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category)}
              disabled={isPending}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
  )
}
