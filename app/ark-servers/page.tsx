import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ARK Server Browser - Find the Best ARK: Survival Evolved Servers',
  description: 'Browse the best ARK: Survival Evolved servers on CommunityPledges. Find PvP, PvE, and roleplay ARK servers. Join communities and share hosting costs.',
  keywords: [
    'ark server browser',
    'ark server finder',
    'ark servers',
    'ark server list',
    'best ark servers',
    'ark pvp servers',
    'ark pve servers',
    'ark roleplay servers',
    'ark community',
    'ark multiplayer',
    'ark server hosting',
    'community pledges ark',
    'ark survival evolved servers',
    'ark modded servers',
    'ark cluster servers'
  ],
  openGraph: {
    title: 'ARK Server Browser - CommunityPledges',
    description: 'Discover the best ARK: Survival Evolved servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: [
      {
        url: '/og-ark.png',
        width: 1200,
        height: 630,
        alt: 'ARK Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARK Server Browser - CommunityPledges',
    description: 'Discover the best ARK: Survival Evolved servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: ['/og-ark.png'],
  },
}

export default function ARKServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Zap className="w-12 h-12 text-blue-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            ARK Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best ARK: Survival Evolved servers on CommunityPledges. Find PvP, PvE, and roleplay 
          ARK servers with shared hosting costs and active communities.
        </p>
        <Link
          href="/servers?game=ark"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse ARK Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Survive Together</h3>
          <p className="text-gray-300">
            Join ARK servers with active tribes, dinosaur taming, and epic adventures.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find PvP, PvE, roleplay, modded, and cluster ARK servers for every playstyle.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite ARK servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular ARK Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvP</h3>
            <p className="text-sm text-gray-300">
              High-intensity player versus player combat with raiding and base building
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvE</h3>
            <p className="text-sm text-gray-300">
              Player versus environment focused gameplay with cooperative survival
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Roleplay</h3>
            <p className="text-sm text-gray-300">
              Immersive roleplay experiences with custom rules and storylines
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Modded</h3>
            <p className="text-sm text-gray-300">
              Enhanced gameplay with mods like S+, Structures Plus, and custom creatures
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Cluster</h3>
            <p className="text-sm text-gray-300">
              Multi-map server clusters with character and item transfers
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Primitive+</h3>
            <p className="text-sm text-gray-300">
              Primitive technology focused gameplay with enhanced crafting
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect ARK Server?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of survivors who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=ark"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing ARK Servers
        </Link>
      </div>
    </div>
  )
}
