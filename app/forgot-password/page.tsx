"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import MarketingAuthLayout from "@/components/marketing/MarketingAuthLayout"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send reset email")
        return
      }

      setSubmitted(true)
      setMessage(data.message)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <MarketingAuthLayout
        title="Check your email"
        subtitle={message || "If an account exists for that address, we sent a reset link."}
        backHref="/login"
      >
        <div className="marketing-auth__success-icon" aria-hidden>
          <Mail className="w-7 h-7" />
        </div>

        <p className="marketing-auth__subtitle text-center mb-4">
          The link expires in <strong className="text-white">5 minutes</strong> for your security.
        </p>

        <div className="space-y-3">
          <div className="marketing-auth__callout marketing-auth__callout--warn">
            <strong>Time sensitive:</strong> Check your inbox soon. The link expires quickly.
          </div>

          <div className="marketing-auth__callout">
            <strong>Can&apos;t find it?</strong> Check spam or junk, or request another link below.
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false)
              setEmail("")
              setMessage("")
            }}
            className="btn-server-pledge btn-server-pledge--secondary w-full"
          >
            Send another link
          </button>
        </div>

        <Link href="/login" className="marketing-auth__footer-link">
          Back to login
        </Link>
      </MarketingAuthLayout>
    )
  }

  return (
    <MarketingAuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      backHref="/login"
    >
      {error && <div className="marketing-auth__alert marketing-auth__alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="marketing-auth__form">
        <div className="marketing-auth__field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="marketing-auth__input"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-server-pledge btn-server-pledge--primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link href="/login" className="marketing-auth__footer-link">
        Back to login
      </Link>

      <div className="marketing-auth__callout mt-4">
        <strong>Security:</strong> Reset links expire in 5 minutes. If you don&apos;t receive an email, check your spam folder.
      </div>
    </MarketingAuthLayout>
  )
}
