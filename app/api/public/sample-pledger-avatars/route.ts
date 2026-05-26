import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Random member avatars from active pledgers (homepage marketing visual). */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        image: { not: null },
        pledges: { some: { status: "ACTIVE" } },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: 60,
    })

    const picked = shuffle(users).slice(0, 8)

    return NextResponse.json(picked, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("sample-pledger-avatars error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
