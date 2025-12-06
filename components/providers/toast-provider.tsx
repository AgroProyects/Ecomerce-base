'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800',
          title: 'text-zinc-900 dark:text-zinc-50',
          description: 'text-zinc-500 dark:text-zinc-400',
          success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
          error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
          warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
        },
      }}
    />
  )
}
