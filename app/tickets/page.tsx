"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import MarketingTicketsLayout from "@/components/marketing/MarketingTicketsLayout"
import { getTicketPriorityClass, getTicketStatusClass } from "@/lib/ticket-styles"

interface Ticket {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  responses: {
    id: string
    content: string
    isStaff: boolean
    createdAt: string
    user: {
      name: string
    }
  }[]
}

const CATEGORIES = [
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "support", label: "Support" },
  { value: "report_user_server", label: "Report User/Server" },
  { value: "other", label: "Other" },
]

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    fetchTickets()
  }, [session, status, router])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tickets")
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

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getPriorityLabel = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.label || priority
  }

  const getStatusLabel = (status: string) => {
    return STATUSES.find(s => s.value === status)?.label || status
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
  }

  if (status === "loading") {
    return (
      <MarketingTicketsLayout title="Support Tickets" subtitle="Manage your support requests and get help from our team">
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingTicketsLayout>
    )
  }

  const newTicketButton = (
    <Link href="/tickets/create" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Ticket
    </Link>
  )

  return (
    <MarketingTicketsLayout
      title="Support Tickets"
      subtitle="Manage your support requests and get help from our team"
      action={newTicketButton}
    >
      <div className="listing-card p-6 md:p-8 space-y-6">
        <div className="marketing-filters">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg min-w-[140px]"
              >
                <option value="all">All Status</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg min-w-[140px]"
              >
                <option value="all">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="listing-loading text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p>Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="listing-empty text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="mb-6">You haven&apos;t created any support tickets yet.</p>
            <Link href="/tickets/create" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center">
              Create your first ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="py-4 first:pt-0 last:pb-0 hover:bg-white/5 -mx-2 px-2 rounded-lg transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-base font-semibold text-white hover:text-[#949cf7] transition"
                      >
                        {ticket.title}
                      </Link>
                      <span className={getTicketStatusClass(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={getTicketPriorityClass(ticket.priority)}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">{ticket.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{getCategoryLabel(ticket.category)}</span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.responses.length > 0 && (
                        <span className="text-[#949cf7]">
                          {ticket.responses.length} response{ticket.responses.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="text-sm text-[#949cf7] hover:text-[#c9cdfb] shrink-0"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MarketingTicketsLayout>
  )
}

