import {
  formatMinecraftEditionLabel,
  isMinecraftJavaEdition,
} from "@/lib/minecraft-java"

type Props = {
  gameType: string
  minecraftVersion?: string | null
  minecraftEditionType?: string | null
  minecraftModLoader?: string | null
  variant?: "detail" | "listing"
}

export default function ServerMinecraftMeta({
  gameType,
  minecraftVersion,
  minecraftEditionType,
  minecraftModLoader,
  variant = "detail",
}: Props) {
  if (!isMinecraftJavaEdition(gameType) || !minecraftVersion) return null

  const edition = formatMinecraftEditionLabel(minecraftEditionType)
  const parts = [minecraftVersion, edition, minecraftEditionType === "modded" && minecraftModLoader]
    .filter(Boolean)
    .join(" · ")

  const isListing = variant === "listing"

  return (
    <p
      className={
        isListing
          ? "text-xs text-gray-500 mt-0.5 mb-2 flex flex-wrap gap-x-1 gap-y-0.5"
          : "text-sm text-gray-300 mt-1 flex flex-wrap gap-x-1 gap-y-0.5"
      }
    >
      {parts.split(" · ").map((part, i, arr) => (
        <span key={part}>
          <span className={isListing ? "text-gray-600 font-medium" : "text-white/90"}>{part}</span>
          {i < arr.length - 1 && <span className="text-gray-400"> · </span>}
        </span>
      ))}
    </p>
  )
}
