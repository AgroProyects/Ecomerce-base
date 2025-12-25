'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, ArrowRight, Sparkles, ShieldCheck, Package, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleButton } from '@/components/auth/google-button'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/mi-cuenta'
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (!result) {
        toast.error('Error de conexión')
        return
      }

      if (result.error) {
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

      // Obtener la sesión para verificar el rol
      const response = await fetch('/api/auth/session')
      const session = await response.json()

      const userRole = session?.user?.role

      toast.success('¡Bienvenido de nuevo!')

      // Redirigir según el rol del usuario
      if (userRole === 'admin' || userRole === 'super_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push(callbackUrl)
      }

      router.refresh()
    } catch (error) {
      console.error('SignIn error:', error)
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Mi Tienda</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Iniciá sesión para acceder a tu cuenta y ver tus pedidos
            </p>
          </div>

          {/* Social login */}
          <GoogleButton mode="login" />

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-zinc-500 dark:bg-zinc-950">
                o continuá con email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-sm transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-12 text-sm transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Recordarme</span>
              </label>
              <Link
                href="/recuperar-password"
                className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-zinc-900 text-base font-semibold hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            ¿No tenés cuenta?{' '}
            <Link
              href="/registro"
              className="font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
            >
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-zinc-900 lg:to-zinc-800 lg:p-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-400" />
            <span className="text-2xl font-bold text-white">Premium Experience</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-white">
            Accedé a beneficios exclusivos para miembros
          </h2>

          <div className="mt-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Compra segura</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Todos tus datos están protegidos con encriptación SSL
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Seguimiento de pedidos</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Seguí el estado de tus compras en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ofertas exclusivas</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Accedé a descuentos especiales solo para miembros
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-lg italic text-zinc-300">
              "Excelente experiencia de compra. Los productos llegaron en perfecto estado y antes de lo esperado."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
              <div>
                <p className="font-medium text-white">María García</p>
                <p className="text-sm text-zinc-400">Cliente verificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-4 px-4">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
