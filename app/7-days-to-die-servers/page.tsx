import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Skull } from 'lucide-react'

export const metadata: Metadata = {
  title: '7 Days to Die Server Browser - Find the Best 7DTD Servers',
  description: 'Browse the best 7 Days to Die servers on CommunityPledges. Find PvP, PvE, and roleplay 7DTD servers. Join communities and share hosting costs.',
  keywords: [
    '7 days to die server browser',
    '7 days to die server finder',
    '7 days to die servers',
    '7dtd server list',
    'best 7 days to die servers',
    '7dtd pvp servers',
    '7dtd pve servers',
    '7dtd roleplay servers',
    '7 days to die community',
    '7dtd multiplayer',
    '7dtd server hosting',
    'community pledges 7dtd',
    '7 days to die modded servers',
    '7dtd dedicated servers'
  ],
  openGraph: {
    title: '7 Days to Die Server Browser - CommunityPledges',
    description: 'Discover the best 7 Days to Die servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: [
      {
        url: '/og-7dtd.png',
        width: 1200,
        height: 630,
        alt: '7 Days to Die Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '7 Days to Die Server Browser - CommunityPledges',
    description: 'Discover the best 7 Days to Die servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: ['/og-7dtd.png'],
  },
}

export default function SevenDaysToDieServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Skull className="w-12 h-12 text-red-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            7 Days to Die Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best 7 Days to Die servers on CommunityPledges. Find PvP, PvE, and roleplay 
          7DTD servers with shared hosting costs and active communities.
        </p>
        <Link
          href="/servers?game=7dtd"
          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse 7DTD Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Survive the Apocalypse</h3>
          <p className="text-gray-300">
            Join 7DTD servers with zombie survival, base building, and intense PvP action.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find PvP, PvE, roleplay, modded, and dedicated 7 Days to Die servers.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite 7DTD servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular 7 Days to Die Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvP</h3>
            <p className="text-sm text-gray-300">
              Intense player versus player combat with raiding and base destruction
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvE</h3>
            <p className="text-sm text-gray-300">
              Cooperative zombie survival with base building and exploration
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Roleplay</h3>
            <p className="text-sm text-gray-300">
              Immersive post-apocalyptic roleplay with custom rules and storylines
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Modded</h3>
            <p className="text-sm text-gray-300">
              Enhanced gameplay with mods, custom weapons, and new content
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect 7DTD Server?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of survivors who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=7dtd"
          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing 7DTD Servers
        </Link>
      </div>
    </div>
  )
}
