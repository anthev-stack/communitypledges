import {
  formatMinecraftEditionLabel,
  isMinecraftJavaEdition,
} from "@/lib/minecraft-java"

type Props = {
  gameType: string
  minecraftVersion?: string | null
  minecraftEditionType?: string | null
  minecraftModLoader?: string | null
}

export default function ServerMinecraftMeta({
  gameType,
  minecraftVersion,
  minecraftEditionType,
  minecraftModLoader,
}: Props) {
  if (!isMinecraftJavaEdition(gameType) || !minecraftVersion) return null

  const edition = formatMinecraftEditionLabel(minecraftEditionType)
  const parts = [minecraftVersion, edition, minecraftEditionType === "modded" && minecraftModLoader]
    .filter(Boolean)
    .join(" · ")

  return (
    <p className="text-sm text-gray-300 mt-1 flex flex-wrap gap-x-1 gap-y-0.5">
      {parts.split(" · ").map((part, i, arr) => (
        <span key={part}>
          <span className="text-white/90">{part}</span>
          {i < arr.length - 1 && <span className="text-gray-500"> · </span>}
        </span>
      ))}
    </p>
  )
}
