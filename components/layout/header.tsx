'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ShoppingCart, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { ROUTES } from '@/lib/constants/routes'
import { IMAGES } from '@/lib/constants/config'

interface HeaderProps {
  storeName?: string
  logoUrl?: string | null
  categories?: Array<{ id: string; name: string; slug: string }>
}

export function Header({
  storeName = 'Mi Tienda',
  logoUrl,
  categories = [],
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { itemsCount, openCart } = useCart()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={storeName}
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {storeName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href={ROUTES.PRODUCTS}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Productos
            </Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={ROUTES.CATEGORY(category.slug)}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link href={ROUTES.LOGIN}>
                <User className="h-5 w-5" />
                <span className="sr-only">Cuenta</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {itemsCount}
                </span>
              )}
              <span className="sr-only">Carrito</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Menú</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="border-t border-zinc-200 py-4 md:hidden dark:border-zinc-800">
            <div className="flex flex-col gap-2">
              <Link
                href={ROUTES.PRODUCTS}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Todos los productos
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={ROUTES.CATEGORY(category.slug)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
