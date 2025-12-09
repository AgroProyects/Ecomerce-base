import { ProductList } from '@/components/admin/ProductList';
import { getProducts } from '@/actions/products';
import { getCategories } from '@/actions/categories';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    stock?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [sortBy, sortOrder] = (params.sort || 'created_at:desc').split(':');

  // Build filters
  let isActive: boolean | undefined;
  let isFeatured: boolean | undefined;

  if (params.status === 'active') {
    isActive = true;
  } else if (params.status === 'inactive') {
    isActive = false;
  } else if (params.status === 'featured') {
    isFeatured = true;
  }

  // Get products with filters
  const [productsResult, categories] = await Promise.all([
    getProducts({
      page,
      pageSize: 20,
      search: params.search,
      categoryId: params.category || undefined,
      isActive,
      isFeatured,
      sortBy: sortBy as 'created_at' | 'name' | 'price' | 'stock',
      sortOrder: sortOrder as 'asc' | 'desc',
    }),
    getCategories(false),
  ]);

  // Filter by stock status client-side (since DB doesn't have this filter directly)
  let filteredProducts = productsResult.data;
  if (params.stock === 'in_stock') {
    filteredProducts = filteredProducts.filter(
      (p) => !p.track_inventory || p.stock > (p.low_stock_threshold || 5)
    );
  } else if (params.stock === 'low_stock') {
    filteredProducts = filteredProducts.filter(
      (p) => p.track_inventory && p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)
    );
  } else if (params.stock === 'out_of_stock') {
    filteredProducts = filteredProducts.filter(
      (p) => p.track_inventory && p.stock <= 0
    );
  }

  return (
    <ProductList
      products={filteredProducts}
      categories={categories}
      pagination={productsResult.pagination}
    />
  );
}
