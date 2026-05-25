"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { REGIONS } from "@/lib/game-tags"
import { COMMUNITY_TAGS } from "@/lib/community-tags"
import { SUPPORTED_GAMES } from "@/lib/supported-games"
import MarketingListingLayout from "@/components/marketing/MarketingListingLayout"

interface Community {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  bannerUrl: string | null
  gameTypes: string[]
  region: string | null
  tags: string[]
  memberCount: number
  discordUrl: string | null
  websiteUrl: string | null
  createdAt: string
  owner: {
    id: string
    name: string
    image: string | null
  }
  _count: {
    servers: number
  }
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGame, setSelectedGame] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    fetchCommunities()
  }, [])

  useEffect(() => {
    filterCommunities()
  }, [communities, searchTerm, selectedGame, selectedRegion, selectedTags, sortBy])

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities")
      if (response.ok) {
        const data = await response.json()
        setCommunities(data)
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterCommunities = () => {
    let filtered = communities

    // Search by name, description, game types, or tags
    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.gameTypes.some(gameType => gameType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by game type
    if (selectedGame) {
      filtered = filtered.filter(community =>
        community.gameTypes.includes(selectedGame)
      )
    }

    // Filter by region
    if (selectedRegion) {
      filtered = filtered.filter(community => community.region === selectedRegion)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(community =>
        selectedTags.every(tag => community.tags.includes(tag))
      )
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        case "oldest":
          return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        case "most_servers":
          return b._count.servers - a._count.servers
        case "least_servers":
          return a._count.servers - b._count.servers
        case "name_asc":
          return a.name.localeCompare(b.name)
        case "name_desc":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    setFilteredCommunities(filtered)

    // Update available tags - use community tags if no game selected, otherwise show all community tags
    if (selectedGame) {
      setAvailableTags(COMMUNITY_TAGS)
    } else {
      const tags = new Set<string>()
      filtered.forEach(community => {
        community.tags.forEach(tag => tags.add(tag))
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

  if (loading) {
    return (
      <MarketingListingLayout
        title="Communities"
        subtitle="Discover new communities, make new friends and find your haven!"
      >
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p>Loading communities...</p>
        </div>
      </MarketingListingLayout>
    )
  }

  return (
    <MarketingListingLayout
      title="Communities"
      subtitle="Discover new communities, make new friends and find your haven!"
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
                placeholder="Search communities by name, description, game type, or tags..."
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
                    <option value="most_servers">Most Servers</option>
                    <option value="least_servers">Least Servers</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                  </select>
                </div>
              </div>

              {/* Community Tags */}
              {availableTags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">
                    {selectedGame ? `Community Tags` : "Popular Tags"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
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
              <span>Showing {filteredCommunities.length} of {communities.length} communities</span>
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

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="listing-empty p-12 text-center">
            <p className="text-lg mb-4">No communities found</p>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="listing-card overflow-hidden transition-shadow block"
              >
                {/* Banner or Image */}
                <div className="relative w-full bg-gradient-to-r from-indigo-500 to-purple-600" style={{ aspectRatio: '500/100' }}>
                  {community.bannerUrl ? (
                    <Image
                      src={community.bannerUrl}
                      alt={community.name}
                      fill
                      className="object-cover"
                    />
                  ) : community.imageUrl ? (
                    <Image
                      src={community.imageUrl}
                      alt={community.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-6xl font-bold opacity-50">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Community Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {community.name}
                  </h3>

                  {/* Description */}
                  {community.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {community.description}
                    </p>
                  )}

                  {/* Game Types */}
                  {community.gameTypes.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {community.gameTypes.slice(0, 3).map((gameType) => (
                          <span
                            key={gameType}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded"
                          >
                            {gameType}
                          </span>
                        ))}
                        {community.gameTypes.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700/50 text-gray-300 text-xs font-medium rounded">
                            +{community.gameTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                      {community._count.servers} {community._count.servers === 1 ? 'server' : 'servers'}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {community.discordUrl && (
                      <div className="flex items-center text-indigo-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                      </div>
                    )}
                    {community.websiteUrl && (
                      <div className="flex items-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                    )}
                    {community.region && (
                      <span className="ml-auto text-xs text-gray-500">
                        📍 {community.region}
                      </span>
                    )}
                  </div>

                  {/* Owner */}
                  <div className="flex items-center mt-4 pt-4 border-t border-gray-200">
                    {community.owner.image ? (
                      <Image
                        src={community.owner.image}
                        alt={community.owner.name || "Owner"}
                        width={24}
                        height={24}
                        className="rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                    )}
                    <span className="text-sm text-gray-600">
                      by {community.owner.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </MarketingListingLayout>
  )
}

