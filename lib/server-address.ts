/** Parse host:port from a combined address string (IPv4 hostname:port; not full IPv6). */
export function splitHostAndPort(address: string): { host: string; port: number | null } {
  const trimmed = address.trim()
  if (!trimmed) return { host: "", port: null }

  const lastColon = trimmed.lastIndexOf(":")
  if (lastColon === -1) {
    return { host: trimmed, port: null }
  }

  const portPart = trimmed.slice(lastColon + 1)
  if (!/^\d+$/.test(portPart)) {
    return { host: trimmed, port: null }
  }

  return {
    host: trimmed.slice(0, lastColon),
    port: parseInt(portPart, 10),
  }
}

/** Normalize IP + optional port fields for database storage. */
export function normalizeServerAddress(
  serverIp: string | null | undefined,
  serverPort: string | number | null | undefined
): { serverIp: string | null; serverPort: number | null } {
  let host = (serverIp ?? "").trim()
  let port: number | null = null

  if (host) {
    const split = splitHostAndPort(host)
    host = split.host
    if (split.port != null) port = split.port
  }

  if (serverPort != null && String(serverPort).trim() !== "") {
    const parsed = parseInt(String(serverPort), 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      port = parsed
    }
  }

  return {
    serverIp: host || null,
    serverPort: port,
  }
}

/** Display / copy address with port when stored separately. */
export function formatServerAddress(
  serverIp: string | null | undefined,
  serverPort: number | null | undefined
): string {
  const { serverIp: host, serverPort: port } = normalizeServerAddress(serverIp, serverPort)
  if (!host) return ""
  if (port) return `${host}:${port}`
  return host
}

/** Resolve host + port for live status queries. */
export function resolveQueryHostPort(
  serverIp: string | null | undefined,
  serverPort: number | null | undefined,
  defaultPort?: number
): { host: string; port: number } | null {
  const { serverIp: host, serverPort: port } = normalizeServerAddress(serverIp, serverPort)
  if (!host) return null

  const finalPort = port ?? defaultPort ?? null
  if (finalPort == null || isNaN(finalPort)) return null

  return { host, port: finalPort }
}

export function isMinecraftGameType(gameType: string) {
  return gameType.toLowerCase().includes("minecraft")
}
