'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ClientOnly } from '@/components/ClientOnly'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <ClientOnly>
            <Toaster richColors position="top-right" />
          </ClientOnly>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
