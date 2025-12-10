'use client'

import { useState } from 'react'
import { Mail, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resendVerificationEmail } from '@/actions/auth/verification'
import { toast } from 'sonner'

interface EmailVerificationBannerProps {
  email: string
  onDismiss?: () => void
}

export function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleResend = async () => {
    setIsResending(true)
    try {
      const result = await resendVerificationEmail(email)

      if (result.success) {
        toast.success('Email enviado', {
          description: 'Revisa tu bandeja de entrada y confirma tu email.'
        })
      } else {
        toast.error(result.error || 'Error al enviar email')
      }
    } catch (error) {
      toast.error('Error al enviar email de verificación')
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (isDismissed) return null

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 mb-4 relative">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pr-8">
        <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
          <strong className="font-semibold">Confirma tu email para continuar.</strong>
          <span className="hidden sm:inline"> Enviamos un mensaje a </span>
          <span className="sm:hidden block mt-1">Enviamos un mensaje a </span>
          <strong className="font-medium">{email}</strong>
          <span className="hidden sm:inline"> con instrucciones.</span>
          <span className="sm:hidden block">con instrucciones.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResend}
          disabled={isResending}
          className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900 shrink-0 w-full sm:w-auto"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? 'Enviando...' : 'Reenviar email'}
        </Button>
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </button>
    </Alert>
  )
}
