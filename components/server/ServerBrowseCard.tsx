"use client"

import Image from "next/image"
import Link from "next/link"
import { Price } from "@/components/Price"
import ServerLiveStats from "@/components/ServerLiveStats"
import ServerMinecraftMeta from "@/components/server/ServerMinecraftMeta"

export type ServerBrowseItem = {
  id: string
  name: string
  description: string
  gameType: string
  serverIp: string | null
  cost: number
  imageUrl: string
  region: string | null
  tags: string[]
  isBoosted: boolean
  minecraftVersion?: string | null
  minecraftEditionType?: string | null
  minecraftModLoader?: string | null
  owner: {
    name: string
    image: string | null
  }
  totalPledged: number
  totalOptimized: number
  pledgerCount: number
  _count?: {
    favorites: number
  }
}

type Props = {
  server: ServerBrowseItem
  variant: "grid" | "list"
  isFavorited: boolean
  onToggleFavorite: (serverId: string) => void
}

function BoostBadge() {
  return (
    <span className="server-browse-card__boost">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      BOOSTED
    </span>
  )
}

function FavoriteButton({
  serverId,
  count,
  isFavorited,
  onToggleFavorite,
}: {
  serverId: string
  count: number
  isFavorited: boolean
  onToggleFavorite: (serverId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggleFavorite(serverId)
      }}
      className="server-browse-card__favorite"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`w-5 h-5 ${isFavorited ? "text-red-500 fill-current" : "text-gray-400"}`}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="text-white text-sm font-medium">{count}</span>
    </button>
  )
}

function ServerTags({
  tags,
  max = 3,
  className = "",
}: {
  tags: string[]
  max?: number
  className?: string
}) {
  if (tags.length === 0) return null
  return (
    <div className={`server-browse-card__tags ${className}`.trim()}>
      {tags.slice(0, max).map((tag) => (
        <span key={tag} className="tag-pill--idle text-xs px-2 py-0.5 rounded-full">
          {tag}
        </span>
      ))}
      {tags.length > max && (
        <span className="tag-pill--idle text-xs px-2 py-0.5 rounded-full opacity-80">
          +{tags.length - max}
        </span>
      )}
    </div>
  )
}

function PledgeBlock({ server }: { server: ServerBrowseItem }) {
  const pct = server.cost > 0 ? Math.min((server.totalPledged / server.cost) * 100, 100) : 0
  return (
    <div className="server-browse-card__pledge">
      <div className="server-browse-card__pledge-labels">
        <span>
          <Price amountUSD={server.totalPledged} /> pledged
        </span>
        <span>
          <Price amountUSD={server.cost} /> needed
        </span>
      </div>
      <div className="server-browse-card__pledge-track">
        <div className="server-browse-card__pledge-fill" style={{ width: `${pct}%` }} />
      </div>
      {server.totalOptimized > 0 && server.totalOptimized < server.totalPledged && (
        <p className="server-browse-card__pledge-optimized">
          Optimized to <Price amountUSD={server.totalOptimized} />/month
        </p>
      )}
    </div>
  )
}

function BannerThumb({
  server,
  isFavorited,
  onToggleFavorite,
  square,
}: {
  server: ServerBrowseItem
  isFavorited: boolean
  onToggleFavorite: (serverId: string) => void
  square?: boolean
}) {
  const favCount = server._count?.favorites ?? 0

  if (server.imageUrl) {
    return (
      <div className={`server-browse-card__banner${square ? " server-browse-card__banner--square" : ""}`}>
        <Image src={server.imageUrl} alt={server.name} fill className="object-cover" sizes={square ? "140px" : "500px"} />
        {server.isBoosted && <BoostBadge />}
        <FavoriteButton
          serverId={server.id}
          count={favCount}
          isFavorited={isFavorited}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    )
  }

  return (
    <div
      className={`server-browse-card__banner server-browse-card__banner--fallback${
        square ? " server-browse-card__banner--square" : ""
      }`}
    >
      <span className="server-browse-card__banner-letter">{server.name[0]?.toUpperCase()}</span>
      {server.isBoosted && <BoostBadge />}
      <FavoriteButton
        serverId={server.id}
        count={favCount}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  )
}

export default function ServerBrowseCard({ server, variant, isFavorited, onToggleFavorite }: Props) {
  const href = `/servers/${server.id}`

  if (variant === "list") {
    return (
      <Link href={href} className="server-browse-card server-browse-card--list listing-card">
        <BannerThumb server={server} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} square />
        <div className="server-browse-card__body server-browse-card__body--list">
          <h3 className="server-browse-card__title">{server.name}</h3>

          <div className="server-browse-card__info-line">
            <div className="server-browse-card__info-primary">
              <span className="font-medium">{server.gameType}</span>
              {server.region && (
                <>
                  <span className="server-browse-card__dot" aria-hidden>
                    ·
                  </span>
                  <span>{server.region}</span>
                </>
              )}
              <ServerMinecraftMeta
                variant="compact"
                gameType={server.gameType}
                minecraftVersion={server.minecraftVersion}
                minecraftEditionType={server.minecraftEditionType}
                minecraftModLoader={server.minecraftModLoader}
              />
            </div>
            {server.description && (
              <p className="server-browse-card__description server-browse-card__description--inline">
                {server.description}
              </p>
            )}
          </div>

          <div className="server-browse-card__stats-row server-browse-card__stats-row--split">
            <div className="server-browse-card__stats-left">
              <span className="server-browse-card__stat">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {server.pledgerCount} pledger{server.pledgerCount !== 1 ? "s" : ""}
              </span>
              {server.serverIp && <ServerLiveStats serverId={server.id} serverIp={server.serverIp} />}
            </div>
            <ServerTags tags={server.tags} max={4} className="server-browse-card__tags--end" />
          </div>

          <PledgeBlock server={server} />
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} className="server-browse-card server-browse-card--grid listing-card">
      <BannerThumb server={server} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} />
      <div className="server-browse-card__body server-browse-card__body--grid">
        <h3 className="server-browse-card__title">{server.name}</h3>

        <p className="server-browse-card__game-line">
          <span className="font-medium">{server.gameType}</span>
          {server.region && (
            <>
              <span className="server-browse-card__dot" aria-hidden>
                ·
              </span>
              <span>{server.region}</span>
            </>
          )}
        </p>

        <ServerMinecraftMeta
          variant="listing"
          gameType={server.gameType}
          minecraftVersion={server.minecraftVersion}
          minecraftEditionType={server.minecraftEditionType}
          minecraftModLoader={server.minecraftModLoader}
        />

        <ServerTags tags={server.tags} max={3} />

        {server.description && <p className="server-browse-card__description">{server.description}</p>}

        <div className="server-browse-card__grid-footer">
          <div className="server-browse-card__stats-row">
            <span className="server-browse-card__stat">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {server.pledgerCount} pledger{server.pledgerCount !== 1 ? "s" : ""}
            </span>
            {server.serverIp && <ServerLiveStats serverId={server.id} serverIp={server.serverIp} />}
          </div>

          <PledgeBlock server={server} />
        </div>
      </div>
    </Link>
  )
}
