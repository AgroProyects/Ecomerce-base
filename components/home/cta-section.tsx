import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  title?: string
  description?: string
  contactEmail?: string | null
  contactPhone?: string | null
}

export function CTASection({
  title = '¿Tenés alguna pregunta?',
  description = 'Nuestro equipo está listo para ayudarte. Contactanos y te respondemos a la brevedad.',
  contactEmail,
  contactPhone,
}: CTASectionProps) {
  const hasContact = contactEmail || contactPhone

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-100 md:p-12">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl dark:bg-black/5" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-3xl dark:bg-black/5" />

        <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:justify-between">
          <div className="mb-6 md:mb-0 md:max-w-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white dark:bg-black/10 dark:text-zinc-900">
              <MessageCircle className="h-4 w-4" />
              <span>Estamos para ayudarte</span>
            </div>
            <h2 className="text-2xl font-bold text-white dark:text-zinc-900 md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-zinc-300 dark:text-zinc-600">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {contactEmail && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-zinc-900 dark:border-black/20 dark:bg-black/10 dark:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                asChild
              >
                <a href={`mailto:${contactEmail}`}>
                  Enviar email
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {contactPhone && (
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                asChild
              >
                <a href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {!hasContact && (
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                asChild
              >
                <Link href="/contact">
                  Contactar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
