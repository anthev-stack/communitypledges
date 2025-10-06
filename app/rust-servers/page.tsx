import { Metadata } from 'next'
import Link from 'next/link'
import { Server, Users, MapPin, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Rust Server Browser - Find the Best Rust Servers',
  description: 'Browse the best Rust servers on CommunityPledges. Find PvP, PvE, and roleplay servers. Join communities and share hosting costs.',
  keywords: [
    'rust server browser',
    'rust server finder',
    'rust servers',
    'rust server list',
    'best rust servers',
    'rust pvp servers',
    'rust pve servers',
    'rust roleplay servers',
    'rust community',
    'rust multiplayer',
    'rust server hosting',
    'community pledges rust'
  ],
  openGraph: {
    title: 'Rust Server Browser - CommunityPledges',
    description: 'Discover the best Rust servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: [
      {
        url: '/og-rust.png',
        width: 1200,
        height: 630,
        alt: 'Rust Server Browser - CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rust Server Browser - CommunityPledges',
    description: 'Discover the best Rust servers. Browse PvP, PvE, and roleplay servers with shared hosting costs.',
    images: ['/og-rust.png'],
  },
}

export default function RustServersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-orange-500 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Rust Server Browser
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Discover the best Rust servers on CommunityPledges. Find PvP, PvE, and roleplay servers 
          with shared hosting costs and active communities.
        </p>
        <Link
          href="/servers?game=rust"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Server className="w-5 h-5 mr-2" />
          Browse Rust Servers
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Active Players</h3>
          <p className="text-gray-300">
            Join Rust servers with active player bases and competitive gameplay.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Server Variety</h3>
          <p className="text-gray-300">
            Find PvP, PvE, roleplay, and custom Rust servers for every playstyle.
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Shared Costs</h3>
          <p className="text-gray-300">
            Help support your favorite Rust servers by sharing hosting costs with the community.
          </p>
        </div>
      </div>

      {/* Server Types */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Popular Rust Server Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvP Servers</h3>
            <p className="text-sm text-gray-300">
              High-intensity player versus player combat with raiding and base building
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">PvE Servers</h3>
            <p className="text-sm text-gray-300">
              Player versus environment focused gameplay with less PvP conflict
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-white">Roleplay</h3>
            <p className="text-sm text-gray-300">
              Immersive roleplay experiences with custom rules and storylines
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Perfect Rust Server?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of players who have found their home on CommunityPledges servers.
        </p>
        <Link
          href="/servers?game=rust"
          className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Start Browsing Rust Servers
        </Link>
      </div>
    </div>
  )
}
