import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  Phone,
  FileText,
  Cake,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No disponible'

  // Calculate membership duration
  const getMembershipDuration = () => {
    if (!user?.created_at) return null
    const start = new Date(user.created_at)
    const now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    if (months < 1) return 'Nuevo miembro'
    if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
    const years = Math.floor(months / 12)
    return `${years} ${years === 1 ? 'año' : 'años'}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <User className="h-5 w-5 text-white" />
          </div>
          Mi Perfil
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Actualiza tu información personal
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Estos datos se usarán para personalizar tu experiencia
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Cuenta</CardTitle>
                  <CardDescription className="text-xs">
                    Información de tu cuenta
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-500">Email</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {session.user.email}
                  </p>
                </div>
                {user?.email_verified && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">Miembro desde</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {memberSince}
                  </p>
                </div>
              </div>

              {getMembershipDuration() && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Clock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Tiempo de membresía</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {getMembershipDuration()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Resumen</p>
                  <p className="text-xs text-zinc-500">Tu actividad en la tienda</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {user?.total_orders || 0}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Pedidos</p>
                </div>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {user?.total_reviews || 0}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Reseñas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          {(!user?.phone || !user?.dni) && (
            <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 shrink-0">
                    <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Completa tu perfil
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      Agrega tu {!user?.phone && 'teléfono'}{!user?.phone && !user?.dni && ' y '}{!user?.dni && 'DNI'} para agilizar tus compras.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
