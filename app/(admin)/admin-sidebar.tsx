'use client'

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
    title: 'Configuración',
    href: ROUTES.ADMIN.SETTINGS,
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href={ROUTES.ADMIN.DASHBOARD} className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <span className="text-lg font-bold">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
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
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <Store className="h-4 w-4" />
          Ver tienda
        </Link>
      </div>
    </aside>
  )
}
