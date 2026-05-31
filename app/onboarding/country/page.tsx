"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import MarketingAuthLayout from "@/components/marketing/MarketingAuthLayout"
import CountrySetupForm from "@/components/CountrySetupForm"

export default function CountryOnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    const checkCountry = async () => {
      try {
        const response = await fetch("/api/user/me")
        if (response.ok) {
          const data = await response.json()
          if (data.country) {
            router.replace("/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Failed to check user country:", error)
      } finally {
        setChecking(false)
      }
    }

    checkCountry()
  }, [status, router])

  if (status === "loading" || checking) {
    return (
      <MarketingAuthLayout title="One more step">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto mb-4" />
          <p className="marketing-auth__subtitle">Loading…</p>
        </div>
      </MarketingAuthLayout>
    )
  }

  return (
    <MarketingAuthLayout
      title="Confirm your country"
      subtitle={
        <>
          Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}! Choose where
          you&apos;re based so pledge amounts use the right currency.
        </>
      }
    >
      <CountrySetupForm
        submitLabel="Continue to Community Pledges"
        onSuccess={() => {
          router.push("/dashboard")
          router.refresh()
        }}
      />
    </MarketingAuthLayout>
  )
}
