import { NextRequest, NextResponse } from "next/server"
import { getTwitchStreamByUsername } from "@/lib/twitch"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const username = new URL(request.url).searchParams.get("username")

    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 })
    }

    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
      return NextResponse.json({ message: "Twitch API not configured" }, { status: 500 })
    }

    const result = await getTwitchStreamByUsername(username)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Twitch API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
