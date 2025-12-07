'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  message: z.string().min(20, 'El mensaje debe tener al menos 20 caracteres'),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactoPage() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true)
    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 1500))
    toast.success('Mensaje enviado correctamente. Te responderemos pronto.')
    reset()
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Contactanos</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Estamos aquí para ayudarte. Envianos tu consulta y te responderemos lo antes posible.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Información de contacto */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Información de contacto</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Mail className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-zinc-600 dark:text-zinc-400">contacto@mitienda.com</p>
                <p className="text-sm text-zinc-500">Respondemos en menos de 24 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Phone className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-medium">Teléfono</h3>
                <p className="text-zinc-600 dark:text-zinc-400">+54 11 1234-5678</p>
                <p className="text-sm text-zinc-500">Lunes a Viernes de 9 a 18hs</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <MessageSquare className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p className="text-zinc-600 dark:text-zinc-400">+54 9 11 1234-5678</p>
                <p className="text-sm text-zinc-500">Respuesta rápida</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <MapPin className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-medium">Dirección</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Av. Corrientes 1234, Piso 5<br />
                  Buenos Aires, Argentina
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Clock className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h3 className="font-medium">Horario de atención</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Lunes a Viernes: 9:00 - 18:00<br />
                  Sábados: 10:00 - 14:00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-6 text-2xl font-semibold">Envianos un mensaje</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Nombre completo"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <div>
                  <Input
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Teléfono (opcional)"
                    type="tel"
                    {...register('phone')}
                  />
                </div>
                <div>
                  <Input
                    label="Asunto"
                    {...register('subject')}
                    error={errors.subject?.message}
                  />
                </div>
              </div>

              <div>
                <Textarea
                  label="Mensaje"
                  rows={5}
                  {...register('message')}
                  error={errors.message?.message}
                  placeholder="Contanos en qué podemos ayudarte..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
