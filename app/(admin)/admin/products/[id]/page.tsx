import { ProductForm } from '@/components/admin/ProductForm';
import { getProductById } from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { notFound } from 'next/navigation';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  return {
    title: product ? `Editar ${product.name} | Admin` : 'Producto no encontrado',
    description: product ? `Editar el producto ${product.name}` : undefined,
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

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
            Editar Producto
          </h1>
          <p className="text-zinc-500">{product.name}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
