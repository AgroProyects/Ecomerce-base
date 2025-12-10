'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Plus,
  Search,
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  X,
  Package,
  Eye,
  EyeOff,
  Star,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingDown,
  Filter,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatPrice } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import { IMAGES } from '@/lib/constants/config';
import { cn } from '@/lib/utils/cn';
import { deleteProduct } from '@/actions/products';
import { toast } from 'sonner';
import type { Product, ProductWithCategory, Category } from '@/types/database';

interface ProductListProps {
  products: ProductWithCategory[];
  categories: Category[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

type ViewMode = 'grid' | 'table';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguos' },
  { value: 'name:asc', label: 'Nombre A-Z' },
  { value: 'name:desc', label: 'Nombre Z-A' },
  { value: 'price:asc', label: 'Menor precio' },
  { value: 'price:desc', label: 'Mayor precio' },
  { value: 'stock:asc', label: 'Menor stock' },
  { value: 'stock:desc', label: 'Mayor stock' },
];

export function ProductList({ products, categories, pagination }: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // En mobile siempre usar grid, en desktop por defecto table
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'grid' : 'table'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current filter values from URL
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const currentStock = (searchParams.get('stock') as StockFilter) || 'all';
  const currentSort = searchParams.get('sort') || 'created_at:desc';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Update URL params
  const updateParams = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 when filters change (except when changing page)
    if (!newParams.page) {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Handle search with debounce
  const handleSearch = useCallback(() => {
    updateParams({ search: searchInput });
  }, [searchInput, updateParams]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchInput('');
    router.push(pathname);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentSearch) count++;
    if (currentCategory) count++;
    if (currentStatus !== 'all') count++;
    if (currentStock !== 'all') count++;
    return count;
  }, [currentSearch, currentCategory, currentStatus, currentStock]);

  // Handle delete
  const handleDeleteClick = (product: ProductWithCategory) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        toast.success('Producto eliminado');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    if (!product.track_inventory) return null;
    if (product.stock <= 0) return 'out';
    if (product.stock <= (product.low_stock_threshold || 5)) return 'low';
    return 'ok';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Productos
          </h1>
          <p className="text-zinc-500">
            {pagination.totalItems} producto{pagination.totalItems !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.ADMIN.PRODUCT_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>
                Buscar
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(activeFiltersCount > 0 && 'border-primary')}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Sort */}
              <select
                value={currentSort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View mode - solo visible en desktop */}
              <div className="hidden lg:flex items-center gap-1 rounded-md border border-input p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    viewMode === 'table'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 border-t pt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Category filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Categoría</label>
                  <select
                    value={currentCategory}
                    onChange={(e) => updateParams({ category: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Estado</label>
                  <select
                    value={currentStatus}
                    onChange={(e) => updateParams({ status: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="featured">Destacados</option>
                  </select>
                </div>

                {/* Stock filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Stock</label>
                  <select
                    value={currentStock}
                    onChange={(e) => updateParams({ stock: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todo el stock</option>
                    <option value="in_stock">En stock</option>
                    <option value="low_stock">Stock bajo</option>
                    <option value="out_of_stock">Sin stock</option>
                  </select>
                </div>

                {/* Clear filters */}
                <div className="flex items-end">
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" onClick={clearAllFilters} className="w-full">
                      <X className="mr-2 h-4 w-4" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active filters badges */}
          {activeFiltersCount > 0 && !showFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-500">Filtros activos:</span>
              {currentSearch && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: "{currentSearch}"
                  <button onClick={() => { setSearchInput(''); updateParams({ search: '' }); }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === currentCategory)?.name || 'Categoría'}
                  <button onClick={() => updateParams({ category: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {currentStatus === 'active' ? 'Activos' : currentStatus === 'inactive' ? 'Inactivos' : 'Destacados'}
                  <button onClick={() => updateParams({ status: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentStock !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {currentStock === 'in_stock' ? 'En stock' : currentStock === 'low_stock' ? 'Stock bajo' : 'Sin stock'}
                  <button onClick={() => updateParams({ stock: '' })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-zinc-300" />
            <h3 className="mt-4 text-lg font-semibold">No hay productos</h3>
            <p className="text-zinc-500 mb-4">
              {activeFiltersCount > 0
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Crea tu primer producto para comenzar'}
            </p>
            {activeFiltersCount > 0 ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <Button asChild>
                <Link href={ROUTES.ADMIN.PRODUCT_NEW}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear producto
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View - solo en desktop */
        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100">
                          <Image
                            src={product.images[0] || IMAGES.PLACEHOLDER}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-zinc-500">/{product.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categories ? (
                          <Badge variant="outline">{product.categories.name}</Badge>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.compare_price && (
                            <p className="text-xs text-zinc-500 line-through">
                              {formatPrice(product.compare_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.track_inventory ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-medium',
                                stockStatus === 'out' && 'text-red-600',
                                stockStatus === 'low' && 'text-amber-600'
                              )}
                            >
                              {product.stock}
                            </span>
                            {stockStatus === 'out' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {stockStatus === 'low' && (
                              <TrendingDown className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400">Sin seguimiento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {product.is_active ? (
                            <Badge variant="success" className="gap-1">
                              <Eye className="h-3 w-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <EyeOff className="h-3 w-3" />
                              Inactivo
                            </Badge>
                          )}
                          {product.is_featured && (
                            <Badge variant="default" className="gap-1 bg-amber-500">
                              <Star className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={ROUTES.ADMIN.PRODUCT_EDIT(product.id)}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Grid View - Siempre visible en mobile, condicional en desktop */}
      {(viewMode === 'grid' || typeof window !== 'undefined' && window.innerWidth < 1024) && products.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:hidden xl:hidden">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-zinc-100">
                  <Image
                    src={product.images[0] || IMAGES.PLACEHOLDER}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {!product.is_active && (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="bg-amber-500">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    {stockStatus === 'out' && (
                      <Badge variant="destructive">Sin stock</Badge>
                    )}
                    {stockStatus === 'low' && (
                      <Badge className="bg-amber-100 text-amber-800">Stock bajo</Badge>
                    )}
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={ROUTES.ADMIN.PRODUCT_EDIT(product.id)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>
                  {product.categories && (
                    <p className="text-xs text-zinc-500 mb-2">
                      {product.categories.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{formatPrice(product.price)}</p>
                      {product.compare_price && (
                        <p className="text-xs text-zinc-500 line-through">
                          {formatPrice(product.compare_price)}
                        </p>
                      )}
                    </div>
                    {product.track_inventory && (
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Stock</p>
                        <p
                          className={cn(
                            'font-medium',
                            stockStatus === 'out' && 'text-red-600',
                            stockStatus === 'low' && 'text-amber-600'
                          )}
                        >
                          {product.stock}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grid View para desktop cuando se selecciona */}
      {viewMode === 'grid' && products.length > 0 && (
        <div className="hidden lg:grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-zinc-100">
                  <Image
                    src={product.images[0] || IMAGES.PLACEHOLDER}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {!product.is_active && (
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="bg-amber-500">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    {stockStatus === 'out' && (
                      <Badge variant="destructive">Sin stock</Badge>
                    )}
                    {stockStatus === 'low' && (
                      <Badge className="bg-amber-100 text-amber-800">Stock bajo</Badge>
                    )}
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={ROUTES.ADMIN.PRODUCT_EDIT(product.id)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>
                  {product.categories && (
                    <p className="text-xs text-zinc-500 mb-2">
                      {product.categories.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{formatPrice(product.price)}</p>
                      {product.compare_price && (
                        <p className="text-xs text-zinc-500 line-through">
                          {formatPrice(product.compare_price)}
                        </p>
                      )}
                    </div>
                    {product.track_inventory && (
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Stock</p>
                        <p
                          className={cn(
                            'font-medium',
                            stockStatus === 'out' && 'text-red-600',
                            stockStatus === 'low' && 'text-amber-600'
                          )}
                        >
                          {product.stock}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: (currentPage - 1).toString() })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === pagination.totalPages) return true;
                if (Math.abs(p - currentPage) <= 1) return true;
                return false;
              })
              .map((p, idx, arr) => {
                const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                return (
                  <div key={p} className="flex items-center gap-1">
                    {showEllipsisBefore && (
                      <span className="px-2 text-zinc-400">...</span>
                    )}
                    <Button
                      variant={currentPage === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateParams({ page: p.toString() })}
                      className="min-w-[40px]"
                    >
                      {p}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= pagination.totalPages}
            onClick={() => updateParams({ page: (currentPage + 1).toString() })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente "{productToDelete?.name}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
