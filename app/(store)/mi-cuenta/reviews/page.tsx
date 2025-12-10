import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { MyReviewsPanel } from './my-reviews-panel'

export const metadata = {
  title: 'Mis Reseñas - Mi Cuenta',
  description: 'Gestiona tus reseñas de productos',
}

export default async function MyReviewsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?redirect=/mi-cuenta/reviews')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Reseñas</h1>
        <p className="text-muted-foreground mt-2">
          Administra las reseñas que has dejado en productos
        </p>
      </div>

      <MyReviewsPanel userId={session.user.id} />
    </div>
  )
}
