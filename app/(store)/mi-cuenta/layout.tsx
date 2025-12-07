import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, CreditCard, User, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/mi-cuenta', label: 'Resumen', icon: User, exact: true },
  { href: '/mi-cuenta/pedidos', label: 'Mis Pedidos', icon: Package },
  { href: '/mi-cuenta/direcciones', label: 'Direcciones', icon: MapPin },
  { href: '/mi-cuenta/pagos', label: 'Medios de Pago', icon: CreditCard },
  { href: '/mi-cuenta/perfil', label: 'Mis Datos', icon: User },
]

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la tienda
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-8 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden mb-6 overflow-x-auto">
            <nav className="flex gap-2 pb-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                    "bg-white dark:bg-zinc-900 border",
                    "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
