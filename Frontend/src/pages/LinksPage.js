import React, { useState, useEffect } from 'react'
import { linksAPI } from '../services/api'
import LinkForm from '../components/LinkForm'
import { Copy, Eye, BarChart3, Lock, Calendar, X } from 'lucide-react'

const LinksPage = () => {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [message, setMessage] = useState('')
  const [bulkImportFile, setBulkImportFile] = useState(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await linksAPI.getAll()
      if (response.data.success) {
        setLinks(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
      setMessage('Failed to load links')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkCreated = (newLink) => {
    setLinks(prev => [newLink, ...prev])
    setShowCreateForm(false)
    setMessage('Link created successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setMessage('Link copied to clipboard!')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleBulkImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'text/csv') {
      setMessage('Please upload a CSV file')
      return
    }

    const formData = new FormData()
    formData.append('csv', file)

    try {
      setLoading(true)
      const response = await linksAPI.bulkImport(formData)
      if (response.data.success) {
        setMessage(`Successfully imported ${response.data.data.summary.successful} links`)
        if (response.data.data.created_links.length > 0) {
          setLinks(prev => [...response.data.data.created_links, ...prev])
        }
        setBulkImportFile(null)
      }
    } catch (error) {
      setMessage('Failed to import links')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isLinkActive = (link) => {
    if (!link.is_active) return false
    if (link.expires_at && new Date(link.expires_at) < new Date()) return false
    if (link.max_clicks && link.total_clicks >= link.max_clicks) return false
    return true
  }

  if (loading && links.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading links...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Links</h1>
        <div className="flex space-x-3">
          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Create Link
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded ${
          message.includes('successfully') || message.includes('copied') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Create New Link</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          <LinkForm onLinkCreated={handleLinkCreated} />
        </div>
      )}

      {/* Links List */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Links ({links.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {links.length > 0 ? (
            links.map((link) => (
              <div key={link.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {link.campaign_name || 'Unnamed Campaign'}
                      </h4>
                      {!isLinkActive(link) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                      {link.password_hash && (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Original:</span>{' '}
                        <a 
                          href={link.original_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 break-all"
                        >
                          {link.original_url}
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">Trackable:</span>{' '}
                        <span className="text-gray-900 break-all">
                          {link.trackable_url || `${window.location.origin}/r/${link.id}`}
                        </span>
                      </p>
                    </div>

                    {/* UTM Parameters */}
                    {(link.utm_source || link.utm_medium || link.utm_campaign) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {link.utm_source && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            source: {link.utm_source}
                          </span>
                        )}
                        {link.utm_medium && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            medium: {link.utm_medium}
                          </span>
                        )}
                        {link.utm_campaign && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            campaign: {link.utm_campaign}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Link Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye size={14} />
                        <span>{link.total_clicks || 0} total clicks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 size={14} />
                        <span>{link.unique_clicks || 0} unique</span>
                      </div>
                      {link.max_clicks && (
                        <div className="flex items-center space-x-1">
                          <span>Max: {link.max_clicks}</span>
                        </div>
                      )}
                      {link.expires_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>Expires: {formatDate(link.expires_at)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span>Created: {formatDate(link.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(link.trackable_url || `${window.location.origin}/r/${link.id}`)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={() => window.open(`/analytics/link/${link.id}`, '_blank')}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <BarChart3 size={14} className="mr-1" />
                      Analytics
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No links yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first trackable link to get started with analytics.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Create Your First Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LinksPage