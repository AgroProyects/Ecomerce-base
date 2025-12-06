import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice } from '@/lib/utils/format'
import { getProducts } from '@/actions/products'
import { ROUTES } from '@/lib/constants/routes'
import { IMAGES } from '@/lib/constants/config'

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const productsResult = await getProducts({
    page,
    pageSize: 20,
    search: params.search,
    isActive: undefined, // Show all
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Productos
          </h1>
          <p className="text-zinc-500">
            {productsResult.pagination.totalItems} productos en total
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.ADMIN.PRODUCT_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsResult.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No hay productos. Crea uno nuevo para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              productsResult.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-zinc-100">
                      <Image
                        src={product.images[0] || IMAGES.PLACEHOLDER}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-zinc-500">/{product.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    {product.track_inventory ? (
                      <span
                        className={
                          product.stock <= 0
                            ? 'text-red-600'
                            : product.stock <= 5
                            ? 'text-yellow-600'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.is_active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.ADMIN.PRODUCT_EDIT(product.id)}>
                        Editar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {productsResult.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: productsResult.pagination.totalPages }, (_, i) => (
            <Link
              key={i + 1}
              href={`/admin/products?page=${i + 1}`}
              className={`rounded-md px-3 py-1 text-sm ${
                page === i + 1
                  ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800'
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
