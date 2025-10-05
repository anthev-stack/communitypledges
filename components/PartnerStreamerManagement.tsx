'use client'

import { useState, useEffect } from 'react'
import { Play, Plus, Edit, Star, Trash2, RefreshCw } from 'lucide-react'

interface PartnerStreamer {
  id: string
  username: string
  displayName: string
  priority: number
  isActive: boolean
  createdAt: string
  addedByUser: {
    id: string
    name: string
    email: string
  }
}

export default function PartnerStreamerManagement() {
  const [streamers, setStreamers] = useState<PartnerStreamer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<PartnerStreamer | null>(null)
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
      setLoading(true)
      const response = await fetch('/api/admin/partner-streamers')
      if (response.ok) {
        const data = await response.json()
        setStreamers(data)
      } else {
        console.error('Failed to fetch streamers')
      }
    } catch (error) {
      console.error('Error fetching streamers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStreamer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/partner-streamers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchStreamers()
        setShowAddForm(false)
        setFormData({ username: '', displayName: '', priority: 0, isActive: true })
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to add streamer')
      }
    } catch (error) {
      console.error('Error adding streamer:', error)
      alert('Failed to add streamer')
    }
  }

  const handleUpdateStreamer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStreamer) return

    try {
      const response = await fetch(`/api/admin/partner-streamers/${editingStreamer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchStreamers()
        setEditingStreamer(null)
        setFormData({ username: '', displayName: '', priority: 0, isActive: true })
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update streamer')
      }
    } catch (error) {
      console.error('Error updating streamer:', error)
      alert('Failed to update streamer')
    }
  }

  const handleDeleteStreamer = async (id: string) => {
    if (!confirm('Are you sure you want to remove this streamer?')) return

    try {
      const response = await fetch(`/api/admin/partner-streamers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchStreamers()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to remove streamer')
      }
    } catch (error) {
      console.error('Error deleting streamer:', error)
      alert('Failed to remove streamer')
    }
  }

  const startEdit = (streamer: PartnerStreamer) => {
    setEditingStreamer(streamer)
    setFormData({
      username: streamer.username,
      displayName: streamer.displayName,
      priority: streamer.priority,
      isActive: streamer.isActive
    })
  }

  const cancelEdit = () => {
    setEditingStreamer(null)
    setShowAddForm(false)
    setFormData({ username: '', displayName: '', priority: 0, isActive: true })
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
          <span className="text-gray-300">Loading partner streamers...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white">Partner Streamers</h3>
              <p className="text-sm text-gray-400 mt-1">
                Manage Twitch streamers who can appear on the homepage when live
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Streamer</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingStreamer) && (
          <div className="px-6 py-4 border-b border-slate-600">
            <h4 className="text-md font-medium text-white mb-4">
              {editingStreamer ? 'Edit Streamer' : 'Add New Streamer'}
            </h4>
            <form onSubmit={editingStreamer ? handleUpdateStreamer : handleAddStreamer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Twitch Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., hrry"
                    required
                    disabled={!!editingStreamer}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., HRRY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priority (0-1000, higher = shown first)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingStreamer ? 'Update Streamer' : 'Add Streamer'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Streamers List */}
        <div className="p-6">
          {streamers.length === 0 ? (
            <div className="text-center py-8">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No partner streamers configured</p>
              <p className="text-sm text-gray-400 mt-1">
                Add streamers to display them on the homepage when they're live
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {streamers.map((streamer) => (
                <div
                  key={streamer.id}
                  className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Play className="w-5 h-5 text-purple-400" />
                        <div>
                          <h4 className="font-medium text-white">{streamer.displayName}</h4>
                          <p className="text-sm text-gray-400">@{streamer.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Priority: {streamer.priority}</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        streamer.isActive 
                          ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-900/20 text-red-400 border border-red-500/30'
                      }`}>
                        {streamer.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(streamer)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                        title="Edit streamer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStreamer(streamer.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Remove streamer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Added by {streamer.addedByUser.name} • {new Date(streamer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="font-medium text-blue-300 mb-2">How Partner Streamers Work</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Only the highest priority live streamer appears on the homepage</li>
          <li>• Streamers are checked every 30 seconds for live status</li>
          <li>• If multiple streamers are live, the one with highest priority is shown</li>
          <li>• Inactive streamers are never displayed, even if live</li>
          <li>• The homepage shows "Community Pledges Partner" branding</li>
        </ul>
      </div>
    </div>
  )
}
