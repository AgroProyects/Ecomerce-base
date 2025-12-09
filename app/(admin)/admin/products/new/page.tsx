import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/actions/categories';

export const metadata = {
  title: 'Nuevo Producto | Admin',
  description: 'Crear un nuevo producto',
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Nuevo Producto
        </h1>
        <p className="text-zinc-500">
          Crea un nuevo producto para tu tienda
        </p>
      </div>

      {/* Formulario */}
      <ProductForm categories={categories} />
    </div>
  );
}
