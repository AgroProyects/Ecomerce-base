'use client'

import { motion, HTMLMotionProps, Variants, Transition } from 'framer-motion'
import { forwardRef } from 'react'

// ===== Variantes de animación predefinidas =====

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 100 },
  visible: { opacity: 1, y: 0 },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ===== Transiciones predefinidas =====

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const smoothTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

export const quickTransition: Transition = {
  duration: 0.3,
  ease: 'easeOut',
}

// ===== Componentes de animación =====

// Contenedor con fade in
interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.5, direction = 'up', ...props }, ref) => {
    const variants: Record<string, Variants> = {
      up: fadeInUp,
      down: fadeInDown,
      left: fadeInLeft,
      right: fadeInRight,
      none: fadeIn,
    }

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants[direction]}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
FadeIn.displayName = 'FadeIn'

// Componente que anima al entrar en viewport
interface AnimateOnScrollProps extends HTMLMotionProps<'div'> {
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none' | 'scale'
  once?: boolean
  amount?: number | 'some' | 'all'
}

export const AnimateOnScroll = forwardRef<HTMLDivElement, AnimateOnScrollProps>(
  ({ children, delay = 0, duration = 0.6, direction = 'up', once = true, amount = 0.3, ...props }, ref) => {
    const getVariants = (): Variants => {
      switch (direction) {
        case 'up':
          return fadeInUp
        case 'down':
          return fadeInDown
        case 'left':
          return fadeInLeft
        case 'right':
          return fadeInRight
        case 'scale':
          return scaleIn
        default:
          return fadeIn
      }
    }

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount }}
        variants={getVariants()}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimateOnScroll.displayName = 'AnimateOnScroll'

// Contenedor con stagger para listas
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
  initialDelay?: number
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.1, initialDelay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: initialDelay,
            },
          },
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerContainer.displayName = 'StaggerContainer'

// Item para usar dentro de StaggerContainer
interface StaggerItemProps extends HTMLMotionProps<'div'> {
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, direction = 'up', ...props }, ref) => {
    const getVariants = (): Variants => {
      switch (direction) {
        case 'up':
          return { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }
        case 'down':
          return { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } }
        case 'left':
          return { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }
        case 'right':
          return { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }
        default:
          return staggerItem
      }
    }

    return (
      <motion.div
        ref={ref}
        variants={getVariants()}
        transition={smoothTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerItem.displayName = 'StaggerItem'

// Componente con hover scale
interface HoverScaleProps extends HTMLMotionProps<'div'> {
  scale?: number
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, scale = 1.02, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
HoverScale.displayName = 'HoverScale'

// Componente con hover lift (sombra y elevación)
interface HoverLiftProps extends HTMLMotionProps<'div'> {
  liftAmount?: number
}

export const HoverLift = forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ children, liftAmount = -5, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{
          y: liftAmount,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
HoverLift.displayName = 'HoverLift'

// Animación de pulso para badges/notificaciones
interface PulseProps extends HTMLMotionProps<'div'> {
  pulseScale?: number
}

export const Pulse = forwardRef<HTMLDivElement, PulseProps>(
  ({ children, pulseScale = 1.05, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          scale: [1, pulseScale, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Pulse.displayName = 'Pulse'

// Shimmer/skeleton loading
export const Shimmer = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200% 100%',
        }}
        {...props}
      />
    )
  }
)
Shimmer.displayName = 'Shimmer'

// Rotate on hover
interface RotateOnHoverProps extends HTMLMotionProps<'div'> {
  degrees?: number
}

export const RotateOnHover = forwardRef<HTMLDivElement, RotateOnHoverProps>(
  ({ children, degrees = 5, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ rotate: degrees }}
        transition={springTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
RotateOnHover.displayName = 'RotateOnHover'

// Bounce animation
export const Bounce = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Bounce.displayName = 'Bounce'

// Page transition wrapper
interface PageTransitionProps extends HTMLMotionProps<'div'> {
  variant?: 'fade' | 'slide' | 'scale'
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, variant = 'fade', ...props }, ref) => {
    const variants: Record<string, Variants> = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      slide: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      },
      scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05 },
      },
    }

    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[variant]}
        transition={smoothTransition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
PageTransition.displayName = 'PageTransition'

// Animated Button wrapper
interface AnimatedButtonProps extends HTMLMotionProps<'div'> {
  scale?: number
  tapScale?: number
}

export const AnimatedButton = forwardRef<HTMLDivElement, AnimatedButtonProps>(
  ({ children, scale = 1.02, tapScale = 0.98, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: tapScale }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedButton.displayName = 'AnimatedButton'

// Card with hover effect
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  hoverY?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hoverY = -8, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: hoverY,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedCard.displayName = 'AnimatedCard'

// Export motion primitives for custom use
export { motion, AnimatePresence } from 'framer-motion'
export type { Variants, HTMLMotionProps }
