import { Suspense } from 'react'
import { EmailConfirmation } from './email-confirmation'

export const metadata = {
  title: 'Confirmar Email - Tu Tienda',
  description: 'Confirma tu dirección de email para activar tu cuenta',
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Verificando...</p>
          </div>
        }
      >
        <EmailConfirmation />
      </Suspense>
    </div>
  )
}
