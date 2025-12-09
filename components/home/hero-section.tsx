'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Star, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
}

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

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

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className={cn('relative min-h-[90vh] overflow-hidden', className)}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black" />

      {/* Dynamic gradient orbs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-200/40 to-fuchsia-200/40 blur-3xl transition-transform duration-1000 dark:from-violet-900/20 dark:to-fuchsia-900/20"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-200/40 to-blue-200/40 blur-3xl transition-transform duration-1000 dark:from-cyan-900/20 dark:to-blue-900/20"
        style={{
          transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <motion.div
            className="flex flex-col"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Floating badges */}
            <motion.div
              className="mb-8 flex flex-wrap gap-3"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Nueva colección
              </motion.div>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Tendencias 2024
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-5xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-50 md:text-6xl lg:text-7xl"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="block">{displayName}</span>
              <motion.span
                className="mt-2 block bg-gradient-to-r from-zinc-600 via-zinc-800 to-zinc-900 bg-clip-text text-transparent dark:from-zinc-400 dark:via-zinc-200 dark:to-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Estilo único
              </motion.span>
            </motion.h1>

            <motion.p
              className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {displayDescription}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="mt-10 flex flex-wrap gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  asChild
                  className="group h-14 rounded-full bg-zinc-900 px-8 text-base font-semibold shadow-xl shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:shadow-2xl hover:shadow-zinc-900/30 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-zinc-50/10 dark:hover:bg-zinc-200"
                >
                  <Link href={ROUTES.PRODUCTS}>
                    Explorar productos
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-14 rounded-full border-2 px-8 text-base font-semibold backdrop-blur-sm"
                >
                  <Link href="/categories">
                    Ver categorías
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-16 flex items-center gap-8 border-t border-zinc-200/60 pt-8 dark:border-zinc-800"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <motion.div
                className="group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  500<span className="text-2xl text-zinc-400">+</span>
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">Productos</p>
              </motion.div>
              <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-800" />
              <motion.div
                className="group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  1.2k<span className="text-2xl text-zinc-400">+</span>
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">Clientes felices</p>
              </motion.div>
              <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-800" />
              <motion.div
                className="group flex items-start gap-1"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">4.9</p>
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-3 text-sm font-medium text-zinc-500">Rating</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            className="relative flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="relative aspect-[4/5] w-full max-w-lg">
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-60 blur-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Main container */}
              <motion.div
                className="relative h-full w-full overflow-hidden rounded-3xl border border-zinc-200/50 bg-zinc-100 shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-900"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt="Hero"
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-inner dark:from-zinc-700 dark:to-zinc-800">
                        <Zap className="h-12 w-12 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">Tu imagen destacada</p>
                    </div>
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </motion.div>

              {/* Floating cards */}
              <motion.div
                className="absolute -left-8 bottom-16 z-10"
                initial={{ opacity: 0, x: -30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">Envío gratis</p>
                      <p className="text-sm text-zinc-500">En compras +$50.000</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute -right-8 top-16 z-10"
                initial={{ opacity: 0, x: 30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <motion.div
                  className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
                      <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">Garantía</p>
                      <p className="text-sm text-zinc-500">30 días devolución</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Rating badge */}
              <motion.div
                className="absolute -bottom-4 right-8 z-10"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <motion.div
                  className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95"
                  whileHover={{ scale: 1.1, y: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.1 + i * 0.1 }}
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">4.9</span>
                  <span className="text-sm text-zinc-500">(2.5k)</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Scroll</span>
          <div className="h-12 w-6 rounded-full border-2 border-zinc-300 p-1 dark:border-zinc-700">
            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
          </div>
        </div>
      </div>
    </section>
  )
}
