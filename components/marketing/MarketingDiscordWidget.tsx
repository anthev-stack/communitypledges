"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { COMMUNITY_DISCORD_INVITE, type DiscordWidgetSummary } from "@/lib/discord-invite"

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function statusClass(status: string) {
  if (status === "online") return "marketing-discord-widget__status--online"
  if (status === "idle") return "marketing-discord-widget__status--idle"
  if (status === "dnd") return "marketing-discord-widget__status--dnd"
  return "marketing-discord-widget__status--offline"
}

export default function MarketingDiscordWidget() {
  const [data, setData] = useState<DiscordWidgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/public/discord-widget", { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || "Could not load Discord")
        }
        if (!cancelled) setData(json as DiscordWidgetSummary)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load Discord")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="marketing-discord-widget marketing-discord-widget--loading">
        <div className="marketing-discord-widget__spinner" />
        <p>Loading Discord...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="marketing-discord-widget marketing-discord-widget--fallback">
        <DiscordLogo className="w-10 h-10 text-[#5865f2] mb-3" />
        <p className="marketing-discord-widget__server-name">Community Pledges</p>
        <p className="marketing-discord-widget__meta">Join our Discord community</p>
        <Link
          href={COMMUNITY_DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="marketing-discord-widget__join"
        >
          <DiscordLogo className="w-4 h-4" />
          Join Discord
        </Link>
      </div>
    )
  }

  const displayMembers = data.members.slice(0, 6)

  return (
    <div className="marketing-discord-widget">
      <div className="marketing-discord-widget__header">
        <div className="marketing-discord-widget__guild">
          {data.iconUrl ? (
            <Image
              src={data.iconUrl}
              alt=""
              width={44}
              height={44}
              className="marketing-discord-widget__icon"
              unoptimized
            />
          ) : (
            <div className="marketing-discord-widget__icon marketing-discord-widget__icon--fallback">
              <DiscordLogo className="w-6 h-6" />
            </div>
          )}
          <div>
            <p className="marketing-discord-widget__server-name">{data.name}</p>
            <p className="marketing-discord-widget__meta">
              <span className="marketing-discord-widget__online-dot" aria-hidden />
              {data.onlineCount.toLocaleString()} online ·{" "}
              {data.memberCount.toLocaleString()} members
            </p>
          </div>
        </div>
      </div>

      {displayMembers.length > 0 ? (
        <div className="marketing-discord-widget__members">
          <p className="marketing-discord-widget__members-label">Online now</p>
          <ul className="marketing-discord-widget__member-list">
            {displayMembers.map((member) => (
              <li key={member.id} className="marketing-discord-widget__member">
                <div className="marketing-discord-widget__avatar-wrap">
                  {member.avatar ? (
                    <Image
                      src={`https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`}
                      alt=""
                      width={28}
                      height={28}
                      className="marketing-discord-widget__avatar"
                      unoptimized
                    />
                  ) : (
                    <span className="marketing-discord-widget__avatar-fallback">
                      {member.username[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <span
                    className={`marketing-discord-widget__status ${statusClass(member.status)}`}
                    aria-hidden
                  />
                </div>
                <span className="marketing-discord-widget__username">{member.username}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="marketing-discord-widget__members marketing-discord-widget__members--empty">
          <p className="marketing-discord-widget__members-label">Community</p>
          <p className="marketing-discord-widget__empty-hint">
            {data.memberCount.toLocaleString()} members · hop in and say hello
          </p>
        </div>
      )}

      <Link
        href={data.inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="marketing-discord-widget__join"
      >
        <DiscordLogo className="w-4 h-4" />
        Join Server
      </Link>
    </div>
  )
}
