import { NextResponse } from "next/server"
import { fetchDiscordWidgetSummary } from "@/lib/discord-invite"

export async function GET() {
  try {
    const data = await fetchDiscordWidgetSummary()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("discord-widget API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Discord" },
      { status: 502 }
    )
  }
}
