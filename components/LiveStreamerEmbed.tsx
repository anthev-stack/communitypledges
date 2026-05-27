"use client"

import { useState, useEffect } from "react"
import { Eye, ExternalLink, Play } from "lucide-react"
import Image from "next/image"

interface StreamData {
  isLive: boolean
  streamer?: {
    id: string
    username: string
    displayName: string
    priority: number
    isActive: boolean
  }
  stream?: {
    id: string
    title: string
    gameName: string
    viewerCount: number
    startedAt: string
    thumbnailUrl: string
    language: string
  }
  user?: {
    id: string
    login: string
    displayName: string
    profileImageUrl: string
  }
  message?: string
}

function buildTwitchPlayerSrc(channel: string) {
  const parents = new Set<string>()
  if (typeof window !== "undefined") {
    parents.add(window.location.hostname)
  }
  parents.add("localhost")
  parents.add("communitypledges.com")
  parents.add("www.communitypledges.com")

  const extra = process.env.NEXT_PUBLIC_TWITCH_EMBED_PARENTS
  if (extra) {
    extra.split(",").forEach((h) => {
      const t = h.trim()
      if (t) parents.add(t)
    })
  }

  const parentQuery = Array.from(parents)
    .map((p) => `parent=${encodeURIComponent(p)}`)
    .join("&")

  return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&${parentQuery}&autoplay=true&muted=true`
}

type Props = {
  /** Homepage layout: full-width glass shell above marketing sections */
  variant?: "home" | "inline"
}

export default function LiveStreamerEmbed({ variant = "inline" }: Props) {
  const [liveData, setLiveData] = useState<StreamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerSrc, setPlayerSrc] = useState<string | null>(null)

  const checkLiveStreamer = async () => {
    try {
      const response = await fetch("/api/twitch/live-streamer", { cache: "no-store" })
      const data = await response.json()
      if (response.ok) {
        setLiveData(data)
      }
    } catch (err) {
      console.error("Live streamer check error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkLiveStreamer()
    const interval = setInterval(checkLiveStreamer, 120_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (liveData?.isLive && liveData.user?.login) {
      setPlayerSrc(buildTwitchPlayerSrc(liveData.user.login))
    }
  }, [liveData])

  const isHome = variant === "home"

  if (loading) {
    if (!isHome) {
      return (
        <div className="animate-pulse h-32 bg-slate-800/50 rounded-xl border border-slate-700/50" />
      )
    }
    return (
      <section className="marketing-home-live" aria-hidden>
        <div className="marketing-home-live__shell">
          <div className="marketing-home-live__skeleton" />
        </div>
      </section>
    )
  }

  if (!liveData?.isLive || !liveData.stream || !liveData.user) {
    return null
  }

  const { stream, user } = liveData

  const getStreamDuration = () => {
    const start = new Date(stream.startedAt)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const card = (
    <div className={`partner-stream-card ${isHome ? "partner-stream-card--home" : ""}`}>
      <div className="partner-stream-card__badge">
        <Play className="w-3 h-3" aria-hidden />
        <span>Partner live</span>
      </div>

      <div className="partner-stream-card__header">
        <div className="partner-stream-card__identity">
          <div className="relative shrink-0">
            <Image
              src={user.profileImageUrl}
              alt={user.displayName}
              width={48}
              height={48}
              className="partner-stream-card__avatar"
              unoptimized
            />
            <span className="partner-stream-card__live-dot" aria-hidden />
          </div>
          <div className="partner-stream-card__who">
            <h3 className="partner-stream-card__name">{user.displayName}</h3>
            <p className="partner-stream-card__meta">
              <span className="partner-stream-card__live-label">LIVE</span>
              <span aria-hidden>·</span>
              <span>{getStreamDuration()}</span>
            </p>
          </div>
        </div>

        <div className="partner-stream-card__stream-info">
          <h4 className="partner-stream-card__title">{stream.title}</h4>
          <span className="partner-stream-card__game">{stream.gameName}</span>
        </div>

        <div className="partner-stream-card__viewers">
          <Eye className="w-4 h-4" aria-hidden />
          <span>
            {stream.viewerCount >= 1000
              ? `${(stream.viewerCount / 1000).toFixed(1)}K`
              : stream.viewerCount}
          </span>
        </div>
      </div>

      {playerSrc && (
        <div className="partner-stream-card__player">
          <iframe
            src={playerSrc}
            title={`${user.displayName} on Twitch`}
            height="100%"
            width="100%"
            allowFullScreen
            allow="autoplay; fullscreen"
            className="w-full h-full"
          />
        </div>
      )}

      <div className="partner-stream-card__footer">
        <a
          href={`https://www.twitch.tv/${user.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="partner-stream-card__watch"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          Watch on Twitch
        </a>
        <span className="partner-stream-card__refresh">Updates every 2 min</span>
      </div>
    </div>
  )

  if (isHome) {
    return (
      <section className="marketing-home-live" aria-label="Partner live stream">
        <div className="marketing-home-live__shell">{card}</div>
      </section>
    )
  }

  return card
}
