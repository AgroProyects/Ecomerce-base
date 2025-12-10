'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants/routes'

type ConfirmationState = 'loading' | 'success' | 'error' | 'already_confirmed'

export function EmailConfirmation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<ConfirmationState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token from URL (Supabase sends token_hash and type)
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (!token_hash || type !== 'email') {
          setState('error')
          setErrorMessage('Link de confirmación inválido')
          return
        }

        const supabase = createClient()

        // Verify OTP with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        })

        if (error) {
          console.error('Error verifying email:', error)

          // Check if already confirmed
          if (error.message.includes('already confirmed') || error.message.includes('expired')) {
            setState('already_confirmed')
          } else {
            setState('error')
            setErrorMessage(error.message || 'Error al confirmar el email')
          }
          return
        }

        // Update customer record
        if (data.user?.id) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              email_verified: true,
              email_verified_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)

          if (updateError) {
            console.error('Error updating customer:', updateError)
          }

          // Log verification attempt
          await supabase.from('email_verification_attempts').insert({
            customer_id: data.user.id,
            email: data.user.email || '',
            verified_at: new Date().toISOString(),
          })
        }

        setState('success')

        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push(ROUTES.HOME)
        }, 3000)
      } catch (error) {
        console.error('Error in confirmEmail:', error)
        setState('error')
        setErrorMessage('Error inesperado al confirmar el email')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto mb-4">
          {state === 'loading' && (
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          )}
          {state === 'success' && (
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          {(state === 'error' || state === 'already_confirmed') && (
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>

        <CardTitle className="text-2xl">
          {state === 'loading' && 'Verificando tu email...'}
          {state === 'success' && '¡Email confirmado!'}
          {state === 'already_confirmed' && 'Email ya confirmado'}
          {state === 'error' && 'Error al confirmar'}
        </CardTitle>

        <CardDescription className="text-base">
          {state === 'loading' && 'Por favor espera mientras confirmamos tu dirección de email'}
          {state === 'success' && 'Tu cuenta ha sido activada exitosamente'}
          {state === 'already_confirmed' && 'Tu email ya había sido confirmado anteriormente'}
          {state === 'error' && errorMessage}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state === 'success' && (
          <>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ¡Bienvenido! 🎉
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Ya puedes disfrutar de todos los beneficios:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                <li>✓ Realizar compras</li>
                <li>✓ Dejar reseñas en productos</li>
                <li>✓ Guardar direcciones de envío</li>
                <li>✓ Recibir ofertas exclusivas</li>
              </ul>
            </div>

            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Serás redirigido a la tienda en unos segundos...
            </div>

            <Button
              onClick={() => router.push(ROUTES.HOME)}
              className="w-full"
              size="lg"
            >
              Ir a la tienda
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {state === 'already_confirmed' && (
          <>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
              Tu email ya está verificado. Puedes continuar usando tu cuenta normalmente.
            </div>

            <Button
              onClick={() => router.push(ROUTES.HOME)}
              className="w-full"
              size="lg"
            >
              Ir a la tienda
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
              <strong className="block mb-1">¿Qué puedes hacer?</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Verifica que el link esté completo</li>
                <li>Intenta copiar y pegar el link nuevamente</li>
                <li>Solicita un nuevo email de confirmación</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => router.push(ROUTES.LOGIN)}
                variant="outline"
                className="flex-1"
              >
                Ir al login
              </Button>
              <Button
                onClick={() => router.push(ROUTES.HOME)}
                className="flex-1"
              >
                Ir a la tienda
              </Button>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando confirmación...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
