"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import PartnerStreamerManagement from "@/components/PartnerStreamerManagement"
import MarketingStaffLayout from "@/components/marketing/MarketingStaffLayout"
import { Users, Server, Ticket, Globe, Play, ArrowLeft } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  createdAt: string
  _count: {
    pledges: number
    servers: number
  }
}

interface Server {
  id: string
  name: string
  gameType: string
  cost: number
  isActive: boolean
  status: string
  owner: {
    name: string
    email: string
  }
  _count: {
    pledges: number
  }
}

interface Ticket {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  assignedUser?: {
    id: string
    name: string
  }
  _count: {
    responses: number
  }
}

export default function StaffDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<"users" | "servers" | "tickets" | "web" | "streamers">("users")
  const [users, setUsers] = useState<User[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [ticketFilters, setTicketFilters] = useState({
    status: "all",
    category: "all",
    priority: "all"
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string>('/favicon.ico')
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [defaultBannerUrl, setDefaultBannerUrl] = useState<string>('')
  const [gameBanners, setGameBanners] = useState<Record<string, string>>({})
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      // Check if user has staff role
      fetchUserRole()
    }
  }, [session])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user/me")
      if (response.ok) {
        const data = await response.json()
        console.log("User role data:", data)
        setUserRole(data.role) // Set the user role to state
        if (data.role !== "ADMIN" && data.role !== "MODERATOR") {
          console.log("User is not staff, redirecting to dashboard")
          router.push("/dashboard")
          return
        }
        console.log("User is staff, loading data")
        // User is staff, load data
        if (tab === "users") {
          fetchUsers()
        } else if (tab === "servers") {
          fetchServers()
        } else {
          fetchTickets()
        }
      } else {
        console.error("Failed to fetch user role, status:", response.status)
        const errorData = await response.text()
        console.error("Error response:", errorData)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to check role:", error)
      router.push("/dashboard")
    }
  }

  useEffect(() => {
    if (session?.user) {
      if (tab === "users") {
        fetchUsers()
      } else if (tab === "servers") {
        fetchServers()
      } else if (tab === "tickets") {
        fetchTickets()
      } else if (tab === "web") {
        fetchFaviconUrl()
        fetchGameBanners()
      }
    }
  }, [tab, session, ticketFilters])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/staff/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/staff/servers")
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

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ticketFilters.status !== "all") params.append("status", ticketFilters.status)
      if (ticketFilters.category !== "all") params.append("category", ticketFilters.category)
      if (ticketFilters.priority !== "all") params.append("priority", ticketFilters.priority)
      
      const response = await fetch(`/api/staff/tickets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFaviconUrl = async () => {
    try {
      const faviconRes = await fetch('/api/admin/upload-gif?type=favicon').catch(() => null)
      if (faviconRes?.ok) {
        const faviconData = await faviconRes.json()
        if (faviconData.dataUrl) setFaviconUrl(faviconData.dataUrl)
      }
    } catch (error) {
      console.error('Failed to fetch favicon:', error)
    }
  }

  const fetchGameBanners = async () => {
    try {
      // Fetch default banner
      const defaultRes = await fetch('/api/admin/game-banners?type=default-banner').catch(() => null)
      if (defaultRes?.ok) {
        const defaultData = await defaultRes.json()
        if (defaultData.dataUrl) setDefaultBannerUrl(defaultData.dataUrl)
      }

      // Fetch game-specific banners for all supported games
      const supportedGames = [
        'Counter-Strike 2', 'Counter-Strike: Global Offensive', 'Team Fortress 2',
        'Minecraft: Java Edition', 'Minecraft: Bedrock Edition', 'Rust', 'ARK: Survival Evolved',
        'Valheim', '7 Days to Die', 'Conan Exiles', 'DayZ', 'The Forest', 'Sons of The Forest'
      ]

      const gameBannerPromises = supportedGames.map(async (game) => {
        try {
          const response = await fetch(`/api/admin/game-banners?type=game-banner&gameType=${encodeURIComponent(game)}`)
          if (response.ok) {
            const data = await response.json()
            return { game, bannerUrl: data.dataUrl }
          }
        } catch (error) {
          console.error(`Failed to fetch banner for ${game}:`, error)
        }
        return { game, bannerUrl: null }
      })

      const results = await Promise.all(gameBannerPromises)
      const bannerMap: Record<string, string> = {}
      results.forEach(({ game, bannerUrl }) => {
        if (bannerUrl) bannerMap[game] = bannerUrl
      })
      setGameBanners(bannerMap)
    } catch (error) {
      console.error('Failed to fetch game banners:', error)
    }
  }

  const handleFaviconUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      alert('Please upload an ICO, PNG, or SVG file')
      return
    }

    // Validate file size (max 100KB for favicon)
    if (file.size > 100 * 1024) {
      alert('Favicon must be smaller than 100KB')
      return
    }

    setUploadingFavicon(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'favicon')

      const response = await fetch('/api/admin/upload-gif', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFaviconUrl(data.dataUrl)
        alert('Favicon uploaded successfully! Refresh the page to see changes.')
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload favicon')
    } finally {
      setUploadingFavicon(false)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleBannerUpload = async (file: File, gameType: string | null, type: 'game-banner' | 'default-banner') => {
    // Validate file type
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a WebP, PNG, or JPEG file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB')
      return
    }

    const uploadKey = type === 'game-banner' ? gameType : 'default'
    setUploadingBanner(uploadKey)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      if (gameType) formData.append('gameType', gameType)

      const response = await fetch('/api/admin/game-banners', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (type === 'default-banner') {
          setDefaultBannerUrl(data.dataUrl)
        } else if (gameType) {
          setGameBanners(prev => ({ ...prev, [gameType]: data.dataUrl }))
        }
        alert(`${type === 'default-banner' ? 'Default banner' : `${gameType} banner`} uploaded successfully!`)
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload banner')
    } finally {
      setUploadingBanner(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    const roleActions: Record<string, string> = {
      suspended: "suspend",
      banned: "ban",
      user: "restore to user",
      moderator: "promote to moderator",
      admin: "promote to admin",
    }

    if (!confirm(`Are you sure you want to ${roleActions[newRole]} "${userName}"?`)) {
      return
    }

    try {
      const response = await fetch("/api/staff/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        alert(`User role updated successfully!`)
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update role")
      }
    } catch (error) {
      console.error("Role update error:", error)
      alert("Failed to update role")
    }
  }

  const handleDeleteServer = async (serverId: string, serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"? This will cancel all pledges.`)) {
      return
    }

    try {
      const response = await fetch(`/api/staff/servers/${serverId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Server deleted successfully!")
        fetchServers()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete server")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete server")
    }
  }

  const handleTicketStatusChange = async (ticketId: string, newStatus: string, ticketTitle: string) => {
    try {
      const response = await fetch(`/api/staff/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        alert(`Ticket "${ticketTitle}" status updated to ${newStatus}!`)
        fetchTickets()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update ticket status")
      }
    } catch (error) {
      console.error("Status update error:", error)
      alert("Failed to update ticket status")
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      bug_report: "Bug Report",
      feature_request: "Feature Request",
      support: "Support",
      report_user_server: "Report User/Server",
      other: "Other"
    }
    return categories[category] || category
  }

  const getPriorityLabel = (priority: string) => {
    const priorities: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent"
    }
    return priorities[priority] || priority
  }

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed"
    }
    return statuses[status] || status
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "urgent": return "staff-pill staff-pill--urgent"
      case "high": return "staff-pill staff-pill--high"
      case "medium": return "staff-pill staff-pill--medium"
      case "low": return "staff-pill staff-pill--low"
      default: return "staff-pill staff-pill--default"
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "open": return "staff-pill staff-pill--open"
      case "in_progress": return "staff-pill staff-pill--in_progress"
      case "resolved": return "staff-pill staff-pill--resolved"
      case "closed": return "staff-pill staff-pill--closed"
      default: return "staff-pill staff-pill--default"
    }
  }

  const getRoleClass = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN": return "staff-pill staff-pill--admin"
      case "MODERATOR": return "staff-pill staff-pill--moderator"
      case "SUSPENDED": return "staff-pill staff-pill--suspended"
      case "BANNED": return "staff-pill staff-pill--banned"
      default: return "staff-pill staff-pill--user"
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === "loading") {
    return (
      <MarketingStaffLayout>
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400/80 mx-auto" />
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingStaffLayout>
    )
  }

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.gameType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MarketingStaffLayout
      variant="tabs"
      headerAction={
        <Link href="/dashboard" className="staff-header-link inline-flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-5 h-5" aria-hidden />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      }
    >
      <div className="staff-tabs">
        <div className="staff-tabs__nav">
              <button
                type="button"
                onClick={() => setTab("users")}
                className={`staff-tabs__btn ${tab === "users" ? "staff-tabs__btn--active" : ""}`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs sm:text-sm">Users</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("servers")}
                className={`staff-tabs__btn ${tab === "servers" ? "staff-tabs__btn--active" : ""}`}
              >
                <Server className="w-5 h-5" />
                <span className="text-xs sm:text-sm">Servers</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("tickets")}
                className={`staff-tabs__btn ${tab === "tickets" ? "staff-tabs__btn--active" : ""}`}
              >
                <Ticket className="w-5 h-5" />
                <span className="text-xs sm:text-sm">Tickets</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("streamers")}
                className={`staff-tabs__btn ${tab === "streamers" ? "staff-tabs__btn--active" : ""}`}
              >
                <Play className="w-5 h-5" />
                <span className="text-xs sm:text-sm">Streamers</span>
              </button>
              {userRole === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => setTab("web")}
                  className={`staff-tabs__btn ${tab === "web" ? "staff-tabs__btn--active" : ""}`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">Web</span>
                </button>
              )}
        </div>

          {tab !== "web" && tab !== "streamers" && (
            <div className="marketing-filters staff-toolbar">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  tab === "users" ? "Search users by name or email..." :
                  tab === "servers" ? "Search servers by name or game..." :
                  "Search tickets by title or user..."
                }
                className="staff-input"
              />
            </div>
          )}

          {tab === "tickets" && (
            <div className="marketing-filters staff-toolbar">
              <div className="flex flex-wrap gap-3">
                <select
                  value={ticketFilters.status}
                  onChange={(e) => setTicketFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="staff-select"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={ticketFilters.category}
                  onChange={(e) => setTicketFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="staff-select"
                >
                  <option value="all">All Categories</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="support">Support</option>
                  <option value="report_user_server">Report User/Server</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={ticketFilters.priority}
                  onChange={(e) => setTicketFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="staff-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}

          <div className="staff-tabs__body">
            {loading ? (
              <div className="listing-loading text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400/80 mx-auto" />
                <p className="mt-4">Loading...</p>
              </div>
            ) : tab === "users" ? (
              /* User Management */
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <p className="listing-empty text-center py-8">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="listing-card p-4 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{user.name || "Unnamed"}</h3>
                              <span className={getRoleClass(user.role)}>{user.role}</span>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{user._count.pledges} pledges</span>
                              <span>{user._count.servers} servers</span>
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.name || user.email || "User")}
                            className="staff-select"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            <option value="suspended">Suspended</option>
                            <option value="banned">Banned</option>
                          </select>
                          <Link href={`/users/${user.id}`} className="staff-link text-center block">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : tab === "servers" ? (
              /* Server Management */
              <div className="space-y-4">
                {filteredServers.length === 0 ? (
                  <p className="listing-empty text-center py-8">No servers found</p>
                ) : (
                  filteredServers.map((server) => (
                    <div key={server.id} className="listing-card p-4 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{server.name}</h3>
                            {!server.isActive && (
                              <span className="staff-pill staff-pill--banned">Inactive</span>
                            )}
                            <span className="staff-pill staff-pill--default">{server.status}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{server.gameType}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Owner: {server.owner.name || server.owner.email}</span>
                            <span>${server.cost}/month</span>
                            <span>{server._count.pledges} pledgers</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link href={`/servers/${server.id}`}>
                            <button type="button" className="btn-server-pledge btn-server-pledge--secondary text-sm">
                              View
                            </button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteServer(server.id, server.name)}
                            className="btn-server-pledge btn-server-pledge--danger text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : tab === "tickets" ? (
              /* Ticket Management */
              <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                  <p className="listing-empty text-center py-8">No tickets found</p>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="listing-card p-4 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                            <h3 className="font-semibold">{ticket.title}</h3>
                            <span className={getStatusClass(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span className={getPriorityClass(ticket.priority)}>
                              {getPriorityLabel(ticket.priority)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Category: {getCategoryLabel(ticket.category)}</span>
                            <span>From: {ticket.user.name || ticket.user.email}</span>
                            <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                            <span>{ticket._count.responses} responses</span>
                            {ticket.assignedUser && (
                              <span className="staff-link">Assigned to: {ticket.assignedUser.name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleTicketStatusChange(ticket.id, e.target.value, ticket.title)}
                            className="staff-select"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <Link href={`/staff/tickets/${ticket.id}`} className="staff-link text-center block">
                            View & Respond
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : tab === "web" ? (
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">Web Management</h2>
                  <p className="text-gray-600">
                    Site appearance uses a fixed dark theme. Manage branding assets below.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-6">Website Favicon</h2>
                  <p className="text-gray-600 mb-6">Upload a custom favicon for your website. This will appear in browser tabs and bookmarks.</p>
                  
                  <div className="staff-asset-card max-w-md">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-semibold">Site Favicon</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Upload a .ico, .png, or .svg file (recommended: 32x32px or 64x64px)
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <Image src={faviconUrl} alt="Current favicon" width={32} height={32} className="w-8 h-8" unoptimized />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current favicon</p>
                          <p className="text-xs text-gray-500">Displays in browser tabs</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="file"
                          accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
                          className="hidden"
                          id="favicon-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFaviconUpload(file)
                          }}
                        />
                        <label
                          htmlFor="favicon-upload"
                          className="flex-1 btn-server-pledge btn-server-pledge--primary text-center cursor-pointer disabled:opacity-50"
                        >
                          {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                        </label>
                        <button
                          type="button"
                          onClick={() => window.open(faviconUrl, "_blank")}
                          className="btn-server-pledge btn-server-pledge--secondary"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game Banner Management */}
                <div className="mt-12">
                  <h2 className="text-xl font-bold mb-6">Game Banner Management</h2>
                  <p className="text-gray-600 mb-6">Upload custom banners for different game types. These will appear in the hero section of server pages instead of individual server banners.</p>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Default Game Banner</h3>
                    <p className="text-gray-600 text-sm mb-4">This banner will be used for games that don&apos;t have a specific banner uploaded.</p>
                    
                    <div
                      className="staff-asset-card max-w-md transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file) handleBannerUpload(file, null, 'default-banner')
                      }}
                    >
                      <div className="space-y-4">
                        {defaultBannerUrl ? (
                          <div className="relative" style={{ aspectRatio: '500/100' }}>
                            <Image 
                              src={defaultBannerUrl} 
                              alt="Default game banner" 
                              fill 
                              className="object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="w-full bg-slate-700/50 rounded-lg flex items-center justify-center" style={{ aspectRatio: '500/100' }}>
                            <span className="text-gray-400">No default banner uploaded</span>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <input
                            type="file"
                            accept=".webp,.png,.jpg,.jpeg"
                            className="hidden"
                            id="default-banner-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBannerUpload(file, null, 'default-banner')
                            }}
                          />
                          <label
                            htmlFor="default-banner-upload"
                            className="flex-1 btn-server-pledge btn-server-pledge--primary text-center cursor-pointer disabled:opacity-50"
                          >
                            {uploadingBanner === "default" ? "Uploading..." : "Upload Default Banner"}
                          </label>
                          {defaultBannerUrl && (
                            <button
                              type="button"
                              onClick={() => window.open(defaultBannerUrl, "_blank")}
                              className="btn-server-pledge btn-server-pledge--secondary"
                            >
                              View
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          Drag and drop WebP, PNG, or JPEG files here
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Game-Specific Banners */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Game-Specific Banners</h3>
                    <p className="text-gray-600 text-sm mb-6">Upload banners for specific games. These will override the default banner for that game type.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        'Counter-Strike 2', 'Counter-Strike: Global Offensive', 'Team Fortress 2',
                        'Minecraft: Java Edition', 'Minecraft: Bedrock Edition', 'Rust', 
                        'ARK: Survival Evolved', 'Valheim', '7 Days to Die', 'Conan Exiles', 
                        'DayZ', 'The Forest', 'Sons of The Forest'
                      ].map((game) => (
                        <div
                          key={game}
                          className="staff-asset-card p-4 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                            e.preventDefault()
                            const file = e.dataTransfer.files[0]
                            if (file) handleBannerUpload(file, game, 'game-banner')
                          }}
                        >
                          <h4 className="text-sm font-semibold mb-3 truncate" title={game}>
                            {game}
                          </h4>
                          
                          <div className="space-y-3">
                            {gameBanners[game] ? (
                              <div className="relative" style={{ aspectRatio: '500/100' }}>
                                <Image 
                                  src={gameBanners[game]} 
                                  alt={`${game} banner`} 
                                  fill 
                                  className="object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="w-full bg-slate-700/50 rounded-lg flex items-center justify-center" style={{ aspectRatio: '500/100' }}>
                                <span className="text-gray-400 text-xs text-center">No banner uploaded</span>
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <input
                                type="file"
                                accept=".webp,.png,.jpg,.jpeg"
                                className="hidden"
                                id={`banner-upload-${game.replace(/[^a-zA-Z0-9]/g, '_')}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleBannerUpload(file, game, 'game-banner')
                                }}
                              />
                              <label
                                htmlFor={`banner-upload-${game.replace(/[^a-zA-Z0-9]/g, "_")}`}
                                className="flex-1 btn-server-pledge btn-server-pledge--primary text-center cursor-pointer disabled:opacity-50 text-xs"
                              >
                                {uploadingBanner === game ? "Uploading..." : "Upload"}
                              </label>
                              {gameBanners[game] && (
                                <button
                                  type="button"
                                  onClick={() => window.open(gameBanners[game], "_blank")}
                                  className="btn-server-pledge btn-server-pledge--secondary text-xs"
                                >
                                  View
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                              Drag & drop or click to upload
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 staff-callout">
                    <div>
                        <h4 className="text-sm font-semibold mb-1">Game Banner Guidelines</h4>
                        <ul className="space-y-1 list-none pl-0">
                          <li>• Recommended dimensions: 500x100 pixels (5:1 aspect ratio)</li>
                          <li>• Supports WebP, GIF, PNG, and JPEG formats</li>
                          <li>• Maximum file size: 5MB per banner</li>
                          <li>• Game-specific banners override the default banner</li>
                          <li>• Banners appear in server page hero sections instead of individual server banners</li>
                          <li>• Use high-quality images that represent each game type well</li>
                        </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : tab === "streamers" ? (
              /* Streamers Management */
              <div className="max-w-6xl mx-auto">
                <PartnerStreamerManagement />
              </div>
            ) : null}
          </div>
      </div>
    </MarketingStaffLayout>
  )
}

