'use client'

import { useState, useEffect } from 'react'
import { Play, Users, Eye, ExternalLink } from 'lucide-react'

interface StreamData {
  id: string
  title: string
  gameName: string
  viewerCount: number
  startedAt: string
  thumbnailUrl: string
  language: string
}

interface UserData {
  id: string
  login: string
  displayName: string
  profileImageUrl: string
}

interface PartnerStreamer {
  id: string
  username: string
  displayName: string
  priority: number
  isActive: boolean
}

interface LiveStreamerData {
  isLive: boolean
  streamer?: PartnerStreamer
  stream?: StreamData
  user?: UserData
  message?: string
  totalStreamers?: number
}

export default function LiveStreamerEmbed() {
  const [liveData, setLiveData] = useState<LiveStreamerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkLiveStreamer = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/twitch/live-streamer')
        const data = await response.json()

        if (response.ok) {
          setLiveData(data)
          setError(null)
        } else {
          setError(data.message || 'Failed to check live streamers')
        }
      } catch (err) {
        setError('Failed to check live streamers')
        console.error('Live streamer check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkLiveStreamer()
    
    // Check every 30 seconds if a streamer is live
    const interval = setInterval(checkLiveStreamer, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-slate-700 rounded mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 font-medium mb-2">Stream Status Error</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!liveData?.isLive || !liveData.stream || !liveData.user || !liveData.streamer) {
    return null // Don't show anything if no partner streamer is live
  }

  const { stream, user, streamer } = liveData
  const streamUrl = `https://www.twitch.tv/${user.login}`
  
  // Format viewer count
  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  // Calculate stream duration
  const getStreamDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="relative">
      {/* Partner Badge */}
      <div className="absolute -top-3 left-4 z-10">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
          🎮 Community Pledges Partner
        </div>
      </div>

      {/* Main Stream Container */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border-2 border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Stream Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 border-b border-purple-500/20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={user.profileImageUrl}
                alt={user.displayName}
                className="w-12 h-12 rounded-full border-2 border-purple-400"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{user.displayName}</h3>
              <p className="text-purple-300 text-sm">LIVE NOW</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-red-400">
                <Eye className="w-4 h-4" />
                <span>{formatViewerCount(stream.viewerCount)}</span>
              </div>
              <div className="text-purple-300">
                {getStreamDuration(stream.startedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Stream Content */}
        <div className="p-4">
          {/* Stream Title */}
          <h4 className="text-white font-semibold mb-2 line-clamp-2">
            {stream.title}
          </h4>
          
          {/* Game Category */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
              {stream.gameName}
            </span>
          </div>

          {/* Stream Thumbnail/Embed */}
          <div className="relative group">
            <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
              <img
                src={stream.thumbnailUrl.replace('{width}', '640').replace('{height}', '360')}
                alt="Stream thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                >
                  <Play className="w-8 h-8 fill-current" />
                </a>
              </div>

              {/* Live Badge */}
              <div className="absolute top-3 left-3">
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Watch Live</span>
            </a>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
              title="Open in Twitch"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
