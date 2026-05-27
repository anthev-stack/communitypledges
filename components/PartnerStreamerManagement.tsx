'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Edit2, Trash2, Star, CheckCircle, XCircle, Info } from 'lucide-react'

interface PartnerStreamer {
  id: string
  username: string
  displayName: string
  priority: number
  isActive: boolean
  createdAt: string
  addedByUser: {
    id: string
    name: string | null
    email: string | null
  }
}

export default function PartnerStreamerManagement() {
  const [streamers, setStreamers] = useState<PartnerStreamer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    priority: 0,
    isActive: true
  })

  useEffect(() => {
    fetchStreamers()
  }, [])

  const fetchStreamers = async () => {
    try {
      const response = await fetch('/api/admin/partner-streamers')
      const data = await response.json()
      
      if (response.ok) {
        setStreamers(data)
      } else {
        setError(data.error || 'Failed to load streamers')
      }
    } catch (err) {
      setError('Failed to load streamers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingId 
        ? `/api/admin/partner-streamers/${editingId}`
        : '/api/admin/partner-streamers'
      
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save streamer')
        return
      }

      // Reset form and refresh list
      setFormData({ username: '', displayName: '', priority: 0, isActive: true })
      setShowAddForm(false)
      setEditingId(null)
      fetchStreamers()
    } catch (err) {
      setError('Something went wrong')
    }
  }

  const handleEdit = (streamer: PartnerStreamer) => {
    setFormData({
      username: streamer.username,
      displayName: streamer.displayName,
      priority: streamer.priority,
      isActive: streamer.isActive
    })
    setEditingId(streamer.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner streamer?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/partner-streamers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchStreamers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete streamer')
      }
    } catch (err) {
      setError('Failed to delete streamer')
    }
  }

  const cancelForm = () => {
    setFormData({ username: '', displayName: '', priority: 0, isActive: true })
    setShowAddForm(false)
    setEditingId(null)
    setError('')
  }

  if (loading) {
    return (
      <div className="listing-loading text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-400/80 mx-auto" />
        <p className="mt-4 text-sm">Loading streamers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Partner Streamers</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage Twitch streamers that appear on the homepage when live
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-server-pledge btn-server-pledge--primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Streamer</span>
        </button>
      </div>

      <div className="staff-callout">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-300" />
          <div className="text-sm">
            <p className="font-semibold mb-1">How priority works</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Higher priority (0-1000) = shown first when multiple streamers are live</li>
              <li>Only active streamers are checked for live status</li>
              <li>The homepage checks for live streamers every 2 minutes</li>
              <li>Only one streamer displays at a time (highest priority)</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="staff-pill staff-pill--banned w-full text-center py-3 px-4">{error}</div>
      )}

      {showAddForm && (
        <div className="listing-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Streamer' : 'Add New Streamer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                  Twitch Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  required
                  disabled={!!editingId}
                  placeholder="e.g., hrry (lowercase, no @)"
                  className="staff-input disabled:opacity-60"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase only, no @ symbol</p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-600 mb-1">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  placeholder="e.g., HRRY"
                  className="staff-input"
                />
                <p className="text-xs text-gray-500 mt-1">How it appears on site</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-600 mb-1">
                  Priority (0-1000)
                </label>
                <input
                  id="priority"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  required
                  className="staff-input"
                />
                <p className="text-xs text-gray-500 mt-1">Higher = shown first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Active Status
                </label>
                <label className="flex items-center space-x-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-500"
                  />
                  <span className="text-sm text-gray-600">Active (shown when live)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-server-pledge btn-server-pledge--primary">
                {editingId ? "Update Streamer" : "Add Streamer"}
              </button>
              <button type="button" onClick={cancelForm} className="btn-server-pledge btn-server-pledge--secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="listing-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold">Partner Streamers ({streamers.length})</h3>
        </div>

        {streamers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No partner streamers added yet</p>
            <p className="text-sm mt-1">Click &quot;Add Streamer&quot; to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {streamers.map((streamer) => (
              <div key={streamer.id} className="p-4 transition hover:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-950/60 border border-red-900/40">
                      <Play className="w-5 h-5 text-red-300" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{streamer.displayName}</h4>
                        {streamer.isActive ? (
                          <span title="Active">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </span>
                        ) : (
                          <span title="Inactive">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">@{streamer.username}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="staff-pill staff-pill--medium inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {streamer.priority}
                      </span>

                      <div className="text-xs text-gray-500">
                        Added by {streamer.addedByUser.name || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(streamer)}
                      className="p-2 text-red-200 hover:bg-white/10 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(streamer.id)}
                      className="p-2 text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

