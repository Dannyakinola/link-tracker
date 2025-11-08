    import axios from 'axios'
    import { supabase } from './supabaseClient'

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

    const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    })

    // Add auth token to requests
    api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
    })

    // Handle auth errors
    api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        supabase.auth.signOut()
        window.location.href = '/login'
        }
        return Promise.reject(error)
    }
    )

    export const linksAPI = {
    create: (linkData) => api.post('/links', linkData),
    getAll: () => api.get('/links'),
    getAnalytics: (linkId, params) => api.get(`/links/${linkId}/analytics`, { params }),
    }

    export const analyticsAPI = {
    getDashboard: (params) => api.get('/analytics/dashboard', { params }),
    }

    export default api