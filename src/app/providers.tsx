'use client'

import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider } from "next-themes"
import { useRouter } from 'next/navigation'
import { SessionProvider } from "next-auth/react"

export function Providers({children}: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <NextUIProvider navigate={router.push}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={['light', 'dark']}
        >
          {children}
        </ThemeProvider>
      </NextUIProvider>
    </SessionProvider>
  )
}
