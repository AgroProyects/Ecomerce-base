import Link from 'next/link'
import { Plus, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCategories } from '@/actions/categories'

export default async function CategoriesPage() {
  const categories = await getCategories(false) // Get all, including inactive

  // Build tree structure
  const parentCategories = categories.filter((c) => !c.parent_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Categorías
          </h1>
          <p className="text-zinc-500">{categories.length} categorías en total</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {parentCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-lg font-medium">No hay categorías</p>
            <p className="text-zinc-500">Crea una categoría para organizar tus productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parentCategories.map((category) => {
            const subcategories = categories.filter((c) => c.parent_id === category.id)

            return (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {!category.is_active && (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {category.description || 'Sin descripción'}
                  </p>

                  {subcategories.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-zinc-500 mb-2">
                        Subcategorías ({subcategories.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {subcategories.map((sub) => (
                          <Badge key={sub.id} variant="outline">
                            {sub.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
