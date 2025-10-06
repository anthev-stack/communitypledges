import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Pickaxe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terraria Server Browser - Find the Best Terraria Servers',
  description: 'Browse the best Terraria servers on CommunityPledges. Find adventure, creative, and modded Terraria servers. Join communities and share hosting costs.',
  keywords: [
    'terraria server browser',
    'terraria server finder',
    'terraria servers',
    'terraria server list',
    'best terraria servers',
    'terraria adventure servers',
    'terraria creative servers',
    'terraria modded servers',
    'terraria community',
    'terraria multiplayer',
    'terraria server hosting',
    'community pledges terraria',
    'terraria tmodloader servers',
    'terraria calamity servers'
  ],
  openGraph: {
    title: 'Terraria Server Browser - CommunityPledges',
    description: 'Discover the best Terraria servers. Browse adventure, creative, and modded servers with shared hosting costs.',
    images: [
      {
        url: '/og-terraria.png',
        width: 1200,
        height: 630,
        alt: 'Terraria Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terraria Server Browser - CommunityPledges',
    description: 'Discover the best Terraria servers. Browse adventure, creative, and modded servers with shared hosting costs.',
    images: ['/og-terraria.png'],
  },
}

export default function TerrariaServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Pickaxe className="w-12 h-12 text-orange-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Terraria Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best Terraria servers on CommunityPledges. Find adventure, creative, and modded 
          Terraria servers with shared hosting costs and active communities.
        </p>
        <Link
          href="/servers?game=terraria"
          className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse Terraria Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Adventure Awaits</h3>
          <p className="text-gray-300">
            Join Terraria servers with exciting adventures, boss fights, and exploration.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find adventure, creative, modded, and tModLoader Terraria servers.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite Terraria servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular Terraria Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Adventure</h3>
            <p className="text-sm text-gray-300">
              Classic Terraria gameplay with progression, boss fights, and exploration
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Creative</h3>
            <p className="text-sm text-gray-300">
              Build amazing structures with unlimited resources and creative tools
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Modded</h3>
            <p className="text-sm text-gray-300">
              Enhanced gameplay with mods like Calamity, Thorium, and tModLoader
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvP</h3>
            <p className="text-sm text-gray-300">
              Player versus player combat with custom arenas and balanced gear
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect Terraria Server?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of players who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=terraria"
          className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing Terraria Servers
        </Link>
      </div>
    </div>
  )
}
