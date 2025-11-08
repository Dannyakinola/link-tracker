    import React, { useState, useEffect } from 'react'
    import { analyticsAPI } from '../services/api'
    import { Link } from 'react-router-dom'

    const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('7d')

    useEffect(() => {
        fetchAnalytics()
    }, [period])

    const fetchAnalytics = async () => {
        try {
        setLoading(true)
        const response = await analyticsAPI.getDashboard({ period })
        if (response.data.success) {
            setAnalytics(response.data.data)
        }
        } catch (error) {
        console.error('Error fetching analytics:', error)
        } finally {
        setLoading(false)
        }
    }

    if (loading) {
        return (
        <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading dashboard...</div>
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1"
            >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            </select>
        </div>

        {analytics && (
            <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">L</span>
                    </div>
                    </div>
                    <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Links</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.summary.active_links}</p>
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">C</span>
                    </div>
                    </div>
                    <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.summary.total_clicks}</p>
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">U</span>
                    </div>
                    </div>
                    <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.summary.unique_visitors}</p>
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">%</span>
                    </div>
                    </div>
                    <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unique Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.summary.unique_rate}%</p>
                    </div>
                </div>
                </div>
            </div>

            {/* Top Campaigns */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Campaigns</h3>
                </div>
                <div className="p-6">
                {analytics.campaigns.length > 0 ? (
                    <div className="space-y-4">
                    {analytics.campaigns.slice(0, 5).map((campaign, index) => (
                        <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                            </span>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                            {campaign.campaign}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{campaign.clicks} clicks</p>
                            <p className="text-xs text-gray-500">{campaign.unique_clicks} unique</p>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No campaign data available</p>
                )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                    to="/links"
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                    <h4 className="font-medium text-gray-900">Create New Link</h4>
                    <p className="text-sm text-gray-500 mt-1">Generate a new trackable link</p>
                    </Link>
                    <Link
                    to="/analytics"
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                    <h4 className="font-medium text-gray-900">View Analytics</h4>
                    <p className="text-sm text-gray-500 mt-1">Detailed analytics and reports</p>
                    </Link>
                </div>
                </div>
            </div>
            </>
        )}
        </div>
    )
    }

    export default Dashboard