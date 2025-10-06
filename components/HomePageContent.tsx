'use client'

import Link from 'next/link'
import { Server, Users, DollarSign, Heart } from 'lucide-react'
import LiveStreamerEmbed from '@/components/LiveStreamerEmbed'
import { useThemeColors } from '@/utils/theme'

export default function HomePageContent() {
  const colors = useThemeColors()

  return (
    <>
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Community Pledges
          <span className="text-lg sm:text-xl md:text-2xl text-gray-400 ml-2">BETA</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Share the cost of community servers with your members. Pledge what you can afford whether its $2 or $10, we'll optimize with split costs to make hosting affordable for everyone. Keeping community servers alive!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/servers"
            className={`${colors.primaryBg} text-white px-8 py-3 rounded-lg ${colors.primaryBgHover} transition-colors flex items-center justify-center space-x-2`}
          >
            <Server className="w-5 h-5" />
            <span>Browse Servers</span>
          </Link>
          <Link
            href="/servers/create"
            className="bg-slate-700 text-white px-8 py-3 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Heart className="w-5 h-5" />
            <span>Create Server</span>
          </Link>
        </div>
      </div>

      {/* Live Stream Section */}
      <div className="mb-16">
        <LiveStreamerEmbed />
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <div className="text-center">
          <div className={`${colors.primaryBgOpacity} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <DollarSign className={`w-8 h-8 ${colors.primaryText}`} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Split Cost Sharing</h3>
          <p className="text-gray-300">
            Pay only what you pledged or less. We optimize costs to reduce everyones payments 
            when others pledge alongside you respecting your pledge limit.
          </p>
        </div>
        
        <div className="text-center">
          <div className={`${colors.primaryBgOpacity} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Users className={`w-8 h-8 ${colors.primaryText}`} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Community Driven</h3>
          <p className="text-gray-300">
            Join forces with other community members to make server costs 
            more affordable for server owners.
          </p>
        </div>
        
        <div className="text-center">
          <div className={`${colors.primaryBgOpacity} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Heart className={`w-8 h-8 ${colors.primaryText}`} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Transparent Process</h3>
          <p className="text-gray-300">
            See exactly what you'll pay and how your pledge helped reduce 
            costs for everyone else if you pledged more!
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-16 border border-slate-700/50">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`${colors.primaryBg} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold`}>
              1
            </div>
            <h3 className="font-semibold mb-2 text-white">Create or Browse</h3>
            <p className="text-sm text-gray-300">
              Upload/create your server with monthly cost or simply browse existing servers
            </p>
          </div>
          
          <div className="text-center">
            <div className={`${colors.primaryBg} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold`}>
              2
            </div>
            <h3 className="font-semibold mb-2 text-white">Pledge Amount</h3>
            <p className="text-sm text-gray-300">
              Pledge what you can afford to contribute to your desired server or simply find a server to join
            </p>
          </div>
          
          <div className="text-center">
            <div className={`${colors.primaryBg} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold`}>
              3
            </div>
            <h3 className="font-semibold mb-2 text-white">Smart Optimization</h3>
            <p className="text-sm text-gray-300">
              We optimize costs to reduce everyone's payment while respecting limits
            </p>
          </div>
          
          <div className="text-center">
            <div className={`${colors.primaryBg} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold`}>
              4
            </div>
            <h3 className="font-semibold mb-2 text-white">Pay & Save</h3>
            <p className="text-sm text-gray-300">
              Pay your optimized amount and enjoy keeping the community alive!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
