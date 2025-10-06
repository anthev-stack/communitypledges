import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Gamepad2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Minecraft Server Browser - Find the Best Minecraft Servers',
  description: 'Browse the best Minecraft servers on CommunityPledges. Find survival, creative, modded, and minigame servers. Join communities and share hosting costs.',
  keywords: [
    'minecraft server browser',
    'minecraft server finder',
    'minecraft servers',
    'minecraft server list',
    'best minecraft servers',
    'minecraft survival servers',
    'minecraft creative servers',
    'modded minecraft servers',
    'minecraft minigame servers',
    'minecraft community',
    'minecraft multiplayer',
    'minecraft server hosting',
    'community pledges minecraft'
  ],
  openGraph: {
    title: 'Minecraft Server Browser - CommunityPledges',
    description: 'Discover the best Minecraft servers. Browse survival, creative, modded, and minigame servers with shared hosting costs.',
    images: [
      {
        url: '/og-minecraft.png',
        width: 1200,
        height: 630,
        alt: 'Minecraft Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minecraft Server Browser - CommunityPledges',
    description: 'Discover the best Minecraft servers. Browse survival, creative, modded, and minigame servers with shared hosting costs.',
    images: ['/og-minecraft.png'],
  },
}

export default function MinecraftServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Gamepad2 className="w-12 h-12 text-green-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Minecraft Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best Minecraft servers on CommunityPledges. Find survival, creative, modded, 
          and minigame servers with shared hosting costs.
        </p>
        <Link
          href="/servers?game=minecraft"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse Minecraft Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Active Communities</h3>
          <p className="text-gray-300">
            Join thriving Minecraft communities with active players and dedicated staff.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find survival, creative, modded, minigame, and custom Minecraft servers.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular Minecraft Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Survival</h3>
            <p className="text-sm text-gray-300">
              Classic survival gameplay with community challenges and events
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Creative</h3>
            <p className="text-sm text-gray-300">
              Build amazing creations with unlimited resources and world edit
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Modded</h3>
            <p className="text-sm text-gray-300">
              Enhanced gameplay with mods like Tekkit, Feed The Beast, and more
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Minigames</h3>
            <p className="text-sm text-gray-300">
              Bedwars, Skyblock, Parkour, and other exciting minigame experiences
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect Minecraft Server?</h2>
        <p className="text-gray-300 mb-6">
          Join players who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=minecraft"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing Minecraft Servers
        </Link>
      </div>
    </div>
  )
}
