"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { MIN_PLEDGE, MAX_PLEDGE } from "@/lib/constants"
import { useCurrency } from "./CurrencyProvider"
import {
  Lightbulb,
  DollarSign,
  CreditCard,
  TrendingDown,
  Users,
  X,
  Sparkles,
  HeartHandshake,
} from "lucide-react"
import PledgeModalBackdrop from "@/components/pledge/PledgeModalBackdrop"
import PledgeModalFireworks from "@/components/pledge/PledgeModalFireworks"

interface PledgeModalProps {
  server: {
    id: string
    name: string
    cost: number
    owner: {
      name: string
    }
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PledgeModal({ server, isOpen, onClose, onSuccess }: PledgeModalProps) {
  const { data: session } = useSession()
  const { currency, symbol, convertFromUSD, convertToUSD, formatPrice } = useCurrency()
  const [amount, setAmount] = useState("10")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [pledgeStatus, setPledgeStatus] = useState<{
    hasPledge?: boolean
    canPledge?: boolean
    maxPledges?: number
    currentPledges?: number
    userPledge?: {
      amount: number
      optimizedAmount?: number | null
    }
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      fetchPledgeStatus()
    } else {
      document.body.style.overflow = ""
      setError("")
      setMessage("")
    }
    return () => {
      document.body.style.overflow = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const fetchPledgeStatus = async () => {
    setLoadingStatus(true)
    try {
      const response = await fetch(`/api/servers/${server.id}/pledge`)
      const data = await response.json()
      setPledgeStatus(data)

      if (data.hasPledge && data.userPledge) {
        const convertedAmount = convertFromUSD(data.userPledge.amount)
        setAmount(convertedAmount.toFixed(2))
      } else {
        const defaultConverted = convertFromUSD(10)
        setAmount(defaultConverted.toFixed(2))
      }
    } catch (error) {
      console.error("Error fetching pledge status:", error)
      setAmount("10")
    } finally {
      setLoadingStatus(false)
    }
  }

  const handlePledge = async () => {
    const pledgeAmountInUserCurrency = parseFloat(amount)

    if (isNaN(pledgeAmountInUserCurrency)) {
      setError(`Please enter a valid amount`)
      return
    }

    const pledgeAmountUSD = convertToUSD(pledgeAmountInUserCurrency)

    if (pledgeAmountUSD < MIN_PLEDGE || pledgeAmountUSD > MAX_PLEDGE) {
      const minConverted = convertFromUSD(MIN_PLEDGE)
      const maxConverted = convertFromUSD(MAX_PLEDGE)
      setError(
        `Pledge must be between ${symbol}${minConverted.toFixed(2)} and ${symbol}${maxConverted.toFixed(2)}`
      )
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/servers/${server.id}/pledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: pledgeAmountUSD }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create pledge")
        return
      }

      setMessage(data.message)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleUnpledge = async () => {
    if (!confirm("Are you sure you want to cancel your pledge?")) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/servers/${server.id}/pledge`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to cancel pledge")
        return
      }

      setMessage("Pledge cancelled successfully!")
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isCelebrating = Boolean(message && !error)

  return (
    <div
      className="pledge-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pledge-modal-title"
    >
      <PledgeModalBackdrop />
      <PledgeModalFireworks boost={loading} celebrate={isCelebrating} />

      <button
        type="button"
        className="pledge-modal-overlay-dismiss"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="pledge-modal-panel">
        <div className="pledge-modal-panel__header">
          <div className="pledge-modal-panel__title-wrap">
            <Sparkles className="w-5 h-5 text-amber-300/90 shrink-0" aria-hidden />
            <h2 id="pledge-modal-title" className="pledge-modal-panel__title">
              {pledgeStatus?.hasPledge ? "Manage pledge" : "Make a pledge"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pledge-modal-panel__close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="pledge-modal-panel__body">
          {loadingStatus ? (
            <div className="pledge-modal-loading">
              <div className="pledge-modal-loading__spinner" />
              <p>Loading...</p>
            </div>
          ) : pledgeStatus?.hasPledge ? (
            <div className="pledge-modal-stack">
              <div className="pledge-modal-notice pledge-modal-notice--success">
                <h3 className="pledge-modal-notice__title">
                  <DollarSign className="w-5 h-5" aria-hidden />
                  Your current pledge
                </h3>
                <div className="pledge-modal-notice__body">
                  <p>
                    <strong>Pledged:</strong> {formatPrice(pledgeStatus.userPledge!.amount)}/month
                  </p>
                  <p>
                    <strong>Estimated payment:</strong>{" "}
                    {formatPrice(
                      pledgeStatus.userPledge!.optimizedAmount || pledgeStatus.userPledge!.amount
                    )}
                    /month
                  </p>
                  {pledgeStatus.userPledge!.optimizedAmount != null &&
                    pledgeStatus.userPledge!.optimizedAmount! < pledgeStatus.userPledge!.amount && (
                      <p className="pledge-modal-notice__highlight">
                        <TrendingDown className="w-4 h-4" aria-hidden />
                        You&apos;re saving{" "}
                        {formatPrice(
                          pledgeStatus.userPledge!.amount - pledgeStatus.userPledge!.optimizedAmount!
                        )}
                        /month thanks to optimization!
                      </p>
                    )}
                </div>
              </div>

              {error && <div className="pledge-modal-alert pledge-modal-alert--error">{error}</div>}
              {message && (
                <div className="pledge-modal-alert pledge-modal-alert--success">{message}</div>
              )}

              <button
                type="button"
                onClick={handleUnpledge}
                disabled={loading}
                className="btn-server-pledge btn-server-pledge--danger"
              >
                {loading ? "Cancelling..." : "Cancel pledge"}
              </button>
            </div>
          ) : !session ? (
            <div className="pledge-modal-stack">
              <div className="pledge-modal-notice pledge-modal-notice--warn">
                <h3 className="pledge-modal-notice__title">Sign in required</h3>
                <p className="pledge-modal-notice__text">
                  You need to be logged in to pledge to a server.
                </p>
                <Link href="/login" onClick={onClose} className="btn-server-pledge btn-server-pledge--primary">
                  Sign in
                </Link>
              </div>
            </div>
          ) : !pledgeStatus?.canPledge ? (
            <div className="pledge-modal-stack">
              <div className="pledge-modal-notice pledge-modal-notice--error">
                <h3 className="pledge-modal-notice__title">
                  <Users className="w-5 h-5" aria-hidden />
                  Server at capacity
                </h3>
                <p className="pledge-modal-notice__text">
                  This server has reached maximum pledgers ({pledgeStatus?.maxPledges} people).
                </p>
              </div>
            </div>
          ) : (
            <div className="pledge-modal-stack">
              <div className="pledge-modal-server-card">
                <p className="pledge-modal-server-card__name">{server.name}</p>
                <p className="pledge-modal-server-card__meta">
                  <DollarSign className="w-3.5 h-3.5" aria-hidden />
                  Monthly cost: {formatPrice(server.cost)} · {pledgeStatus?.currentPledges}/
                  {pledgeStatus?.maxPledges} pledgers
                </p>
              </div>

              {error && <div className="pledge-modal-alert pledge-modal-alert--error">{error}</div>}
              {message && (
                <div className="pledge-modal-alert pledge-modal-alert--success pledge-modal-alert--celebrate">
                  <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="pledge-amount" className="pledge-modal-label">
                  Your monthly pledge ({symbol}
                  {convertFromUSD(MIN_PLEDGE).toFixed(2)}–{symbol}
                  {convertFromUSD(MAX_PLEDGE).toFixed(2)})
                </label>
                <div className="pledge-modal-input-wrap">
                  <span className="pledge-modal-input-prefix">{symbol}</span>
                  <input
                    id="pledge-amount"
                    type="number"
                    min={convertFromUSD(MIN_PLEDGE)}
                    max={convertFromUSD(MAX_PLEDGE)}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pledge-modal-input"
                    disabled={loading}
                  />
                </div>
                {currency !== "USD" && (
                  <p className="pledge-modal-hint">
                    Amounts are shown in {currency} but stored in USD
                  </p>
                )}
              </div>

              <div className="pledge-modal-presets">
                {[2, 5, 10, 15, 20].map((presetUSD) => {
                  const convertedPreset = convertFromUSD(presetUSD)
                  const roundedPreset = Math.round(convertedPreset)
                  return (
                    <button
                      key={presetUSD}
                      type="button"
                      onClick={() => setAmount(roundedPreset.toFixed(2))}
                      disabled={loading}
                      className="pledge-modal-preset"
                    >
                      {symbol}
                      {roundedPreset}
                    </button>
                  )
                })}
              </div>

              {parseFloat(amount) >= convertFromUSD(MIN_PLEDGE) &&
                parseFloat(amount) <= convertFromUSD(MAX_PLEDGE) && (
                  <div className="pledge-modal-optimization">
                    <p className="pledge-modal-optimization__title">
                      <Lightbulb className="w-5 h-5" aria-hidden />
                      Smart optimization
                    </p>
                    <div className="pledge-modal-optimization__body">
                      <p>
                        <DollarSign className="w-4 h-4" aria-hidden />
                        You pledge:{" "}
                        <strong>
                          {symbol}
                          {parseFloat(amount).toFixed(2)}/month
                        </strong>
                      </p>
                      <p className="pledge-modal-optimization__savings">
                        <TrendingDown className="w-4 h-4" aria-hidden />
                        Est. payment:{" "}
                        <strong>
                          {symbol}
                          {Math.min(
                            parseFloat(amount),
                            convertFromUSD(
                              server.cost / ((pledgeStatus?.currentPledges ?? 0) + 1)
                            )
                          ).toFixed(2)}
                          /month
                        </strong>
                      </p>
                      <p className="pledge-modal-optimization__hint">
                        <Users className="w-4 h-4" aria-hidden />
                        When more people join, your cost goes down — the more pledgers, the less
                        everyone pays.
                      </p>
                    </div>
                  </div>
                )}

              <button
                type="button"
                onClick={handlePledge}
                disabled={loading}
                className="btn-server-pledge btn-server-pledge--primary"
              >
                <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden />
                {loading ? "Processing..." : `Pledge ${symbol}${amount}/month`}
              </button>

              <p className="pledge-modal-footer-note">
                <CreditCard className="w-4 h-4" aria-hidden />
                Your saved payment method will be charged automatically each month
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
