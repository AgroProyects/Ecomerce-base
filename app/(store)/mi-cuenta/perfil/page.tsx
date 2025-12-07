import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from './profile-form'

export default async function PerfilPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mis Datos</h1>
        <p className="text-muted-foreground mt-1">
          Actualizá tu información personal
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Estos datos se usarán para personalizar tu experiencia y agilizar tus compras.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              user={{
                id: session.user.id,
                name: user?.name || '',
                email: user?.email || session.user.email,
                phone: user?.phone || '',
                dni: user?.dni || '',
                birth_date: user?.birth_date || '',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>
              Información de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                <p className="text-sm">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
