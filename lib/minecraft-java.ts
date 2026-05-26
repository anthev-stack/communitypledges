export const MINECRAFT_JAVA_EDITION = "Minecraft: Java Edition"

export const MINECRAFT_JAVA_VERSIONS = [
  "1.21.4",
  "1.21.3",
  "1.21.2",
  "1.21.1",
  "1.21",
  "1.20.6",
  "1.20.4",
  "1.20.2",
  "1.20.1",
  "1.19.4",
  "1.19.2",
  "1.18.2",
  "1.17.1",
  "1.16.5",
  "1.12.2",
  "1.8.9",
] as const

export const MINECRAFT_EDITION_TYPES = [
  { value: "vanilla", label: "Vanilla" },
  { value: "modded", label: "Modded" },
] as const

export const MINECRAFT_MOD_LOADERS = [
  "Forge",
  "Fabric",
  "NeoForge",
  "Quilt",
  "LiteLoader",
  "Other",
] as const

export type MinecraftEditionType = (typeof MINECRAFT_EDITION_TYPES)[number]["value"]
export type MinecraftModLoader = (typeof MINECRAFT_MOD_LOADERS)[number]

export function isMinecraftJavaEdition(gameType: string) {
  return gameType === MINECRAFT_JAVA_EDITION
}

export function formatMinecraftEditionLabel(editionType: string | null | undefined) {
  if (editionType === "vanilla") return "Vanilla"
  if (editionType === "modded") return "Modded"
  return null
}
