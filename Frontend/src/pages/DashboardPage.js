import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI, linksAPI } from '../services/api'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const DashboardPage = () => {
  const [analytics, setAnalytics] = useState(null)
  const [recentLinks, setRecentLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [analyticsResponse, linksResponse] = await Promise.all([
        analyticsAPI.getDashboard({ period }),
        linksAPI.getAll()
      ])

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.data)
      }

      if (linksResponse.data.success) {
        setRecentLinks(linksResponse.data.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const timelineChartData = {
    labels: analytics?.timeline.map(day => day.date) || [],
    datasets: [
      {
        label: 'Total Clicks',
        data: analytics?.timeline.map(day => day.clicks) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Unique Clicks',
        data: analytics?.timeline.map(day => day.unique_clicks) || [],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const deviceChartData = {
    labels: analytics?.devices.map(device => device.device_type) || [],
    datasets: [
      {
        data: analytics?.devices.map(device => device.clicks) || [],
        backgroundColor: [
          'rgb(79, 70, 229)',
          'rgb(14, 165, 233)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
      },
    ],
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
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {analytics && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
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

            <div className="bg-white p-6 rounded-lg shadow-sm border">
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

            <div className="bg-white p-6 rounded-lg shadow-sm border">
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

            <div className="bg-white p-6 rounded-lg shadow-sm border">
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clicks Over Time</h3>
              <Line 
                data={timelineChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Distribution</h3>
              <Doughnut 
                data={deviceChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Recent Links & Top Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Links */}
            <div className="bg-white shadow-sm rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Links</h3>
              </div>
              <div className="p-6">
                {recentLinks.length > 0 ? (
                  <div className="space-y-4">
                    {recentLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {link.campaign_name || 'Unnamed Campaign'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {link.original_url}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">{link.total_clicks}</p>
                          <p className="text-xs text-gray-500">clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No links created yet</p>
                )}
                <div className="mt-4">
                  <Link
                    to="/links"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    View all links →
                  </Link>
                </div>
              </div>
            </div>

            {/* Top Campaigns */}
            <div className="bg-white shadow-sm rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Campaigns</h3>
              </div>
              <div className="p-6">
                {analytics.campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.campaigns.slice(0, 5).map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                            {index + 1}
                          </span>
                          <span className="ml-3 text-sm font-medium text-gray-900 truncate flex-1">
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
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardPage