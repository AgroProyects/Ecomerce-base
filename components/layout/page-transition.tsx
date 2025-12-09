'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, Easing, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

// Número de barras horizontales
const NUM_BARS = 5

// Colores de las barras (gradiente de zinc oscuro)
const BAR_COLORS = [
  '#18181b', // zinc-900
  '#27272a', // zinc-800
  '#3f3f46', // zinc-700
  '#52525b', // zinc-600
  '#71717a', // zinc-500
]

// Custom easing para efecto más dinámico
const customEase: Easing = [0.76, 0, 0.24, 1]

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'covering' | 'revealing'>('idle')
  const [displayChildren, setDisplayChildren] = useState(children)
  const [currentPath, setCurrentPath] = useState(pathname)
  const isFirstRender = useRef(true)

  // Actualizar children cuando cambian y estamos en idle
  useEffect(() => {
    if (phase === 'idle') {
      setDisplayChildren(children)
    }
  }, [children, phase])

  // Detectar cambio de ruta
  useEffect(() => {
    // Ignorar el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (pathname !== currentPath && phase === 'idle') {
      setPhase('covering')
    }
  }, [pathname, currentPath, phase])

  // Manejar fases de la transición
  useEffect(() => {
    if (phase === 'covering') {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setCurrentPath(pathname)
        setPhase('revealing')
      }, 550) // Tiempo para que las barras cubran
      return () => clearTimeout(timer)
    }

    if (phase === 'revealing') {
      const timer = setTimeout(() => {
        setPhase('idle')
      }, 600) // Tiempo para que las barras se revelen
      return () => clearTimeout(timer)
    }
  }, [phase, children, pathname])

  const isTransitioning = phase !== 'idle'

  return (
    <>
      {/* Overlay de barras horizontales - solo visible durante transición */}
      <AnimatePresence>
        {isTransitioning && (
          <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
            {[...Array(NUM_BARS)].map((_, index) => (
              <motion.div
                key={index}
                className="flex-1"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: phase === 'covering' ? 1 : 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: phase === 'covering'
                    ? index * 0.06
                    : (NUM_BARS - 1 - index) * 0.06,
                  ease: customEase,
                }}
                style={{
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  transformOrigin: phase === 'revealing' ? 'right' : 'left',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Contenido de la página */}
      <motion.div
        key={currentPath}
        initial={isFirstRender.current ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: phase === 'revealing' ? 0.3 : 0,
          ease: 'easeOut' as Easing,
        }}
      >
        {displayChildren}
      </motion.div>
    </>
  )
}

// Componente alternativo con más barras horizontales y efecto más dramático
export function PageTransitionDramatic({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'covering' | 'revealing'>('idle')
  const [displayChildren, setDisplayChildren] = useState(children)
  const [currentPath, setCurrentPath] = useState(pathname)

  const NUM_DRAMATIC_BARS = 8

  useEffect(() => {
    if (pathname !== currentPath && phase === 'idle') {
      setPhase('covering')
    }
  }, [pathname, currentPath, phase])

  useEffect(() => {
    if (phase === 'covering') {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setCurrentPath(pathname)
        setPhase('revealing')
      }, 600)
      return () => clearTimeout(timer)
    }

    if (phase === 'revealing') {
      const timer = setTimeout(() => {
        setPhase('idle')
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [phase, children, pathname])

  return (
    <>
      {/* Barras horizontales animadas */}
      <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none">
        {[...Array(NUM_DRAMATIC_BARS)].map((_, index) => (
          <motion.div
            key={index}
            className="flex-1"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: phase === 'covering' ? 1 : phase === 'revealing' ? 0 : 0,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.05,
              ease: customEase,
            }}
            style={{
              backgroundColor: `hsl(240, 5%, ${10 + index * 5}%)`,
              transformOrigin: phase === 'revealing' ? 'right' : 'left',
            }}
          />
        ))}
      </div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: phase === 'idle' ? 1 : phase === 'revealing' ? 1 : 0,
        }}
        transition={{ duration: 0.3, delay: phase === 'revealing' ? 0.3 : 0 }}
      >
        {displayChildren}
      </motion.div>
    </>
  )
}

// Componente con efecto de cortina horizontal
export function PageTransitionCurtain({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'covering' | 'revealing'>('idle')
  const [displayChildren, setDisplayChildren] = useState(children)
  const [currentPath, setCurrentPath] = useState(pathname)

  const NUM_CURTAIN_BARS = 6

  useEffect(() => {
    if (pathname !== currentPath && phase === 'idle') {
      setPhase('covering')
    }
  }, [pathname, currentPath, phase])

  useEffect(() => {
    if (phase === 'covering') {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setCurrentPath(pathname)
        setPhase('revealing')
      }, 700)
      return () => clearTimeout(timer)
    }

    if (phase === 'revealing') {
      const timer = setTimeout(() => {
        setPhase('idle')
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [phase, children, pathname])

  return (
    <>
      {/* Barras horizontales con efecto de cortina */}
      <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none overflow-hidden">
        {[...Array(NUM_CURTAIN_BARS)].map((_, index) => (
          <motion.div
            key={index}
            className="flex-1 relative"
            style={{
              backgroundColor: 'transparent',
            }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{
                clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
              }}
              animate={{
                clipPath: phase === 'covering'
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                  : phase === 'revealing'
                  ? 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
                  : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
                ease: customEase,
              }}
              style={{
                background: `linear-gradient(90deg,
                  hsl(240, 6%, ${8 + index * 3}%) 0%,
                  hsl(240, 6%, ${15 + index * 3}%) 100%)`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Contenido con fade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: phase === 'idle' ? 1 : 0,
          y: phase === 'idle' ? 0 : 10,
        }}
        transition={{
          duration: 0.4,
          delay: phase === 'idle' ? 0.2 : 0,
          ease: 'easeOut' as Easing,
        }}
      >
        {displayChildren}
      </motion.div>
    </>
  )
}
