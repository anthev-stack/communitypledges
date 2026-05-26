"use client"

import { useEffect, useState } from "react"
import OverlappingAvatarStack, {
  type OverlappingAvatarItem,
} from "@/components/pledge/OverlappingAvatarStack"

const DISPLAY_COUNT = 5

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #5865f2, #ec4899)",
  "linear-gradient(135deg, #23a559, #5865f2)",
  "linear-gradient(135deg, #f59e0b, #ec4899)",
  "linear-gradient(135deg, #06b6d4, #5865f2)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
]

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

export default function MarketingCommunityAvatars() {
  const [items, setItems] = useState<OverlappingAvatarItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/public/sample-pledger-avatars", {
          cache: "no-store",
        })
        if (!res.ok) return
        const data: { id: string; name: string | null; image: string | null }[] =
          await res.json()
        if (cancelled) return

        if (data.length > 0) {
          setItems(
            pickRandom(data, DISPLAY_COUNT).map((u) => ({
              id: u.id,
              name: u.name,
              image: u.image,
            }))
          )
        } else {
          setItems(
            Array.from({ length: DISPLAY_COUNT }, (_, i) => ({
              id: `fallback-${i}`,
              name: null,
              image: null,
            }))
          )
        }
      } catch {
        if (!cancelled) {
          setItems(
            Array.from({ length: DISPLAY_COUNT }, (_, i) => ({
              id: `fallback-${i}`,
              name: null,
              image: null,
            }))
          )
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (items.length === 0) {
    return (
      <div className="marketing-visual__avatars marketing-visual__avatars--loading">
        {FALLBACK_GRADIENTS.map((bg, i) => (
          <span
            key={i}
            className="marketing-visual__avatar marketing-visual__avatar--placeholder"
            style={{ background: bg }}
          />
        ))}
      </div>
    )
  }

  const allFallback = items.every((item) => !item.image)

  if (allFallback) {
    return (
      <div className="marketing-visual__avatars">
        {items.map((item, i) => (
          <span
            key={item.id}
            className="marketing-visual__avatar"
            style={{ background: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length] }}
          />
        ))}
      </div>
    )
  }

  return (
    <OverlappingAvatarStack
      items={items}
      size="sm"
      maxDisplay={DISPLAY_COUNT}
      className="marketing-visual__avatars-stack"
      ariaLabel="Community members who pledged"
    />
  )
}
