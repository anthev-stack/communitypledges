"use client"

import { useState } from "react"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"
import { useCurrency } from "@/components/CurrencyProvider"

type CountrySetupFormProps = {
  onSuccess: () => void
  submitLabel?: string
}

export default function CountrySetupForm({
  onSuccess,
  submitLabel = "Continue",
}: CountrySetupFormProps) {
  const { refreshCurrency } = useCurrency()
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!country) {
      setError("Please select your country")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/user/country", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save country")
        return
      }

      await refreshCurrency()
      onSuccess()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="marketing-auth__form">
      {error && (
        <div className="marketing-auth__alert marketing-auth__alert--error">{error}</div>
      )}

      <div className="marketing-auth__callout marketing-auth__callout--warn">
        <strong>Why we ask</strong>
        <p className="marketing-auth__hint mt-1 mb-0">
          Your country sets the currency for pledge amounts and payment display (e.g. AUD in
          Australia). Without it, amounts default to USD and can look wrong for everyone.
        </p>
      </div>

      <div className="marketing-auth__field">
        <label htmlFor="country-setup">Country</label>
        <select
          id="country-setup"
          name="country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="marketing-auth__input"
        >
          <option value="">Select your country</option>
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <p className="marketing-auth__hint">
          Used for pledge amounts and payouts in your local currency.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !country}
        className="btn-server-pledge btn-server-pledge--primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  )
}
