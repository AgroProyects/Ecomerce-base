import { getCategories } from '@/actions/categories';
import { CategoryList } from '@/components/admin/CategoryList';

export default async function CategoriesPage() {
  const categories = await getCategories(false); // Get all, including inactive

  return <CategoryList categories={categories} />;
}
