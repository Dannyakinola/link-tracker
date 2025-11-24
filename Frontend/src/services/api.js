    import axios from 'axios'
    import { supabase } from './supabaseClient'

    // Use environment variable with fallback
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://link-tracker-yknv.onrender.com'

    console.log('API Base URL:', API_BASE_URL)

    const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased timeout for Render
    withCredentials: false, // Disable credentials for CORS
    headers: {
        'Content-Type': 'application/json',
    }
    })

    // Add auth token to requests
    api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
        console.log('Auth token added to request')
        }
    } catch (error) {
        console.log('No session found or error getting session')
    }
    return config
    })

    // Enhanced error handling
    api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status)
        return response
    },
    async (error) => {
        console.error('API Error:', error.config?.url, error.response?.status, error.message)
        
        if (error.response?.status === 401) {
        console.log('Authentication error, signing out')
        await supabase.auth.signOut()
        window.location.href = '/login'
        }
        
        // Handle network errors
        if (!error.response) {
        const networkError = new Error('Network error. Please check your connection and ensure the backend server is running.')
        networkError.isNetworkError = true
        return Promise.reject(networkError)
        }
        
        // Handle specific error cases
        if (error.response.status >= 500) {
        const serverError = new Error('Server error. Please try again later.')
        serverError.isServerError = true
        return Promise.reject(serverError)
        }
        
        return Promise.reject(error)
    }
    )

    // Test connection
    export const testConnection = async () => {
    try {
        console.log('Testing connection to:', `${API_BASE_URL}/health`)
        const response = await api.get('/health')
        console.log('Connection test successful:', response.data)
        return { success: true, data: response.data }
    } catch (error) {
        console.error('Connection test failed:', error.message)
        return { 
        success: false, 
        error: error.message,
        details: error.response?.data 
        }
    }
    }

    export const linksAPI = {
    create: (linkData) => api.post('/links', linkData),
    getAll: () => api.get('/links'),
    getAnalytics: (linkId, params) => api.get(`/links/${linkId}/analytics`, { params }),
    }

    export const analyticsAPI = {
    getDashboard: (params) => api.get('/analytics/dashboard', { params }),
    exportData: (params) => api.get('/analytics/export', { 
        params,
        responseType: 'blob'
    }),
    }

    // Enhanced API with better error handling
    export const enhancedAPI = {
    async makeRequest(config) {
        try {
        const response = await api(config)
        return { success: true, data: response.data }
        } catch (error) {
        return { 
            success: false, 
            error: error.message,
            status: error.response?.status,
            data: error.response?.data 
        }
        }
    }
    }

    export default api