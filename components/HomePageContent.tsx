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
        <h2 className="text-3xl font-bold text-center mb-12 text-white">How It Works</h2>
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Community Member Side */}
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">For Community Members</h3>
              <p className="text-gray-400">Join servers and help share hosting costs</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Browse Servers to Play!</h4>
                  <p className="text-sm text-gray-300">
                    Discover amazing gaming servers across Minecraft, Rust, Terraria, ARK, Valheim, and more. Find communities that match your interests.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Pledge Your Support</h4>
                  <p className="text-sm text-gray-300">
                    Choose how much you can afford to contribute monthly - whether it's $2, $5, or $10. Every pledge helps keep the server running.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Pay Less Than You Pledged</h4>
                  <p className="text-sm text-gray-300">
                    When others join and pledge, costs get split! You'll often pay less than your pledged amount while still supporting the community.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Enjoy & Connect</h4>
                  <p className="text-sm text-gray-300">
                    Play on your chosen servers knowing you're helping keep them alive. Connect with like-minded gamers and build lasting friendships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Server Owner Side */}
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">For Server Owners</h3>
              <p className="text-gray-400">Share hosting costs with your community</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Upload Your Server</h4>
                  <p className="text-sm text-gray-300">
                    Create your server listing with details about your community, game type, and monthly hosting costs. Set your server's unique personality.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Invite Your Community</h4>
                  <p className="text-sm text-gray-300">
                    Share your server with your Discord community, friends, and social media. Let them know they can help support the server they love.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Watch Pledges Come In</h4>
                  <p className="text-sm text-gray-300">
                    See your community members pledge their support. Track how much of your hosting costs are being covered by the community.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className={`${colors.primaryBg} text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Focus on Your Community</h4>
                  <p className="text-sm text-gray-300">
                    Spend less time worrying about hosting costs and more time building amazing experiences for your players. Let the community support what they love.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
