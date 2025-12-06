'use client'

import { useState } from 'react'
import { Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)

    // Simular envío - acá iría la lógica real de subscripción
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsLoading(false)
    setIsSubmitted(true)
    setEmail('')
    toast.success('¡Te suscribiste correctamente!')
  }

  return (
    <section className="relative overflow-hidden bg-zinc-900 dark:bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-zinc-800 to-transparent opacity-50" />
        <div className="absolute -right-1/4 top-0 h-full w-1/2 bg-gradient-to-l from-zinc-800 to-transparent opacity-50" />
      </div>

      <div className="container relative mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Mantenete al día
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Suscribite a nuestro newsletter y recibí ofertas exclusivas, novedades y descuentos especiales
          </p>

          {isSubmitted ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-green-400">
              <Check className="h-5 w-5" />
              <span>¡Gracias por suscribirte!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus:border-white"
              />
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="bg-white text-zinc-900 hover:bg-zinc-200"
              >
                <Send className="mr-2 h-4 w-4" />
                Suscribirme
              </Button>
            </form>
          )}

          <p className="mt-4 text-sm text-zinc-500">
            Sin spam. Podés darte de baja cuando quieras.
          </p>
        </div>
      </div>
    </section>
  )
}
