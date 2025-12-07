import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { Package, MapPin, CreditCard, User } from 'lucide-react'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignOutButton } from './sign-out-button'

export default async function MiCuentaPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const menuItems = [
    {
      title: 'Mis Pedidos',
      description: 'Ver historial de compras y estado de envíos',
      href: '/mi-cuenta/pedidos',
      icon: Package,
    },
    {
      title: 'Direcciones',
      description: 'Gestionar direcciones de envío',
      href: '/mi-cuenta/direcciones',
      icon: MapPin,
    },
    {
      title: 'Medios de Pago',
      description: 'Administrar tarjetas y métodos de pago',
      href: '/mi-cuenta/pagos',
      icon: CreditCard,
    },
    {
      title: 'Mis Datos',
      description: 'Editar información personal',
      href: '/mi-cuenta/perfil',
      icon: User,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mi Cuenta</h1>
        <p className="text-muted-foreground mt-2">
          Hola, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <item.icon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  )
}
