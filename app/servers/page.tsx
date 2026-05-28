"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, List } from "lucide-react"
import { REGIONS } from "@/lib/game-tags"
import { SUPPORTED_GAMES } from "@/lib/supported-games"
import { getTagsForGame } from "@/lib/game-tags"
import MarketingListingLayout from "@/components/marketing/MarketingListingLayout"
import ServerBrowseCard, { type ServerBrowseItem } from "@/components/server/ServerBrowseCard"

type Server = ServerBrowseItem & {
  playerCount: number
  createdAt: string
  boostExpiresAt: string | null
  owner: ServerBrowseItem["owner"] & { id: string }
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    const saved = localStorage.getItem("servers-view-mode")
    if (saved === "grid" || saved === "list") {
      setViewMode(saved)
    }
  }, [])

  const changeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode)
    localStorage.setItem("servers-view-mode", mode)
  }
  
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-700">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <div className="servers-status-count">
                <span>Showing {filteredServers.length} of {servers.length} servers</span>
                <div className="servers-view-toggle" role="group" aria-label="Server list layout">
                  <button
                    type="button"
                    className={`servers-view-toggle__btn ${viewMode === "grid" ? "servers-view-toggle__btn--active" : ""}`}
                    onClick={() => changeViewMode("grid")}
                    aria-pressed={viewMode === "grid"}
                    title="Column view"
                  >
                    <LayoutGrid className="w-4 h-4" aria-hidden />
                    <span className="hidden sm:inline">Columns</span>
                  </button>
                  <button
                    type="button"
                    className={`servers-view-toggle__btn ${viewMode === "list" ? "servers-view-toggle__btn--active" : ""}`}
                    onClick={() => changeViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    title="Horizontal view"
                  >
                    <List className="w-4 h-4" aria-hidden />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
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
                type="button"
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
          <div className={viewMode === "grid" ? "servers-browse-grid" : "servers-browse-list"}>
            {filteredServers.map((server) => (
              <ServerBrowseCard
                key={server.id}
                server={server}
                variant={viewMode}
                isFavorited={favorites.has(server.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
    </MarketingListingLayout>
  )
}
