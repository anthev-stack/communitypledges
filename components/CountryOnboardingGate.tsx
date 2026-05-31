"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import CountrySetupForm from "@/components/CountrySetupForm"

const SKIP_PATH_PREFIXES = ["/login", "/register", "/onboarding", "/api"]

export default function CountryOnboardingGate() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [needsCountry, setNeedsCountry] = useState(false)
  const [checking, setChecking] = useState(false)

  const shouldSkip =
    !pathname ||
    SKIP_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )

  useEffect(() => {
    if (status !== "authenticated" || shouldSkip) {
      setNeedsCountry(false)
      setChecking(false)
      return
    }

    let cancelled = false
    setChecking(true)

    fetch("/api/user/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setNeedsCountry(Boolean(data && !data.country))
        }
      })
      .catch(() => {
        if (!cancelled) setNeedsCountry(false)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, session?.user?.id, shouldSkip, pathname])

  if (shouldSkip || status !== "authenticated" || checking || !needsCountry) {
    return null
  }

  return (
    <div
      className="country-onboarding-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-onboarding-title"
    >
      <div className="country-onboarding-gate__backdrop" />
      <div className="country-onboarding-gate__panel marketing-auth__card">
        <header className="marketing-auth__header">
          <h2 id="country-onboarding-title" className="marketing-auth__title">
            Confirm your country
          </h2>
          <p className="marketing-auth__subtitle">
            We need your country so pledge amounts show in your local currency (e.g. AUD, not USD by
            default).
          </p>
        </header>
        <CountrySetupForm
          submitLabel="Save and continue"
          onSuccess={() => setNeedsCountry(false)}
        />
      </div>
    </div>
  )
}
