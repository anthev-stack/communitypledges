"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import MarketingStaffLayout from "@/components/marketing/MarketingStaffLayout"

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

const CATEGORIES: Record<string, string> = {
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  support: "Support",
  report_user_server: "Report User/Server",
  other: "Other",
}

const PRIORITIES: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

const STATUSES: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
}

export default function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [newResponse, setNewResponse] = useState("")
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [ticketId, setTicketId] = useState<string>("")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }

    fetchUserRole()

    params.then((p) => {
      setTicketId(p.id)
      fetchTicket(p.id)
    })
  }, [session, status, router, params])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user/me")
      if (response.ok) {
        const data = await response.json()
        if (data.role !== "ADMIN" && data.role !== "MODERATOR") {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Failed to check role:", error)
      router.push("/dashboard")
    }
  }

  const fetchTicket = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/staff/tickets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      } else if (response.status === 404) {
        router.push("/staff")
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error)
      router.push("/staff")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResponse.trim()) return

    setSubmittingResponse(true)
    try {
      const response = await fetch(`/api/staff/tickets/${ticketId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newResponse.trim() }),
      })

      if (response.ok) {
        setNewResponse("")
        fetchTicket(ticketId)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to submit response")
      }
    } catch (error) {
      console.error("Error submitting response:", error)
      alert("Failed to submit response")
    } finally {
      setSubmittingResponse(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/staff/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTicket(ticketId)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "staff-pill staff-pill--urgent"
      case "high":
        return "staff-pill staff-pill--high"
      case "medium":
        return "staff-pill staff-pill--medium"
      case "low":
        return "staff-pill staff-pill--low"
      default:
        return "staff-pill staff-pill--default"
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "open":
        return "staff-pill staff-pill--open"
      case "in_progress":
        return "staff-pill staff-pill--in_progress"
      case "resolved":
        return "staff-pill staff-pill--resolved"
      case "closed":
        return "staff-pill staff-pill--closed"
      default:
        return "staff-pill staff-pill--default"
    }
  }

  if (status === "loading" || loading) {
    return (
      <MarketingStaffLayout backHref="/staff" backLabel="Back to Staff">
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400/80 mx-auto" />
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingStaffLayout>
    )
  }

  if (!ticket) {
    return (
      <MarketingStaffLayout backHref="/staff" backLabel="Back to Staff" title="Ticket not found">
        <div className="listing-empty text-center py-12">
          <p className="mb-4">This ticket could not be found.</p>
          <Link href="/staff" className="staff-link">
            Return to staff dashboard
          </Link>
        </div>
      </MarketingStaffLayout>
    )
  }

  return (
    <MarketingStaffLayout
      title={ticket.title}
      subtitle={`${CATEGORIES[ticket.category]} · ${ticket.user.name || ticket.user.email}`}
      backHref="/staff"
      backLabel="Back to Staff"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={getStatusClass(ticket.status)}>{STATUSES[ticket.status]}</span>
        <span className={getPriorityClass(ticket.priority)}>{PRIORITIES[ticket.priority]} priority</span>
        <select
          value={ticket.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updatingStatus}
          className="staff-select ml-auto"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {updatingStatus && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400/80" aria-hidden />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="listing-card p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 pt-4 border-t border-gray-200 mt-4">
              <span>Created by {ticket.user.name}</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              <span>Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="listing-card p-6">
            <h2 className="text-lg font-semibold mb-4">Responses ({ticket.responses.length})</h2>
            {ticket.responses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No responses yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.responses.map((response) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-lg ${
                      response.isStaff ? "ticket-response--staff" : "ticket-response--user"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{response.user.name}</span>
                        {response.isStaff && (
                          <span className="ticket-pill ticket-pill--staff">Staff</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(response.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{response.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="listing-card p-6">
            <h2 className="text-lg font-semibold mb-4">Staff response</h2>
            <form onSubmit={handleSubmitResponse}>
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                rows={4}
                placeholder="Type your response as staff..."
                className="staff-input resize-none"
                required
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={submittingResponse || !newResponse.trim()}
                  className="btn-server-pledge btn-server-pledge--primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResponse ? "Submitting..." : "Submit staff response"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="listing-card p-6">
            <h3 className="text-lg font-semibold mb-4">User information</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd>{ticket.user.name || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd>{ticket.user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">User ID</dt>
                <dd className="font-mono text-xs break-all">{ticket.user.id}</dd>
              </div>
            </dl>
            <Link href={`/users/${ticket.user.id}`} className="staff-link inline-block mt-4 text-sm">
              View user profile →
            </Link>
          </div>

          <div className="listing-card p-6">
            <h3 className="text-lg font-semibold mb-4">Ticket information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Category</dt>
                <dd>{CATEGORIES[ticket.category]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Priority</dt>
                <dd>{PRIORITIES[ticket.priority]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd>{STATUSES[ticket.status]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Responses</dt>
                <dd>{ticket.responses.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Created</dt>
                <dd>{new Date(ticket.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Updated</dt>
                <dd>{new Date(ticket.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </MarketingStaffLayout>
  )
}
