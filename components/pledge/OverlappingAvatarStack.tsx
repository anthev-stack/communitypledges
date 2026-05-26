"use client"

import Image from "next/image"
import { ReactNode } from "react"

export type OverlappingAvatarItem = {
  id: string
  name: string | null
  image: string | null
  badge?: ReactNode
  /** Shown on hover (e.g. pledge date). */
  tooltip?: string
}

type Props = {
  items: OverlappingAvatarItem[]
  size?: "sm" | "lg"
  maxDisplay?: number
  className?: string
  ariaLabel?: string
}

export default function OverlappingAvatarStack({
  items,
  size = "sm",
  maxDisplay = 12,
  className = "",
  ariaLabel,
}: Props) {
  const display = items.slice(0, maxDisplay)
  const overflow = items.length - display.length

  if (display.length === 0) return null

  return (
    <div
      className={`overlapping-avatar-stack overlapping-avatar-stack--${size} ${className}`.trim()}
      role="list"
      aria-label={ariaLabel}
    >
      {display.map((item, index) => (
        <div
          key={item.id}
          className="overlapping-avatar-stack__item"
          role="listitem"
          tabIndex={item.tooltip ? 0 : undefined}
          style={{ zIndex: display.length - index }}
        >
          <div className="overlapping-avatar-stack__avatar-wrap">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name || "Member"}
                width={size === "lg" ? 48 : 28}
                height={size === "lg" ? 48 : 28}
                className="overlapping-avatar-stack__image"
                unoptimized={item.image.startsWith("http")}
              />
            ) : (
              <div className="overlapping-avatar-stack__fallback" aria-hidden>
                {item.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            {item.badge != null && (
              <span className="overlapping-avatar-stack__badge">{item.badge}</span>
            )}
          </div>
          {item.tooltip && (
            <span className="overlapping-avatar-stack__tooltip">{item.tooltip}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <span className="overlapping-avatar-stack__overflow" aria-hidden>
          +{overflow}
        </span>
      )}
    </div>
  )
}
