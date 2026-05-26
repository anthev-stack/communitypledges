"use client"

import { useState, useEffect } from "react"

interface ServerStatsProps {
  serverId: string
  gameType: string
}

interface ServerState {
  online: boolean
  players?: {
    online: number
    max: number
  }
  version?: string
  motd?: string
  map?: string
  gamemode?: string
  serverType?: string
  error?: string
}

export default function ServerStats({ serverId, gameType }: ServerStatsProps) {
  const [stats, setStats] = useState<ServerState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/stats`)
      const data = await response.json()
      
      if (response.ok && data.stats) {
        setStats(data.stats)
      } else {
        setStats({ online: false, error: data.error || "Failed to fetch stats" })
      }
    } catch (error) {
      console.error("Failed to fetch server stats:", error)
      setStats({ online: false, error: "Failed to fetch stats" })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="listing-card p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="listing-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Live Server Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${stats.online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className={`text-xs font-medium ${stats.online ? 'text-green-400' : 'text-red-400'}`}>
            {stats.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {stats.online && (
        <div className="space-y-2 text-sm">
          {/* Players */}
          {stats.players && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Players Online:
              </span>
              <span className="font-semibold text-white">
                {stats.players.online} / {stats.players.max}
              </span>
            </div>
          )}

          {/* Version (for Minecraft) */}
          {stats.version && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Version:
              </span>
              <span className="font-semibold text-white">{stats.version}</span>
            </div>
          )}

          {/* Map (for CS, etc) */}
          {stats.map && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map:
              </span>
              <span className="font-semibold text-white">{stats.map}</span>
            </div>
          )}

          {/* Gamemode */}
          {stats.gamemode && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="font-semibold text-white">{stats.gamemode}</span>
            </div>
          )}
        </div>
      )}

      {!stats.online && stats.error && (
        <p className="text-sm text-red-400">{stats.error}</p>
      )}

      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-gray-500">Updates every 30 seconds</span>
        <button
          type="button"
          onClick={fetchStats}
          className="text-xs text-[#949cf7] hover:text-[#c9cdfb] font-medium"
        >
          Refresh Now
        </button>
      </div>
    </div>
  )
}
