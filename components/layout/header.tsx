'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  ShoppingCart,
  Search,
  User,
  Heart,
  ChevronDown,
  Sparkles,
  Package,
  LogOut,
  UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { ROUTES } from '@/lib/constants/routes'
import { SearchDialog } from './search-dialog'
import { useSession, signOut } from 'next-auth/react'

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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { itemsCount, openCart } = useCart()
  const { items: wishlistItems } = useWishlist()
  const pathname = usePathname()
  const { data: session } = useSession()

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Atajo de teclado Ctrl/Cmd + K para abrir búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cerrar menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-center gap-2 text-sm text-white">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Envío gratis en compras mayores a $50.000</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Hasta 12 cuotas sin interés</span>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'border-b border-zinc-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/95'
            : 'border-b border-transparent bg-white dark:bg-zinc-950'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
            {/* Logo */}
            <Link
              href={ROUTES.HOME}
              className="group flex shrink-0 items-center gap-3"
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={140}
                  height={45}
                  className="h-9 w-auto transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-lg dark:from-zinc-100 dark:to-zinc-300">
                    <Package className="h-5 w-5 text-white dark:text-zinc-900" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {storeName}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              <Link
                href={ROUTES.PRODUCTS}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors',
                  pathname === '/products'
                    ? 'text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                )}
              >
                Todos los productos
                {pathname === '/products' && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-50" />
                )}
              </Link>
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.id}
                  href={ROUTES.CATEGORY(category.slug)}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-colors',
                    pathname === `/categories/${category.slug}`
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                  )}
                >
                  {category.name}
                </Link>
              ))}
              {categories.length > 5 && (
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                  Más
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </nav>

            {/* Search bar - Desktop */}
            <div className="hidden flex-1 justify-center px-8 lg:flex">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex h-11 w-full max-w-md items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 text-sm text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Search className="h-4 w-4" />
                <span>Buscar productos...</span>
                <kbd className="ml-auto hidden rounded-md bg-zinc-200/80 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 sm:inline-block">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Buscar productos"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/favoritos" aria-label={wishlistItems.length > 0 ? `Favoritos (${wishlistItems.length} productos)` : 'Ir a favoritos'}>
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white" aria-hidden="true">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
              </Button>

              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative"
                  aria-label={session ? 'Abrir menú de usuario' : 'Iniciar sesión'}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>

                {/* User dropdown */}
                <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                    <motion.div
                      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {session ? (
                        <>
                          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {session.user?.name || 'Usuario'}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {session.user?.email}
                            </p>
                          </div>
                          <div className="p-2">
                            <Link
                              href="/mi-cuenta"
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <UserCircle className="h-4 w-4" />
                              Mi cuenta
                            </Link>
                            <Link
                              href="/mi-cuenta/pedidos"
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <Package className="h-4 w-4" />
                              Mis pedidos
                            </Link>
                            <Link
                              href="/favoritos"
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <Heart className="h-4 w-4" />
                              Favoritos
                            </Link>
                          </div>
                          <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
                            <button
                              onClick={() => signOut()}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                            >
                              <LogOut className="h-4 w-4" />
                              Cerrar sesión
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-2">
                          <Link
                            href={ROUTES.LOGIN}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <User className="h-4 w-4" />
                            Iniciar sesión
                          </Link>
                          <Link
                            href="/registro"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <UserCircle className="h-4 w-4" />
                            Crear cuenta
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={openCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <AnimatePresence>
                    {itemsCount > 0 && (
                      <motion.span
                        className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-zinc-900 to-zinc-700 text-[10px] font-bold text-white shadow-lg dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        key={itemsCount}
                      >
                        {itemsCount > 99 ? '99+' : itemsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="overflow-hidden border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <nav className="container mx-auto px-4 py-4">
                <motion.div
                  className="space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <Link
                      href={ROUTES.PRODUCTS}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                        pathname === '/products'
                          ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                      )}
                    >
                      <Package className="h-5 w-5" />
                      Todos los productos
                    </Link>
                  </motion.div>
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <Link
                        href={ROUTES.CATEGORY(category.slug)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        {category.name}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/favoritos"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    <Heart className="h-5 w-5" />
                    Mis favoritos
                    {wishlistItems.length > 0 && (
                      <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/50 dark:text-red-400">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/seguimiento"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    <Search className="h-5 w-5" />
                    Seguir mi pedido
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Dialog */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
