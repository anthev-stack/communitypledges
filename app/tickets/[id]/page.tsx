"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
  user: {
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

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [newResponse, setNewResponse] = useState("")
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [ticketId, setTicketId] = useState<string>("")

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }

    params.then((p) => {
      setTicketId(p.id)
      fetchTicket(p.id)
    })
  }, [session, status, router, params])

  const fetchTicket = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      } else if (response.status === 404) {
        router.push("/tickets")
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error)
      router.push("/tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResponse.trim()) return

    setSubmittingResponse(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/responses`, {
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

  if (status === "loading" || loading) {
    return (
      <MarketingTicketsLayout title="Ticket" backHref="/tickets">
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingTicketsLayout>
    )
  }

  if (!ticket) {
    return (
      <MarketingTicketsLayout title="Ticket not found" backHref="/tickets">
        <div className="listing-card p-8 text-center">
          <p className="text-gray-400 mb-4">This ticket could not be found.</p>
        </div>
      </MarketingTicketsLayout>
    )
  }

  return (
    <MarketingTicketsLayout title={ticket.title} backHref="/tickets">
      <div className="listing-card p-6 md:p-8 max-w-4xl mx-auto space-y-0">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={getTicketStatusClass(ticket.status)}>{STATUSES[ticket.status]}</span>
          <span className={getTicketPriorityClass(ticket.priority)}>
            {PRIORITIES[ticket.priority]} priority
          </span>
          <span className="text-sm text-gray-400">{CATEGORIES[ticket.category]}</span>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
            <span>Created by {ticket.user.name}</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            <span>Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="settings-panel-divider">
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
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{response.user.name}</span>
                      {response.isStaff && (
                        <span className="ticket-pill ticket-pill--staff">Staff</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{response.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {ticket.status !== "closed" ? (
          <div className="settings-panel-divider">
            <h2 className="text-lg font-semibold mb-4">Add response</h2>
            <form onSubmit={handleSubmitResponse}>
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                rows={4}
                placeholder="Type your response here..."
                className="w-full px-4 py-3 rounded-lg resize-none"
                required
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={submittingResponse || !newResponse.trim()}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {submittingResponse ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden />
                      Submitting...
                    </>
                  ) : (
                    "Submit response"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="settings-panel-divider text-center text-gray-400 text-sm">
            This ticket is closed and no longer accepting responses.
          </div>
        )}
      </div>
    </MarketingTicketsLayout>
  )
}
