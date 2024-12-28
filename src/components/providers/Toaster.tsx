'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToasterProvider() {
  const { theme } = useTheme()

  return (
    <Toaster 
      position="bottom-right"
      richColors
      theme={theme === 'dark' ? 'dark' : 'light'}
      closeButton
    />
  )
}
