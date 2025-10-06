'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, ExternalLink, Play } from 'lucide-react'

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
  const [embedError, setEmbedError] = useState(false)

  useEffect(() => {
    const checkLiveStreamer = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/twitch/live-streamer')
        const data = await response.json()

        if (response.ok) {
          console.log('Live streamer data:', data)
          setLiveData(data)
          setError(null)
        } else {
          console.error('Failed to get live streamer:', data)
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
    
    // Check every 2 minutes if a streamer is live (less frequent since we have live embed)
    const interval = setInterval(checkLiveStreamer, 120000)
    
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
          Partner
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

          {/* Live Twitch Stream Embed */}
          <div className="relative">
            <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
              {!embedError ? (
                <iframe
                  src={`https://player.twitch.tv/?channel=${user.login}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'communitypledges.com'}&autoplay=true&muted=true&playsinline=true`}
                  height="100%"
                  width="100%"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="w-full h-full"
                  title={`${user.displayName} Live Stream`}
                  onError={(e) => {
                    console.error('Twitch player embed failed to load:', e)
                    console.log('Channel:', user.login, 'Display Name:', user.displayName)
                    console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'unknown')
                    // Try fallback to embed.twitch.tv with more aggressive autoplay
                    setTimeout(() => {
                      const iframe = e.target as HTMLIFrameElement
                      if (iframe) {
                        iframe.src = `https://embed.twitch.tv/?channel=${user.login}&autoplay=true&muted=true&playsinline=true`
                        console.log('Trying fallback embed method...')
                      }
                    }, 1000)
                  }}
                  onLoad={() => {
                    console.log('Twitch embed loaded successfully for:', user.login)
                    setEmbedError(false)
                    
                    // Try to force autoplay after load if it didn't start automatically
                    setTimeout(() => {
                      try {
                        const iframe = document.querySelector('iframe[title*="Live Stream"]') as HTMLIFrameElement
                        if (iframe && iframe.contentWindow) {
                          iframe.contentWindow.postMessage({ event: 'play' }, 'https://player.twitch.tv')
                        }
                      } catch (err) {
                        console.log('Could not force autoplay via postMessage:', err)
                      }
                    }, 2000)
                  }}
                />
              ) : (
                // Fallback: Show thumbnail with play button
                <div className="relative group w-full h-full">
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
                </div>
              )}
              
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
          <div className="mt-4">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Twitch</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
