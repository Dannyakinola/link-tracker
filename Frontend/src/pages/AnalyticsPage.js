import React, { useState, useEffect } from 'react'
import { analyticsAPI, linksAPI } from '../services/api'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
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
import { Download, Calendar, Filter, Users, MousePointer } from 'lucide-react'

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

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null)
  const [links, setLinks] = useState([])
  const [selectedLink, setSelectedLink] = useState('all')
  const [period, setPeriod] = useState('30d')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [selectedLink, period, dateRange])

  const fetchLinks = async () => {
    try {
      const response = await linksAPI.getAll()
      if (response.data.success) {
        setLinks(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching links:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = { period }
      if (dateRange.start) params.start_date = dateRange.start
      if (dateRange.end) params.end_date = dateRange.end
      if (selectedLink !== 'all') params.link_id = selectedLink

      const response = await analyticsAPI.getDashboard(params)
      if (response.data.success) {
        setAnalytics(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (format) => {
    try {
      const params = { format, period }
      if (dateRange.start) params.start_date = dateRange.start
      if (dateRange.end) params.end_date = dateRange.end
      if (selectedLink !== 'all') params.link_id = selectedLink

      const response = await analyticsAPI.exportData(params)
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  // Chart data configurations
  const timelineChartData = {
    labels: analytics?.timeline.map(day => {
      const date = new Date(day.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }) || [],
    datasets: [
      {
        label: 'Total Clicks',
        data: analytics?.timeline.map(day => day.clicks) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Unique Clicks',
        data: analytics?.timeline.map(day => day.unique_clicks) || [],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const deviceChartData = {
    labels: analytics?.devices.map(device => {
      const type = device.device_type || 'unknown'
      return type.charAt(0).toUpperCase() + type.slice(1)
    }) || [],
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
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const countryChartData = {
    labels: analytics?.countries.map(country => country.country).slice(0, 8) || [],
    datasets: [
      {
        data: analytics?.countries.map(country => country.clicks).slice(0, 8) || [],
        backgroundColor: [
          'rgb(79, 70, 229)',
          'rgb(14, 165, 233)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(249, 115, 22)',
        ],
      },
    ],
  }

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your link performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => exportData('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Link
            </label>
            <select
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Links</option>
              {links.map(link => (
                <option key={link.id} value={link.id}>
                  {link.campaign_name || 'Unnamed Campaign'} ({link.total_clicks || 0} clicks)
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Date Range
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MousePointer className="h-8 w-8 text-indigo-600" />
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
                  <Users className="h-8 w-8 text-blue-600" />
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
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unique Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.summary.unique_rate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Links</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.summary.active_links}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
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
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                    },
                  },
                }}
                height={300}
              />
            </div>

            {/* Devices Chart */}
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
                height={300}
              />
            </div>

            {/* Countries Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
              <Pie 
                data={countryChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
                height={300}
              />
            </div>

            {/* Campaign Performance */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
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
            </div>
          </div>

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Referrers */}
            <div className="bg-white shadow-sm rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Referrers</h3>
              </div>
              <div className="p-6">
                {analytics.sources && analytics.sources.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.sources.slice(0, 8).map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 truncate flex-1">
                          {source.source}
                        </span>
                        <span className="text-sm font-medium text-gray-900 ml-4">
                          {source.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No referrer data available</p>
                )}
              </div>
            </div>

            {/* Countries List */}
            <div className="bg-white shadow-sm rounded-lg border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Countries</h3>
              </div>
              <div className="p-6">
                {analytics.countries && analytics.countries.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.countries.slice(0, 8).map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 flex-1">
                          {country.country}
                        </span>
                        <span className="text-sm font-medium text-gray-900 ml-4">
                          {country.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No country data available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsPage