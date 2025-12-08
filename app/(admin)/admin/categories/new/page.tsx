import { Metadata } from 'next';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { getCategories } from '@/actions/categories';

export const metadata: Metadata = {
  title: 'Nueva Categoría | Admin',
  description: 'Crear una nueva categoría',
};

export default async function NewCategoryPage() {
  const categories = await getCategories(false); // Todas las categorías para el selector de padre

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Nueva Categoría
        </h1>
        <p className="text-zinc-500">
          Crea una nueva categoría para organizar tus productos
        </p>
      </div>

      {/* Formulario */}
      <CategoryForm categories={categories} />
    </div>
  );
}
