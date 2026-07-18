export const runtime = 'nodejs'

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/layout/Providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MB-OMS | Multi Brand Order Management System",
  description: "Enterprise Multi Brand Order Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ position: 'relative' }}>
        <div className="root" style={{ isolation: 'isolate', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
