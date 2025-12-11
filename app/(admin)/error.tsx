'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AdminError({
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
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Ha ocurrido un error</CardTitle>
          <CardDescription>
            Lo sentimos, algo salió mal al cargar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/admin/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
