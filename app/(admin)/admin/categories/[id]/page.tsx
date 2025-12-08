import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { getCategories, getCategoryById } from '@/actions/categories';

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: EditCategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategoryById(id);

  return {
    title: category ? `Editar ${category.name} | Admin` : 'Categoría no encontrada',
    description: 'Editar categoría',
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  const [category, categories] = await Promise.all([
    getCategoryById(id),
    getCategories(false), // Todas las categorías para el selector de padre
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Editar Categoría
        </h1>
        <p className="text-zinc-500">
          Modifica los datos de la categoría "{category.name}"
        </p>
      </div>

      {/* Formulario */}
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
