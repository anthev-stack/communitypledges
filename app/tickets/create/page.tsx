"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import MarketingTicketsLayout from "@/components/marketing/MarketingTicketsLayout"

const CATEGORIES = [
  {
    value: "bug_report",
    label: "Bug Report",
    description: "Report a bug or technical issue",
  },
  {
    value: "feature_request",
    label: "Feature Request",
    description: "Suggest a new feature or improvement",
  },
  {
    value: "support",
    label: "Support",
    description: "Get help with using the platform",
  },
  {
    value: "report_user_server",
    label: "Report User/Server",
    description: "Report inappropriate content or behavior",
  },
  {
    value: "other",
    label: "Other",
    description: "Something else not covered above",
  },
]

const PRIORITIES = [
  { value: "low", label: "Low", description: "Not urgent, can wait" },
  { value: "medium", label: "Medium", description: "Normal priority" },
  { value: "high", label: "High", description: "Important, needs attention soon" },
  { value: "urgent", label: "Urgent", description: "Critical issue, needs immediate attention" },
]

export default function CreateTicketPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    description: "",
  })

  if (status === "loading") {
    return (
      <MarketingTicketsLayout
        title="Create Support Ticket"
        subtitle="Need help? Report a bug? Have a suggestion? We're here to help."
        backHref="/tickets"
      >
        <div className="listing-loading text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </MarketingTicketsLayout>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const ticket = await response.json()
        router.push(`/tickets/${ticket.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create ticket")
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      alert("Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingTicketsLayout
      title="Create Support Ticket"
      subtitle="Need help? Report a bug? Have a suggestion? We're here to help."
      backHref="/tickets"
    >
      <form onSubmit={handleSubmit} className="listing-card p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Brief description of your issue or request"
            className="w-full px-4 py-3 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} — {category.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-2">
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg"
          >
            <option value="">Select priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label} — {priority.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={8}
            maxLength={1000}
            placeholder="Please provide as much detail as possible about your issue or request..."
            className="w-full px-4 py-3 rounded-lg resize-none"
          />
          <p className="text-sm text-gray-400 mt-2">{formData.description.length}/1000 characters</p>
        </div>

        <div className="rounded-lg border border-white/10 p-4 text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Tips for getting help faster</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Be specific about what you&apos;re experiencing</li>
            <li>Include steps to reproduce the issue (for bugs)</li>
            <li>Mention your browser and device if relevant</li>
            <li>Attach screenshots if helpful</li>
          </ul>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden />
                Creating...
              </>
            ) : (
              "Create Ticket"
            )}
          </button>
        </div>
      </form>
    </MarketingTicketsLayout>
  )
}
