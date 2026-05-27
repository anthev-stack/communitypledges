export type TwitchStreamInfo = {
  isLive: boolean
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

async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Twitch API not configured")
  }

  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  })

  if (!tokenResponse.ok) {
    throw new Error("Failed to authenticate with Twitch")
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token as string
}

/** Check if a Twitch login is currently live (Helix API). */
export async function getTwitchStreamByUsername(
  username: string
): Promise<TwitchStreamInfo> {
  const login = username.trim().toLowerCase().replace(/^@/, "")
  if (!login) {
    return { isLive: false, message: "Username is required" }
  }

  const accessToken = await getTwitchAccessToken()
  const clientId = process.env.TWITCH_CLIENT_ID!

  const userResponse = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  )

  if (!userResponse.ok) {
    throw new Error("Failed to get user data from Twitch")
  }

  const userData = await userResponse.json()
  if (!userData.data?.length) {
    return { isLive: false, message: "User not found" }
  }

  const userInfo = userData.data[0]

  const streamResponse = await fetch(
    `https://api.twitch.tv/helix/streams?user_id=${userInfo.id}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  )

  if (!streamResponse.ok) {
    throw new Error("Failed to get stream data from Twitch")
  }

  const streamData = await streamResponse.json()
  const isLive = streamData.data?.length > 0

  const user = {
    id: userInfo.id,
    login: userInfo.login,
    displayName: userInfo.display_name,
    profileImageUrl: userInfo.profile_image_url,
  }

  if (!isLive) {
    return { isLive: false, user }
  }

  const stream = streamData.data[0]
  return {
    isLive: true,
    stream: {
      id: stream.id,
      title: stream.title,
      gameName: stream.game_name,
      viewerCount: stream.viewer_count,
      startedAt: stream.started_at,
      thumbnailUrl: stream.thumbnail_url,
      language: stream.language,
    },
    user,
  }
}
