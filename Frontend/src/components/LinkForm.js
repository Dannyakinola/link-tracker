    import React, { useState } from 'react'
    import { linksAPI } from '../services/api'

    const LinkForm = ({ onLinkCreated }) => {
    const [formData, setFormData] = useState({
        original_url: '',
        campaign_name: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
        password: '',
        max_clicks: '',
        expires_at: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
        const response = await linksAPI.create(formData)
        if (response.data.success) {
            setMessage('Link created successfully!')
            setFormData({
            original_url: '',
            campaign_name: '',
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            utm_term: '',
            utm_content: '',
            password: '',
            max_clicks: '',
            expires_at: ''
            })
            if (onLinkCreated) {
            onLinkCreated(response.data.data)
            }
        }
        } catch (error) {
        setMessage(error.response?.data?.error || 'Failed to create link')
        } finally {
        setLoading(false)
        }
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Trackable Link</h2>
        
        {message && (
            <div className={`mb-4 p-3 rounded ${
            message.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
            {message}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label htmlFor="original_url" className="block text-sm font-medium text-gray-700">
                Destination URL *
            </label>
            <input
                type="url"
                name="original_url"
                id="original_url"
                required
                value={formData.original_url}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="https://example.com"
            />
            </div>

            <div>
            <label htmlFor="campaign_name" className="block text-sm font-medium text-gray-700">
                Campaign Name
            </label>
            <input
                type="text"
                name="campaign_name"
                id="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Spring Sale Campaign"
            />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="utm_source" className="block text-sm font-medium text-gray-700">
                UTM Source
                </label>
                <input
                type="text"
                name="utm_source"
                id="utm_source"
                value={formData.utm_source}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="google, newsletter, etc."
                />
            </div>

            <div>
                <label htmlFor="utm_medium" className="block text-sm font-medium text-gray-700">
                UTM Medium
                </label>
                <input
                type="text"
                name="utm_medium"
                id="utm_medium"
                value={formData.utm_medium}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="cpc, email, social"
                />
            </div>

            <div>
                <label htmlFor="utm_campaign" className="block text-sm font-medium text-gray-700">
                UTM Campaign
                </label>
                <input
                type="text"
                name="utm_campaign"
                id="utm_campaign"
                value={formData.utm_campaign}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="spring_sale_2024"
                />
            </div>

            <div>
                <label htmlFor="utm_term" className="block text-sm font-medium text-gray-700">
                UTM Term
                </label>
                <input
                type="text"
                name="utm_term"
                id="utm_term"
                value={formData.utm_term}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="keyword"
                />
            </div>

            <div className="col-span-2">
                <label htmlFor="utm_content" className="block text-sm font-medium text-gray-700">
                UTM Content
                </label>
                <input
                type="text"
                name="utm_content"
                id="utm_content"
                value={formData.utm_content}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="logolink, textlink"
                />
            </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Link Password
                </label>
                <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Optional"
                />
            </div>

            <div>
                <label htmlFor="max_clicks" className="block text-sm font-medium text-gray-700">
                Max Clicks
                </label>
                <input
                type="number"
                name="max_clicks"
                id="max_clicks"
                value={formData.max_clicks}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Optional"
                />
            </div>

            <div>
                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
                Expires At
                </label>
                <input
                type="datetime-local"
                name="expires_at"
                id="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
            </div>
            </div>

            <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
            {loading ? 'Creating...' : 'Create Trackable Link'}
            </button>
        </form>
        </div>
    )
    }

    export default LinkForm