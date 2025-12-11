'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, etc.)
    }
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-10 w-10 text-red-600" />
      </div>

      <h1 className="mb-2 text-2xl font-bold">Algo salió mal</h1>
      <p className="mb-8 max-w-md text-zinc-600 dark:text-zinc-400">
        Lo sentimos, ocurrió un error inesperado. Por favor, intenta nuevamente.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 w-full max-w-md rounded-lg bg-zinc-100 p-4 text-left dark:bg-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Error details (dev only):
          </p>
          <p className="mt-1 text-sm font-mono text-red-600 dark:text-red-400 break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-zinc-400">
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Ir al Inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}
