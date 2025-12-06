'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      console.log('Attempting signIn...')
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      console.log('SignIn result:', result)

      if (!result) {
        toast.error('Error de conexión')
        return
      }

      if (result.error) {
        // NextAuth returns "CredentialsSignin" for generic errors
        const errorMessage = result.error === 'CredentialsSignin'
          ? 'Email o contraseña incorrectos'
          : result.error
        toast.error(errorMessage)
        return
      }

      if (!result.ok) {
        toast.error('Error al iniciar sesión')
        return
      }

      toast.success('Sesión iniciada')
      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error('SignIn error:', error)
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-50">
          <Store className="h-6 w-6 text-white dark:text-zinc-900" />
        </div>
        <CardTitle className="text-2xl">Panel de Administración</CardTitle>
        <CardDescription>
          Ingresá tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@ejemplo.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={isLoading}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function LoginSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-50">
          <Store className="h-6 w-6 text-white dark:text-zinc-900" />
        </div>
        <CardTitle className="text-2xl">Panel de Administración</CardTitle>
        <CardDescription>
          Cargando...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
