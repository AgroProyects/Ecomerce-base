'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'

interface HeroSectionProps {
  storeName?: string | null
  description?: string | null
  bannerUrl?: string | null
  className?: string
}

export function HeroSection({
  storeName,
  description,
  bannerUrl,
  className,
}: HeroSectionProps) {
  const displayName = storeName || 'Bienvenido a nuestra tienda'
  const displayDescription = description || 'Descubrí productos únicos seleccionados especialmente para vos'
  return (
    <section className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black" />

      {/* Decorative elements */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-zinc-200/50 blur-3xl dark:bg-zinc-800/30" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-zinc-200/50 blur-3xl dark:bg-zinc-800/30" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Content */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900">
              <Sparkles className="h-4 w-4" />
              <span>Nueva colección disponible</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl md:text-6xl">
              {displayName}
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {displayDescription}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" asChild className="group">
                <Link href={ROUTES.PRODUCTS}>
                  Explorar productos
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.PRODUCTS}>
                  Ver ofertas
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex gap-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">500+</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Productos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">1000+</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Clientes felices</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">4.9</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Calificación</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative aspect-square w-full max-w-lg">
              {/* Decorative frame */}
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 opacity-20 blur-xl dark:from-zinc-700 dark:to-zinc-800" />

              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-2xl dark:bg-zinc-900">
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt="Hero"
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <Sparkles className="h-10 w-10 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-500">Tu imagen destacada aquí</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating cards */}
              <div className="absolute -left-6 bottom-8 rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Envío gratis</p>
                <p className="text-xs text-zinc-500">En compras +$50.000</p>
              </div>
              <div className="absolute -right-6 top-8 rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Garantía</p>
                <p className="text-xs text-zinc-500">30 días de devolución</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
