'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, Loader2, Tag, Package, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'

interface SearchResult {
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    compare_price: number | null
    images: string[]
    category: { name: string; slug: string } | null
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
    image_url: string | null
  }>
  query: string
}

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cargar búsquedas recientes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`)
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveSearch(query.trim())
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  const handleProductClick = (slug: string) => {
    saveSearch(query)
    router.push(ROUTES.PRODUCT(slug))
    onClose()
  }

  const handleCategoryClick = (slug: string) => {
    saveSearch(query)
    router.push(ROUTES.CATEGORY(slug))
    onClose()
  }

  const handleRecentSearch = (term: string) => {
    setQuery(term)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-auto mt-[10vh] w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos, categorías..."
              className="w-full bg-transparent py-4 pl-12 pr-12 text-lg outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </form>

          <div className="border-t border-zinc-200 dark:border-zinc-800" />

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Categorías */}
                {results.categories.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <Tag className="h-3 w-3" />
                      Categorías
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.slug)}
                          className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productos */}
                {results.products.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <Package className="h-3 w-3" />
                      Productos
                    </h3>
                    <div className="space-y-2">
                      {results.products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.slug)}
                          className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              <Package className="h-6 w-6 text-zinc-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            {product.category && (
                              <p className="text-sm text-zinc-500">
                                {product.category.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(product.price)}</p>
                            {product.compare_price && product.compare_price > product.price && (
                              <p className="text-sm text-zinc-400 line-through">
                                {formatPrice(product.compare_price)}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin resultados */}
                {results.products.length === 0 && results.categories.length === 0 && (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-zinc-300" />
                    <p className="text-zinc-500">
                      No encontramos resultados para "{query}"
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Intentá con otras palabras
                    </p>
                  </div>
                )}

                {/* Ver todos los resultados */}
                {(results.products.length > 0 || results.categories.length > 0) && (
                  <button
                    onClick={handleSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Ver todos los resultados
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              /* Búsquedas recientes o sugerencias */
              <div>
                {recentSearches.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Búsquedas recientes
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => handleRecentSearch(term)}
                          className="rounded-full border border-zinc-200 px-4 py-2 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recentSearches.length === 0 && (
                  <div className="py-8 text-center">
                    <Search className="mx-auto mb-3 h-12 w-12 text-zinc-300" />
                    <p className="text-zinc-500">
                      Escribí para buscar productos
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Podés buscar por nombre, categoría o descripción
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">↵</kbd>
                  buscar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">esc</kbd>
                  cerrar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
