'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos se consideran frescos por 1 minuto
            staleTime: 60 * 1000,
            // Cache se mantiene por 5 minutos
            gcTime: 5 * 60 * 1000,
            // Reintentar 1 vez en caso de error
            retry: 1,
            // No refetch al reconectar
            refetchOnReconnect: false,
            // No refetch al cambiar de pestaña
            refetchOnWindowFocus: false,
          },
          mutations: {
            // No reintentar mutations
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
