import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readModrinthInstance, saveModrinthInstance, deleteModrinthInstance } from "@/lib/modrinth-storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        hasModrinthInstance: true,
        modrinthInstanceFileName: true,
        modrinthInstanceExtension: true,
        name: true,
      },
    })

    if (!server?.hasModrinthInstance || !server.modrinthInstanceExtension) {
      return NextResponse.json({ error: "Modrinth instance not available" }, { status: 404 })
    }

    const buffer = await readModrinthInstance(id, server.modrinthInstanceExtension)
    if (!buffer) {
      return NextResponse.json({ error: "Modrinth instance file not found" }, { status: 404 })
    }

    const fileName = server.modrinthInstanceFileName || `modrinth-instance${server.modrinthInstanceExtension}`
    const mime =
      server.modrinthInstanceExtension === ".zip"
        ? "application/zip"
        : "application/x-modrinth-modpack+zip"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
        "Content-Length": String(buffer.length),
      },
    })
  } catch (error) {
    console.error("Modrinth download error:", error)
    return NextResponse.json({ error: "Failed to download Modrinth instance" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id },
      select: { ownerId: true, modrinthInstanceExtension: true },
    })

    if (!server || server.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (server.modrinthInstanceExtension) {
      await deleteModrinthInstance(id, server.modrinthInstanceExtension)
    }

    const { originalName, extension } = await saveModrinthInstance(id, file)

    await prisma.server.update({
      where: { id },
      data: {
        hasModrinthInstance: true,
        modrinthInstanceFileName: originalName,
        modrinthInstanceExtension: extension,
      },
    })

    return NextResponse.json({
      success: true,
      fileName: originalName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id },
      select: { ownerId: true, modrinthInstanceExtension: true },
    })

    if (!server || server.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await deleteModrinthInstance(id, server.modrinthInstanceExtension)
    await prisma.server.update({
      where: { id },
      data: {
        hasModrinthInstance: false,
        modrinthInstanceFileName: null,
        modrinthInstanceExtension: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Modrinth delete error:", error)
    return NextResponse.json({ error: "Failed to remove Modrinth instance" }, { status: 500 })
  }
}
