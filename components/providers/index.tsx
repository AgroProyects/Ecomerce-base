'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from './query-provider'
import { ToastProvider } from './toast-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
        <ToastProvider />
      </QueryProvider>
    </SessionProvider>
  )
}

export { QueryProvider } from './query-provider'
export { ToastProvider } from './toast-provider'
