"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Eye, Edit3, Zap, Trash2, Copy, Check } from "lucide-react"
import { Price } from "@/components/Price"
import { useCurrency } from "@/components/CurrencyProvider"
import MarketingDashboardLayout from "@/components/marketing/MarketingDashboardLayout"

interface Server {
  id: string
  name: string
  gameType: string
  cost: number
  withdrawalDay: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  isBoosted: boolean
  boostExpiresAt: string | null
  isPrivate: boolean
  _count: {
    pledges: number
    favorites: number
  }
}

interface Community {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  gameTypes: string[]
  memberCount: number
  createdAt: string
  _count: {
    servers: number
  }
}

interface UserStats {
  totalPledged: number
  activePledges: number
  serversCreated: number
}

interface Activity {
  id: string
  action: string
  metadata: any
  createdAt: string
  user?: {
    id: string
    name: string
    image: string
  } | null
  server?: {
    id: string
    name: string
  } | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const [servers, setServers] = useState<Server[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activityTab, setActivityTab] = useState<"user" | "server">("user")
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [boostingServer, setBoostingServer] = useState<string | null>(null)
  const [copiedServerId, setCopiedServerId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchServers()
      fetchCommunities()
      fetchStats()
      fetchActivity("user")
    }
  }, [session])

  useEffect(() => {
    if (session?.user?.id) {
      fetchActivity(activityTab)
    }
  }, [activityTab, session])

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/user/servers")
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/user/communities")
      if (response.ok) {
        const data = await response.json()
        setCommunities(data)
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchActivity = async (type: "user" | "server") => {
    setLoadingActivity(true)
    try {
      const response = await fetch(`/api/user/activity?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        const error = await response.json()
        console.error("Failed to fetch activity:", error)
        setActivities([])
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error)
      setActivities([])
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleDelete = async (serverId: string, serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"? This action cannot be undone and will cancel all pledges.`)) {
      return
    }

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setServers(servers.filter(s => s.id !== serverId))
        alert("Server deleted successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete server")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete server")
    }
  }

  const handleBoostServer = async (serverId: string, serverName: string) => {
    const boostCost = formatPrice(3) // $3 USD boost cost
    if (!confirm(`Boost "${serverName}" for ${boostCost}? This will put your server at the top of the list for 24 hours.`)) {
      return
    }

    setBoostingServer(serverId)
    try {
      const response = await fetch(`/api/servers/${serverId}/boost`, {
        method: "POST",
      })

      if (response.ok) {
        alert("Server boosted successfully!")
        // Refresh servers to get updated boost status
        fetchServers()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to boost server")
      }
    } catch (error) {
      console.error("Boost error:", error)
      alert("Failed to boost server")
    } finally {
      setBoostingServer(null)
    }
  }

  const copyServerLink = async (serverId: string) => {
    if (typeof window === 'undefined') return
    
    const serverUrl = `${window.location.origin}/servers/${serverId}`
    try {
      await navigator.clipboard.writeText(serverUrl)
      setCopiedServerId(serverId)
      setTimeout(() => setCopiedServerId(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      alert('Failed to copy link')
    }
  }

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  if (status === "loading") {
    return (
      <MarketingDashboardLayout>
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingDashboardLayout>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "server_created":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case "server_deleted":
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      case "pledge_created":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case "pledge_cancelled":
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case "pledge_updated":
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case "user_suspended":
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case "user_banned":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )
      case "user_promoted":
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case "server_boosted":
        return (
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )
      case "server_favorited":
        return (
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case "server_unfavorited":
        return (
          <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatActivityMessage = (activity: Activity) => {
    const amount = activity.metadata?.amount
    const serverDeleted = !activity.server
    const serverName = activity.server?.name || "a server"

    // Special message for deleted servers
    if (serverDeleted && activity.action !== "server_created") {
      return "Server you pledged towards has been deleted. You have been removed from pledging."
    }

    switch (activity.action) {
      case "server_created":
        return serverDeleted 
          ? "You created a server (now deleted)"
          : `You created server "${serverName}"`
      case "server_deleted":
        return `You deleted server "${activity.metadata?.serverName || serverName}"`
      case "pledge_created":
        return `You pledged ${formatPrice(amount)}/month towards "${serverName}"`
      case "pledge_updated":
        return `You updated your pledge to "${serverName}" (${formatPrice(amount)}/month)`
      case "pledge_cancelled":
        return `You removed your pledge from "${serverName}"`
      case "user_suspended":
        return "Your account was suspended due to payment failures"
      case "user_banned":
        return "Your account was banned by staff"
      case "user_promoted":
        return `You were promoted to ${activity.metadata?.role || "moderator"}`
      case "server_boosted":
        return serverDeleted
          ? "You boosted a server (now deleted)"
          : `You've boosted server "${serverName}" for 24 hours!`
      case "server_favorited":
        return serverDeleted
          ? "You favorited a server (now deleted)"
          : `You favorited server "${serverName}"`
      case "server_unfavorited":
        return serverDeleted
          ? "You unfavorited a server (now deleted)"
          : `You unfavorited server "${serverName}"`
      default:
        return activity.action
    }
  }

  const formatServerActivityMessage = (activity: Activity) => {
    const amount = activity.metadata?.amount
    const userName = activity.user?.name || "Someone"
    const serverDeleted = !activity.server
    const serverName = activity.server?.name || "your server"

    // Special message for deleted servers
    if (serverDeleted) {
      return `${userName} had activity on a deleted server`
    }

    switch (activity.action) {
      case "pledge_created":
        return `${userName} pledged ${formatPrice(amount)}/month towards "${serverName}"`
      case "pledge_updated":
        return `${userName} updated their pledge to "${serverName}" (${formatPrice(amount)}/month)`
      case "pledge_cancelled":
        return `${userName} removed their pledge from "${serverName}"`
      case "server_created":
        return `Someone created a server (this shouldn't appear here)`
      case "server_deleted":
        return `Someone deleted a server (this shouldn't appear here)`
      case "server_boosted":
        return `You've boosted server "${serverName}" for 24 hours!`
      case "server_favorited":
        return `${userName} favorited "${serverName}"`
      case "server_unfavorited":
        return `${userName} unfavorited "${serverName}"`
      default:
        return activity.action
    }
  }

  return (
    <MarketingDashboardLayout>
        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="listing-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pledged</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalPledged ? <Price amountUSD={stats.totalPledged} showCode={true} /> : "$0.00"}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="listing-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Pledges</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.activePledges || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="listing-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Servers Created</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.serversCreated || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Create Server Card */}
          <Link href="/dashboard/server/create">
            <div className="listing-card p-6 transition cursor-pointer h-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Server</h2>
              <p className="text-gray-600">Set up a new game server and start receiving pledges</p>
            </div>
          </Link>

          {/* Create Community Card */}
          <Link href="/dashboard/community/create">
            <div className="listing-card p-6 transition cursor-pointer h-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Community</h2>
              <p className="text-gray-600">Share your community to attract new members</p>
            </div>
          </Link>

          {/* Settings Card */}
          <Link href="/settings">
            <div className="listing-card p-6 transition cursor-pointer h-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Manage your profile and payment settings</p>
            </div>
          </Link>
        </div>

        {/* My Servers Section - Only show if user has servers */}
        {!loading && servers.length > 0 && (
          <div className="mb-12">
            <h2 className="dashboard-section-title">My Servers</h2>
          
          <div className="space-y-4">
              {servers.map((server) => (
                <div key={server.id} className="listing-card p-6 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {server.imageUrl ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={server.imageUrl}
                            alt={server.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-white font-bold">
                            {server.name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{server.name}</h3>
                          {server.isPrivate && (
                            <>
                              <span className="px-2 py-1 text-xs bg-slate-700/70 text-gray-300 rounded-full">
                                Private
                              </span>
                              <button
                                onClick={() => copyServerLink(server.id)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors"
                                title="Copy private server link"
                              >
                                <span className="text-xs">Private server link</span>
                                {copiedServerId === server.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </>
                          )}
                          {!server.isActive && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{server.gameType}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <Price amountUSD={server.cost} showCode={false} />/month
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {server._count.pledges} pledgers
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Day {server.withdrawalDay}
                          </span>
                          {server.isBoosted && server.boostExpiresAt && (
                            <span className="flex items-center text-yellow-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Boost: {formatTimeLeft(server.boostExpiresAt)}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {server._count.favorites} favorites
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-server-actions">
                      <Link href={`/servers/${server.id}`}>
                        <button
                          type="button"
                          className="dashboard-action-btn dashboard-action-btn--view"
                          title="View server"
                        >
                          <Eye className="w-4 h-4" aria-hidden />
                          <span className="sr-only">View</span>
                        </button>
                      </Link>
                      <Link href={`/dashboard/server/${server.id}/edit`}>
                        <button
                          type="button"
                          className="dashboard-action-btn dashboard-action-btn--edit"
                          title="Edit server"
                        >
                          <Edit3 className="w-4 h-4" aria-hidden />
                          <span className="sr-only">Edit</span>
                        </button>
                      </Link>
                      {!server.isPrivate && (
                        <button
                          type="button"
                          onClick={() => handleBoostServer(server.id, server.name)}
                          disabled={boostingServer === server.id || server.isBoosted}
                          title={
                            server.isBoosted
                              ? "Server is boosted"
                              : boostingServer === server.id
                                ? "Boosting..."
                                : "Boost server listing"
                          }
                          className={`dashboard-boost-btn ${
                            server.isBoosted ? "dashboard-boost-btn--active" : ""
                          }`}
                        >
                          <Zap className="w-4 h-4 shrink-0" aria-hidden />
                          <span>
                            {boostingServer === server.id
                              ? "Boosting..."
                              : server.isBoosted
                                ? "Boosted"
                                : "Boost ($3)"}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(server.id, server.name)}
                        className="dashboard-action-btn dashboard-action-btn--delete"
                        title="Delete server"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        )}

        {/* My Communities Section - Only show if user has communities */}
        {!loading && communities.length > 0 && (
          <div className="mb-12">
            <h2 className="dashboard-section-title">My Communities</h2>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communities.map((community) => (
                <div key={community.id} className="listing-card overflow-hidden transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        {community.imageUrl ? (
                          <Image
                            src={community.imageUrl}
                            alt={community.name}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl text-white font-bold">
                              {community.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{community.name}</h3>
                          {community.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{community.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Game Types */}
                    {community.gameTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {community.gameTypes.slice(0, 3).map((gameType) => (
                          <span
                            key={gameType}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded"
                          >
                            {gameType}
                          </span>
                        ))}
                        {community.gameTypes.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700/50 text-gray-300 text-xs font-medium rounded">
                            +{community.gameTypes.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                        {community._count.servers} {community._count.servers === 1 ? 'server' : 'servers'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link href={`/communities/${community.id}`} className="flex-1">
                        <button className="w-full px-4 py-2 text-sm bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </Link>
                      <Link href={`/dashboard/community/${community.id}/edit`} className="flex-1">
                        <button className="w-full px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Section */}
        <div>
          <h2 className="dashboard-section-title">Activity</h2>
          
          <div className="listing-card overflow-hidden">
            {/* Tabs */}
            <div className="border-b dashboard-tabs">
              <div className="flex">
                <button
                  onClick={() => setActivityTab("user")}
                  className={`dashboard-tab flex-1 px-6 py-4 text-sm font-medium transition border-b-2 border-transparent ${
                    activityTab === "user" ? "dashboard-tab--active" : ""
                  }`}
                >
                  Your Activity
                </button>
                <button
                  onClick={() => setActivityTab("server")}
                  className={`dashboard-tab flex-1 px-6 py-4 text-sm font-medium transition border-b-2 border-transparent ${
                    activityTab === "server" ? "dashboard-tab--active" : ""
                  }`}
                >
                  Server Activity
                </button>
              </div>
            </div>

            {/* Activity List */}
            <div className="p-6 dashboard-tab-panel">
              {loadingActivity ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600">
                    {activityTab === "user"
                      ? "No activity yet. Start by creating a server or making a pledge!"
                      : "No activity on your servers yet. Share your servers to get pledges!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const serverDeleted = !activity.server
                    return (
                      <div 
                        key={activity.id} 
                        className={`flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-0 ${
                          serverDeleted ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${serverDeleted ? 'text-gray-600 italic' : 'text-gray-900'}`}>
                            {activityTab === "user"
                              ? formatActivityMessage(activity)
                              : formatServerActivityMessage(activity)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {activity.server?.id && (
                          <Link
                            href={`/servers/${activity.server.id}`}
                            className="flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
    </MarketingDashboardLayout>
  )
}
