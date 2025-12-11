'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  BarChart3,
  Settings,
  Image,
  Store,
  Tag,
  Star,
  Truck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'

const navItems = [
  {
    title: 'Dashboard',
    href: ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: 'Productos',
    href: ROUTES.ADMIN.PRODUCTS,
    icon: Package,
  },
  {
    title: 'Categorías',
    href: ROUTES.ADMIN.CATEGORIES,
    icon: FolderTree,
  },
  {
    title: 'Pedidos',
    href: ROUTES.ADMIN.ORDERS,
    icon: ShoppingCart,
  },
  {
    title: 'Reseñas',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    title: 'Analíticas',
    href: ROUTES.ADMIN.ANALYTICS,
    icon: BarChart3,
  },
  {
    title: 'Banners',
    href: ROUTES.ADMIN.BANNERS,
    icon: Image,
  },
  {
    title: 'Cupones',
    href: '/admin/coupons',
    icon: Tag,
  },
  {
    title: 'Envíos',
    href: '/admin/shipping',
    icon: Truck,
  },
  {
    title: 'Configuración',
    href: ROUTES.ADMIN.SETTINGS,
    icon: Settings,
  },
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    // Cerrar sidebar en mobile al hacer click en un link
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950",
          // En mobile: se muestra/oculta con transform
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-2" onClick={handleLinkClick}>
            <Store className="h-6 w-6" />
            <span className="text-lg font-bold">Admin</span>
          </Link>

          {/* Botón cerrar (solo mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Store className="h-4 w-4" />
            Ver tienda
          </Link>
        </div>
      </aside>
    </>
  )
}
