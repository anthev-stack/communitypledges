import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Sword } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Valheim Server Browser - Find the Best Valheim Servers',
  description: 'Browse the best Valheim servers on CommunityPledges. Find PvP, PvE, and roleplay Valheim servers. Join communities and share hosting costs.',
  keywords: [
    'valheim server browser',
    'valheim server finder',
    'valheim servers',
    'valheim server list',
    'best valheim servers',
    'valheim pvp servers',
    'valheim pve servers',
    'valheim roleplay servers',
    'valheim community',
    'valheim multiplayer',
    'valheim server hosting',
    'community pledges valheim',
    'valheim dedicated servers',
    'valheim modded servers'
  ],
  openGraph: {
    title: 'Valheim Server Browser - CommunityPledges',
    description: 'Discover the best Valheim servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: [
      {
        url: '/og-valheim.png',
        width: 1200,
        height: 630,
        alt: 'Valheim Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valheim Server Browser - CommunityPledges',
    description: 'Discover the best Valheim servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: ['/og-valheim.png'],
  },
}

export default function ValheimServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Sword className="w-12 h-12 text-amber-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Valheim Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best Valheim servers on CommunityPledges. Find PvP, PvE, and roleplay 
          Valheim servers with shared hosting costs and active communities.
        </p>
        <Link
          href="/servers?game=valheim"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse Valheim Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Viking Adventures</h3>
          <p className="text-gray-300">
            Join Valheim servers with epic Viking adventures, boss fights, and exploration.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find PvP, PvE, roleplay, modded, and dedicated Valheim servers.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite Valheim servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular Valheim Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvP</h3>
            <p className="text-sm text-gray-300">
              Player versus player combat with raiding and Viking warfare
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvE</h3>
            <p className="text-sm text-gray-300">
              Cooperative survival with boss fights and exploration
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Roleplay</h3>
            <p className="text-sm text-gray-300">
              Immersive Viking roleplay with custom rules and storylines
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Modded</h3>
            <p className="text-sm text-gray-300">
              Enhanced gameplay with mods and custom content
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect Valheim Server?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of Vikings who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=valheim"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing Valheim Servers
        </Link>
      </div>
    </div>
  )
}
