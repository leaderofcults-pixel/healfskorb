"use client"

import * as React from "react"
import { ThemeProvider } from "./theme-provider"
import { Toaster } from "./ui/sonner"
import { VercelAnalytics } from "./analytics"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
      <VercelAnalytics />
    </ThemeProvider>
  )
}
