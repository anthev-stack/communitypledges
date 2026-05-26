import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isMinecraftGameType, resolveQueryHostPort } from "@/lib/server-address"
const minecraftUtil = require("minecraft-server-util")
const GamedigLib = require("gamedig")
// Gamedig v5+ exports GameDig object with query method
const Gamedig = GamedigLib.GameDig || GamedigLib
const net = require("net")

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        gameType: true,
        serverIp: true,
        serverPort: true,
      },
    })

    if (!server) {
      return NextResponse.json(
        { error: "Server not found" },
        { status: 404 }
      )
    }

    if (!server.serverIp) {
      return NextResponse.json({
        serverId: server.id,
        serverName: server.name,
        gameType: server.gameType,
        stats: {
          online: false,
          error: "Server address not configured",
        },
      })
    }

    const defaultPort = isMinecraftGameType(server.gameType) ? 25565 : undefined
    const resolved = resolveQueryHostPort(server.serverIp, server.serverPort, defaultPort)

    if (!resolved) {
      return NextResponse.json({
        serverId: server.id,
        serverName: server.name,
        gameType: server.gameType,
        stats: {
          online: false,
          error: "Server port not configured",
        },
      })
    }

    const { host: ip, port } = resolved

    console.log(`Checking server stats for ${server.name} (${server.gameType}): ${ip}:${port}`)

    // Handle Minecraft servers
    if (isMinecraftGameType(server.gameType)) {
      try {
        const response = await queryMinecraftStatus(ip, port)

        // Update player count in database
        await prisma.server.update({
          where: { id },
          data: { playerCount: response.players.online },
        })

        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: true,
            players: {
              online: response.players.online,
              max: response.players.max,
            },
            version: response.version?.name || null,
            motd: response.motd?.clean || response.motd?.raw || null,
            serverType: "Minecraft",
          },
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Minecraft query failed for ${ip}:${port}:`, message)
        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: false,
            error: "Server offline or unreachable",
            detail: process.env.NODE_ENV === "development" ? message : undefined,
          },
        })
      }
    }

    // Handle Counter-Strike games (CS2, CS:GO, CS:S, CS 1.6)
    if (server.gameType.toLowerCase().includes("counter-strike") || 
        server.gameType.toLowerCase().includes("cs2") ||
        server.gameType.toLowerCase().includes("cs:go") ||
        server.gameType.toLowerCase().includes("cs:s") ||
        server.gameType.toLowerCase().includes("cs 1.6")) {
      
      try {
        // CS2 uses the same query protocol as CS:GO (Source engine A2S protocol)
        let gameType = "csgo" // Default to csgo for CS2 (same protocol)
        if (server.gameType.toLowerCase().includes("cs:s")) {
          gameType = "css"
        } else if (server.gameType.toLowerCase().includes("cs 1.6")) {
          gameType = "cs16"
        }

        console.log(`Querying CS server: ${ip}:${port} with type: ${gameType}`)

        const state = await Gamedig.query({
          type: gameType,
          host: ip,
          port: port,
        })

        // Update player count in database
        await prisma.server.update({
          where: { id },
          data: { playerCount: state.players.length },
        })

        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: true,
            players: {
              online: state.players.length,
              max: state.maxplayers,
            },
            map: state.map || null,
            version: state.raw?.version || null,
            ping: state.ping || null,
            serverType: server.gameType,
          },
        })
      } catch (error: any) {
        console.error(`Counter-Strike query failed for ${ip}:${port}:`, error.message)
        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: false,
            error: "Server offline or unreachable",
          },
        })
      }
    }

    // Handle Team Fortress 2
    if (server.gameType.toLowerCase().includes("team fortress") || 
        server.gameType.toLowerCase().includes("tf2")) {
      
      try {
        const state = await Gamedig.query({
          type: "tf2",
          host: ip,
          port: port,
        })

        // Update player count in database
        await prisma.server.update({
          where: { id },
          data: { playerCount: state.players.length },
        })

        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: true,
            players: {
              online: state.players.length,
              max: state.maxplayers,
            },
            map: state.map || null,
            version: state.raw?.version || null,
            ping: state.ping || null,
            serverType: server.gameType,
          },
        })
      } catch (error: any) {
        console.error(`Team Fortress 2 query failed for ${ip}:${port}:`, error.message)
        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: false,
            error: "Server offline or unreachable",
          },
        })
      }
    }

    // For other games, do a simple TCP connection test
    try {
      const isOnline = await testTCPConnection(ip, port)
      
      if (isOnline) {
        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: true,
            serverType: server.gameType,
          },
        })
      } else {
        return NextResponse.json({
          serverId: server.id,
          serverName: server.name,
          gameType: server.gameType,
          stats: {
            online: false,
            error: "Server offline",
          },
        })
      }
    } catch (error) {
      return NextResponse.json({
        serverId: server.id,
        serverName: server.name,
        gameType: server.gameType,
        stats: {
          online: false,
          error: "Connection test failed",
        },
      })
    }
  } catch (error) {
    console.error("Server stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch server stats" },
      { status: 500 }
    )
  }
}

async function queryMinecraftStatus(host: string, port: number) {
  const options = { timeout: 10000, enableSRV: false as const }

  try {
    return await minecraftUtil.status(host, port, options)
  } catch (firstError) {
    // SRV only when direct query fails (e.g. some hosted servers use _minecraft._tcp records)
    try {
      return await minecraftUtil.status(host, port, { timeout: 10000, enableSRV: true })
    } catch {
      throw firstError
    }
  }
}

// Test TCP connection to a server
function testTCPConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    socket.setTimeout(5000)
    
    socket.on("connect", () => {
      socket.destroy()
      resolve(true)
    })
    
    socket.on("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    
    socket.on("error", () => {
      resolve(false)
    })
    
    socket.connect(port, host)
  })
}





