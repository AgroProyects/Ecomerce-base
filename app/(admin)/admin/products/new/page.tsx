import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/actions/categories';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export const metadata = {
  title: 'Nuevo Producto | Admin',
  description: 'Crear un nuevo producto',
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.ADMIN.PRODUCTS}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Nuevo Producto
          </h1>
          <p className="text-zinc-500">
            Crea un nuevo producto para tu tienda
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
