'use client'

import { QueryProvider } from './query-provider'
import { ToastProvider } from './toast-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <ToastProvider />
    </QueryProvider>
  )
}

export { QueryProvider } from './query-provider'
export { ToastProvider } from './toast-provider'
