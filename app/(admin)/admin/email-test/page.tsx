'use client'

import { useState } from 'react'
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

type EmailStatus = 'idle' | 'loading' | 'success' | 'error'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Email de Prueba')
  const [message, setMessage] = useState('Este es un email de prueba enviado desde el panel de administración.')
  const [status, setStatus] = useState<EmailStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSendTest = async () => {
    if (!email) {
      toast.error('Por favor ingresa un email')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      setStatus('success')
      toast.success('Email enviado exitosamente')

      // Reset después de 3 segundos
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Error sending email:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
      toast.error('Error al enviar email')
    }
  }

  const handleSendVerification = async () => {
    if (!email) {
      toast.error('Por favor ingresa un email')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/email/send-verification-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          name: 'Usuario de Prueba',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      setStatus('success')
      toast.success('Email de verificación enviado')

      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Error sending verification:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
      toast.error('Error al enviar email')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Prueba de Emails
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Envía emails de prueba para verificar la configuración SMTP
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Personalizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Personalizado
            </CardTitle>
            <CardDescription>
              Envía un email con contenido personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email destinatario</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                placeholder="Asunto del email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                placeholder="Escribe tu mensaje aquí..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSendTest}
              disabled={status === 'loading'}
              className="w-full"
              size="lg"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Prueba
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Email de Verificación Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Email de Verificación
            </CardTitle>
            <CardDescription>
              Prueba el template de verificación de email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Este email usa el template profesional de verificación con tu branding.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="verification-email">Email destinatario</Label>
              <Input
                id="verification-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Vista previa del contenido:
              </p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>✓ Header con gradiente verde</li>
                <li>✓ Botón de confirmación destacado</li>
                <li>✓ Link alternativo</li>
                <li>✓ Lista de beneficios</li>
                <li>✓ Footer profesional</li>
              </ul>
            </div>

            <Button
              onClick={handleSendVerification}
              disabled={status === 'loading'}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Verificación
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            Email enviado exitosamente. Revisa la bandeja de entrada del destinatario.
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al enviar el email: {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuración SMTP Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración SMTP Actual</CardTitle>
          <CardDescription>
            Variables de entorno configuradas para el envío de emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-medium text-zinc-500">Host:</span>
              <span className="text-zinc-900 dark:text-zinc-50">{process.env.NEXT_PUBLIC_MAIL_HOST || 'smtp.gmail.com'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-medium text-zinc-500">Puerto:</span>
              <span className="text-zinc-900 dark:text-zinc-50">{process.env.NEXT_PUBLIC_MAIL_PORT || '587'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-medium text-zinc-500">Usuario:</span>
              <span className="text-zinc-900 dark:text-zinc-50">{process.env.NEXT_PUBLIC_MAIL_USER || 'Configurado ✓'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium text-zinc-500">Remitente:</span>
              <span className="text-zinc-900 dark:text-zinc-50">{process.env.NEXT_PUBLIC_MAIL_FROM_NAME || 'Tu Tienda Virtual'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
