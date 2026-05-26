"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Copy, Check, HeartHandshake, Edit3, X, Server as ServerIcon, Zap } from "lucide-react"
import PledgeModal from "@/components/PledgeModal"
import ServerStats from "@/components/ServerStats"
import { Price } from "@/components/Price"
import { useCurrency } from "@/components/CurrencyProvider"
import ServerDetailPageShell from "@/components/marketing/ServerDetailPageShell"
import PledgeProgressBar from "@/components/pledge/PledgeProgressBar"
import PledgeAmountBadge from "@/components/pledge/PledgeAmountBadge"
import { calculateOptimizedCosts } from "@/lib/optimization"
import ServerDetailScrollBack from "@/components/server/ServerDetailScrollBack"

export const dynamic = "force-dynamic"

interface Server {
  id: string
  name: string
  description: string
  gameType: string
  serverIp: string
  playerCount: number
  cost: number
  withdrawalDay: number
  imageUrl: string
  isRealm?: boolean
  owner: {
    id: string
    name: string
    image: string
    stripeAccountId: string
    stripeOnboardingComplete: boolean
  }
  community?: {
    id: string
    name: string
    imageUrl: string | null
  } | null
  pledges: Array<{
    id: string
    amount: number
    optimizedAmount: number | null
    createdAt: string
    updatedAt: string
    user: {
      id: string
      name: string
      image: string
    }
  }>
  totalPledged: number
  totalOptimized: number
  pledgerCount: number
}

export default function ServerPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const { formatPrice } = useCurrency()
  const [server, setServer] = useState<Server | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPledgeModal, setShowPledgeModal] = useState(false)
  const [serverId, setServerId] = useState("")
  const [userPledge, setUserPledge] = useState<{
    id: string
    amount: number
    optimizedAmount?: number | null
  } | null>(null)
  const [checkingPledge, setCheckingPledge] = useState(true)
  const [gameBannerUrl, setGameBannerUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    params.then((p) => setServerId(p.id))
  }, [params])

  const fetchGameBanner = useCallback(async () => {
    if (!server?.gameType) return

    try {
      const gameResponse = await fetch(
        `/api/admin/game-banners?type=game-banner&gameType=${encodeURIComponent(server.gameType)}`
      )
      if (gameResponse.ok) {
        const gameData = await gameResponse.json()
        setGameBannerUrl(gameData.dataUrl)
        return
      }

      const defaultResponse = await fetch("/api/admin/game-banners?type=default-banner")
      if (defaultResponse.ok) {
        const defaultData = await defaultResponse.json()
        setGameBannerUrl(defaultData.dataUrl)
      }
    } catch (err) {
      console.error("Failed to fetch game banner:", err)
    }
  }, [server?.gameType])

  const checkUserPledge = async () => {
    if (!serverId) return

    setCheckingPledge(true)
    try {
      const response = await fetch(`/api/servers/${serverId}/pledge?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setUserPledge(data.hasPledge ? data.userPledge : null)
      }
    } catch (err) {
      console.error("Error checking pledge:", err)
    } finally {
      setCheckingPledge(false)
    }
  }

  const fetchServer = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}?t=${Date.now()}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Server not found")
        return
      }

      setServer(data)
    } catch {
      setError("Failed to load server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (serverId) {
      fetchServer()
      checkUserPledge()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId])

  useEffect(() => {
    if (server?.gameType) {
      fetchGameBanner()
    }
  }, [server?.gameType, fetchGameBanner])

  useEffect(() => {
    if (searchParams.get("donation") === "success" && typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  const handlePledgeSuccess = () => {
    setShowPledgeModal(false)
    fetchServer()
    checkUserPledge()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const handleRemovePledge = async () => {
    if (!confirm("Are you sure you want to remove your pledge?")) return

    try {
      const response = await fetch(`/api/servers/${serverId}/pledge`, { method: "DELETE" })

      if (response.ok) {
        setUserPledge(null)
        fetchServer()
        checkUserPledge()
        alert("Pledge removed successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to remove pledge")
      }
    } catch (err) {
      console.error("Remove pledge error:", err)
      alert("Failed to remove pledge")
    }
  }

  if (loading) {
    return (
      <ServerDetailPageShell>
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="listing-loading text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4" />
            <p>Loading server...</p>
          </div>
        </div>
      </ServerDetailPageShell>
    )
  }

  if (error || !server) {
    return (
      <ServerDetailPageShell>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="listing-card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Server not found</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/servers" className="btn-primary px-6 py-2.5 text-sm inline-block">
              Browse servers
            </Link>
          </div>
        </div>
      </ServerDetailPageShell>
    )
  }

  const progressPercentage = Math.min((server.totalPledged / server.cost) * 100, 100)
  const maxPledgers = Math.floor(server.cost / 2)
  const pledgeAmounts = server.pledges.map((p) => p.amount)
  const { optimizedCosts } = calculateOptimizedCosts(pledgeAmounts, server.cost)

  const getEstimatedPayment = (index: number, pledgeAmount: number) => {
    const fromDb = server.pledges[index]?.optimizedAmount
    if (fromDb != null && fromDb > 0) return fromDb
    return optimizedCosts[index] ?? pledgeAmount
  }

  const bannerImageUrl = server.imageUrl || gameBannerUrl

  return (
    <ServerDetailPageShell>
      <ServerDetailScrollBack showAfter={160} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="listing-card listing-card--banner">
              <div
                className={`server-detail-banner ${!bannerImageUrl ? "server-detail-banner--fallback" : ""}`}
              >
                {bannerImageUrl && (
                  <Image
                    src={bannerImageUrl}
                    alt=""
                    fill
                    className="server-detail-banner__image"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}
                <div className="server-detail-banner__overlay" aria-hidden />
                <div className="server-detail-banner__content">
                  <span className="server-detail-game-tag">{server.gameType}</span>
                  <h1 className="server-detail-banner__title">{server.name}</h1>
                </div>
              </div>
            </div>

            <div className="listing-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-4">About this server</h2>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {server.description || "No description provided."}
              </p>

              {server.serverIp && (
                <div className="mt-6 rounded-lg border border-white/10 server-detail-inner-panel p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    Server IP
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-emerald-400 font-mono break-all">{server.serverIp}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(server.serverIp)}
                      className="shrink-0 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                      title="Copy IP address"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="listing-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-4">Active pledgers</h2>
              {server.pledges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pledges yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {server.pledges.map((pledge, index) => {
                    const estimatedPayment = getEstimatedPayment(index, pledge.amount)
                    const hasSavings = estimatedPayment < pledge.amount - 0.005

                    return (
                    <div key={pledge.id} className="server-detail-pledger-row">
                      {pledge.user.image ? (
                        <Image
                          src={pledge.user.image}
                          alt={pledge.user.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                          {pledge.user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-semibold text-white">
                            {pledge.user.name || "Anonymous"}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <PledgeAmountBadge size="lg">
                              <Price amountUSD={pledge.amount} showCode={false} />
                              /mo
                            </PledgeAmountBadge>
                            <span
                              className={`server-detail-est-pays ${hasSavings ? "server-detail-est-pays--savings" : ""}`}
                            >
                              Est. pays{" "}
                              <span className="server-detail-est-pays__amount">
                                <Price amountUSD={estimatedPayment} showCode={false} />
                                /mo
                              </span>
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pledged {new Date(pledge.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {server.isRealm ? (
              <div className="server-detail-notice server-detail-notice--amber">
                <div className="flex gap-3">
                  <Zap className="w-6 h-6 text-amber-400 shrink-0" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Minecraft realm</h3>
                    <p className="text-sm">
                      This is a private realm. Players join through realm invitations, not public IP
                      addresses. Live server stats are not available for realms.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              server.serverIp && <ServerStats serverId={server.id} gameType={server.gameType} />
            )}

            <div className="listing-card p-6 md:p-8 sticky top-6">
              <div className="flex items-center gap-2 mb-4 text-white">
                <ServerIcon className="w-5 h-5 text-[#949cf7]" aria-hidden />
                <span className="font-semibold">Funding progress</span>
              </div>

              <p className="pledge-funding-stat">
                <Price amountUSD={server.totalPledged} showCode={false} /> /{" "}
                <Price amountUSD={server.cost} showCode={false} /> goal · {server.pledgerCount}{" "}
                {server.pledgerCount === 1 ? "pledger" : "pledgers"}
              </p>

              <PledgeProgressBar percent={progressPercentage} size="lg" className="mb-4" />

              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>{progressPercentage.toFixed(0)}% funded</span>
                <span>
                  <Price amountUSD={server.cost} showCode={false} />/mo needed
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                {server.pledgerCount}/{maxPledgers} slots filled
              </p>

              {server.totalOptimized > 0 && server.totalOptimized < server.totalPledged && (
                <p className="text-sm text-emerald-400 font-medium mb-4">
                  Optimized to{" "}
                  <Price amountUSD={server.totalOptimized} showCode={false} />
                  /mo
                </p>
              )}

              <div className="server-detail-notice mb-6 text-sm">
                <h3 className="text-sm font-semibold text-white mb-2">Payment schedule</h3>
                <div className="space-y-1 text-gray-400">
                  <p>
                    <strong className="text-gray-300">Charge date:</strong> Day{" "}
                    {server.withdrawalDay - 2} of each month
                  </p>
                  <p>
                    <strong className="text-gray-300">Payment due:</strong> Day {server.withdrawalDay}{" "}
                    of each month
                  </p>
                  <p className="text-xs mt-2 text-gray-500">
                    Pledgers are charged 2 days before the server payment is due.
                  </p>
                </div>
              </div>

              {server.owner.stripeOnboardingComplete ? (
                checkingPledge ? (
                  <div className="w-full rounded-lg border border-white/10 server-detail-inner-panel text-gray-400 px-6 py-3 text-center text-sm">
                    Checking pledge status...
                  </div>
                ) : userPledge ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-white/10 server-detail-inner-panel p-4">
                      <p className="text-sm font-medium text-gray-400 mb-2">Your pledge</p>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <PledgeAmountBadge size="lg">
                          {formatPrice(userPledge.amount)}/month
                        </PledgeAmountBadge>
                      </div>
                      {(() => {
                        const userIdx = server.pledges.findIndex((p) => p.id === userPledge.id)
                        const est =
                          userPledge.optimizedAmount ??
                          (userIdx >= 0 ? optimizedCosts[userIdx] : undefined) ??
                          userPledge.amount
                        const saves = est < userPledge.amount - 0.005
                        return (
                          <p
                            className={`server-detail-est-pays ${saves ? "server-detail-est-pays--savings" : ""}`}
                          >
                            Est. pays{" "}
                            <span className="server-detail-est-pays__amount">{formatPrice(est)}/month</span>
                          </p>
                        )
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPledgeModal(true)}
                      className="btn-primary w-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" />
                      Change pledge amount
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePledge}
                      className="w-full py-3 text-sm font-semibold rounded-lg bg-red-600/90 hover:bg-red-600 text-white inline-flex items-center justify-center gap-2 transition"
                    >
                      <X className="w-5 h-5" />
                      Remove pledge
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPledgeModal(true)}
                    className="btn-primary w-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <HeartHandshake className="w-5 h-5" />
                    Make a pledge
                  </button>
                )
              ) : (
                <div className="server-detail-notice text-center text-sm text-gray-400">
                  Server owner hasn&apos;t set up payouts yet
                </div>
              )}
            </div>

            {server.community && (
              <div className="listing-card p-6 md:p-8">
                <h2 className="text-lg font-bold text-white mb-4">Part of community</h2>
                <Link
                  href={`/communities/${server.community.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-white/10 server-detail-inner-panel hover:border-[#5865f2]/50 transition"
                >
                  {server.community.imageUrl ? (
                    <Image
                      src={server.community.imageUrl}
                      alt={server.community.name}
                      width={56}
                      height={56}
                      className="rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-lg text-white font-bold">
                        {server.community.name[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{server.community.name}</h3>
                    <p className="text-sm text-[#949cf7]">View community profile →</p>
                  </div>
                </Link>
              </div>
            )}

            <div className="listing-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Server owner</h3>
              <div className="flex items-center gap-3">
                {server.owner.image ? (
                  <Image
                    src={server.owner.image}
                    alt={server.owner.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#5865f2] rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {server.owner.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{server.owner.name || "Anonymous"}</p>
                  <Link href={`/users/${server.owner.id}`} className="text-sm text-[#949cf7] hover:text-[#c9cdfb]">
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PledgeModal
        server={server}
        isOpen={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        onSuccess={handlePledgeSuccess}
      />
    </ServerDetailPageShell>
  )
}
