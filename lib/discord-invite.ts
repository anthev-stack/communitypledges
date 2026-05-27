export const COMMUNITY_DISCORD_INVITE = "https://discord.gg/jj7GJFe3vH"

export type DiscordWidgetMember = {
  id: string
  username: string
  avatar: string | null
  status: string
}

export type DiscordWidgetSummary = {
  guildId: string
  name: string
  iconUrl: string | null
  inviteUrl: string
  onlineCount: number
  memberCount: number
  members: DiscordWidgetMember[]
}

export function parseDiscordInviteCode(url: string): string | null {
  const match = url.match(/(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9-]+)/)
  return match?.[1] ?? null
}

export async function fetchDiscordWidgetSummary(
  inviteUrl: string = COMMUNITY_DISCORD_INVITE
): Promise<DiscordWidgetSummary> {
  const inviteCode = parseDiscordInviteCode(inviteUrl)
  if (!inviteCode) {
    throw new Error("Invalid Discord invite URL")
  }

  const inviteResponse = await fetch(
    `https://discord.com/api/v9/invites/${inviteCode}?with_counts=true&with_expiration=true`
  )
  const inviteData = await inviteResponse.json()

  if (!inviteResponse.ok || inviteData.message === "Unknown Invite") {
    throw new Error(inviteData.message || "Invalid or expired Discord invite")
  }

  const guild = inviteData.guild
  const guildId = guild.id as string
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png?size=128`
    : null

  let members: DiscordWidgetMember[] = []
  let onlineCount = inviteData.approximate_presence_count ?? 0
  let inviteLink = inviteUrl

  try {
    const widgetResponse = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`)
    const widgetData = await widgetResponse.json()

    if (widgetResponse.ok && widgetData.id) {
      members = (widgetData.members ?? []).map(
        (m: { id: string; username: string; avatar: string | null; status: string }) => ({
          id: m.id,
          username: m.username,
          avatar: m.avatar,
          status: m.status,
        })
      )
      onlineCount = widgetData.presence_count ?? onlineCount
      inviteLink = widgetData.instant_invite || inviteUrl
    }
  } catch {
    // Widget disabled — invite counts still work
  }

  return {
    guildId,
    name: guild.name,
    iconUrl,
    inviteUrl: inviteLink,
    onlineCount,
    memberCount: inviteData.approximate_member_count ?? 0,
    members,
  }
}
