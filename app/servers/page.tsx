"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { REGIONS } from "@/lib/game-tags"
import { SUPPORTED_GAMES } from "@/lib/supported-games"
import { getTagsForGame } from "@/lib/game-tags"
import { Price } from "@/components/Price"
import ServerLiveStats from "@/components/ServerLiveStats"
import MarketingListingLayout from "@/components/marketing/MarketingListingLayout"

interface Server {
  id: string
  name: string
  description: string
  gameType: string
  serverIp: string | null
  playerCount: number
  cost: number
  imageUrl: string
  region: string | null
  tags: string[]
  createdAt: string
  isBoosted: boolean
  boostExpiresAt: string | null
  owner: {
    id: string
    name: string
    image: string
  }
  totalPledged: number
  totalOptimized: number
  pledgerCount: number
  _count?: {
    favorites: number
  }
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([])
  const [filteredServers, setFilteredServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGame, setSelectedGame] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  // Get all unique tags from current filtered servers
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    fetchServers()
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites?type=server")
      if (response.ok) {
        const data = await response.json()
        const serverIds: string[] = data.favorites
          .map((fav: any) => fav.serverId)
          .filter((id: any) => id && typeof id === 'string')
        setFavorites(new Set(serverIds))
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
    }
  }

  const toggleFavorite = async (serverId: string) => {
    try {
      const isFavorited = favorites.has(serverId)
      
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?serverId=${serverId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setFavorites(prev => {
            const newSet = new Set(prev)
            newSet.delete(serverId)
            return newSet
          })
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId })
        })
        if (response.ok) {
          setFavorites(prev => new Set(prev).add(serverId))
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  useEffect(() => {
    filterServers()
  }, [servers, searchTerm, selectedGame, selectedRegion, selectedTags, sortBy])

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/servers")
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterServers = () => {
    let filtered = servers

    // Search by name, description, game type, or tags
    if (searchTerm) {
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.gameType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by game type
    if (selectedGame) {
      filtered = filtered.filter(server => server.gameType === selectedGame)
    }

    // Filter by region
    if (selectedRegion) {
      filtered = filtered.filter(server => server.region === selectedRegion)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(server =>
        selectedTags.every(tag => server.tags.includes(tag))
      )
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        case "oldest":
          return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        case "most_pledged":
          return b.totalPledged - a.totalPledged
        case "least_pledged":
          return a.totalPledged - b.totalPledged
        case "most_pledgers":
          return b.pledgerCount - a.pledgerCount
        case "least_pledgers":
          return a.pledgerCount - b.pledgerCount
        case "name_asc":
          return a.name.localeCompare(b.name)
        case "name_desc":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    setFilteredServers(filtered)

    // Update available tags based on filtered servers and selected game
    if (selectedGame) {
      setAvailableTags(getTagsForGame(selectedGame))
    } else {
      const tags = new Set<string>()
      filtered.forEach(server => {
        server.tags.forEach(tag => tags.add(tag))
      })
      setAvailableTags(Array.from(tags).sort())
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedGame("")
    setSelectedRegion("")
    setSelectedTags([])
    setSortBy("newest")
  }

  const hasActiveFilters = searchTerm || selectedGame || selectedRegion || selectedTags.length > 0 || sortBy !== "newest"

  // Get current game tags for display
  const currentGameTags = selectedGame ? getTagsForGame(selectedGame) : availableTags

  return (
    <MarketingListingLayout
      title="Servers"
      subtitle="Find a new server to play or simply search the one you are looking for and start pledging!"
    >
        <div className="marketing-filters">
          {/* Search Bar and Filters Button */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search servers by name, description, game type, or tags..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="space-y-4">
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Game Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Game Type
                  </label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Games</option>
                    {SUPPORTED_GAMES.map((game) => (
                      <option key={game.type} value={game.name}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Regions</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most_pledged">Most Pledged</option>
                    <option value="least_pledged">Least Pledged</option>
                    <option value="most_pledgers">Most Pledgers</option>
                    <option value="least_pledgers">Least Pledgers</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                  </select>
                </div>
              </div>

              {/* Game-specific Tags */}
              {currentGameTags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">
                    {selectedGame ? `${selectedGame} Tags` : "Popular Tags"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentGameTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          selectedTags.includes(tag)
                            ? "tag-pill--active"
                            : "tag-pill--idle"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Showing {filteredServers.length} of {servers.length} servers</span>
              {selectedGame && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Filtered by {selectedGame}
                </span>
              )}
              {sortBy !== "newest" && (
                <span className="text-white">
                  Sorted by {sortBy.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Server List */}
        {loading ? (
          <div className="listing-loading text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p>Loading servers...</p>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="listing-empty p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? "No servers found" : "No servers available"}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "Be the first to create a server!"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServers.map((server) => (
              <Link key={server.id} href={`/servers/${server.id}`}>
                <div className="listing-card overflow-hidden transition cursor-pointer h-full flex flex-col">
                  {/* Server Banner */}
                  {server.imageUrl ? (
                    <div className="relative w-full" style={{ aspectRatio: '500/100' }}>
                      <Image
                        src={server.imageUrl}
                        alt={server.name}
                        fill
                        className="object-cover"
                      />
                      {/* Boost indicator */}
                      {server.isBoosted && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          BOOSTED
                        </div>
                      )}
                      {/* Favorite button with count */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(server.id)
                        }}
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 ${favorites.has(server.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                          fill={favorites.has(server.id) ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-white text-sm font-medium">
                          {server._count?.favorites || 0}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center" style={{ aspectRatio: '500/100' }}>
                      <span className="text-2xl text-white font-bold">
                        {server.name[0]?.toUpperCase()}
                      </span>
                      {/* Boost indicator */}
                      {server.isBoosted && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          BOOSTED
                        </div>
                      )}
                      {/* Favorite button with count */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleFavorite(server.id)
                        }}
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 ${favorites.has(server.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                          fill={favorites.has(server.id) ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-white text-sm font-medium">
                          {server._count?.favorites || 0}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Server Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                      {server.name}
                    </h3>

                    {/* Game Type & Region */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span className="font-medium">{server.gameType}</span>
                      {server.region && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{server.region}</span>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    {server.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {server.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {server.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-slate-700/50 text-gray-300 rounded-full">
                            +{server.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {server.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {server.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {server.pledgerCount} pledger{server.pledgerCount !== 1 ? 's' : ''}
                        </span>
                        {server.serverIp && (
                          <ServerLiveStats serverId={server.id} serverIp={server.serverIp} />
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span><Price amountUSD={server.totalPledged} /> pledged</span>
                          <span><Price amountUSD={server.cost} /> needed</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((server.totalPledged / server.cost) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        {server.totalOptimized > 0 && server.totalOptimized < server.totalPledged && (
                          <p className="text-xs text-green-600 mt-1">
                            💰 Optimized to <Price amountUSD={server.totalOptimized} />/month
                          </p>
                        )}
                      </div>

                      {/* Owner */}
                      <div className="flex items-center pt-3 border-t border-gray-200">
                        {server.owner.image ? (
                          <Image
                            src={server.owner.image}
                            alt={server.owner.name}
                            width={24}
                            height={24}
                            className="rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                            {server.owner.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-gray-600">{server.owner.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </MarketingListingLayout>
  )
}
