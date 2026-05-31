"use client"

import { SessionProvider } from "next-auth/react"
import { CurrencyProvider } from "@/components/CurrencyProvider"
import CountryOnboardingGate from "@/components/CountryOnboardingGate"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        {children}
        <CountryOnboardingGate />
      </CurrencyProvider>
    </SessionProvider>
  )
}


