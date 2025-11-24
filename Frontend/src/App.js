    import React, { useEffect, useState } from 'react'
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
    import { AuthProvider, useAuth } from './contexts/AuthContext'
    import Header from './components/Header'
    import Login from './components/Login'
    import DashboardPage from './components/DashboardPage'
    import LinksPage from './components/LinksPage'
    import AnalyticsPage from './components/AnalyticsPage'
    import { testConnection } from './services/api'
    import './App.css'

    const ConnectionTest = () => {
    const [status, setStatus] = useState('testing')
    const [errorDetails, setErrorDetails] = useState('')
    
    useEffect(() => {
        const checkConnection = async () => {
        try {
            const result = await testConnection()
            setStatus(result.success ? 'connected' : 'error')
            if (!result.success) {
            setErrorDetails(result.error || 'Unknown error')
            }
        } catch (error) {
            setStatus('error')
            setErrorDetails(error.message)
        }
        }
        
        checkConnection()
    }, [])
    
    if (status === 'testing') {
        return (
        <div className="flex items-center justify-center min-h-screen bg-yellow-50">
            <div className="text-center p-6">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-yellow-800 font-medium">Testing backend connection...</p>
            <p className="text-yellow-600 text-sm mt-2">
                Connecting to: {process.env.REACT_APP_API_URL}
            </p>
            </div>
        </div>
        )
    }
    
    if (status === 'error') {
        return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
            <div className="text-center p-6 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Connection Issue</h2>
            <p className="text-red-600 mb-4">
                Unable to connect to the backend server. Please check if the server is running.
            </p>
            <div className="bg-red-100 p-3 rounded mb-4">
                <p className="text-red-800 text-sm font-mono break-all">
                {process.env.REACT_APP_API_URL}
                </p>
                {errorDetails && (
                <p className="text-red-700 text-xs mt-2">{errorDetails}</p>
                )}
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
                Retry Connection
            </button>
            </div>
        </div>
        )
    }
    
    return null
    }

    const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    
    if (loading) {
        return (
        <div className="flex justify-center items-center h-screen">
            <div className="loading-spinner"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
        </div>
        )
    }
    
    return user ? children : <Navigate to="/login" />
    }

    const AppContent = () => {
    const { user } = useAuth()
    const [connectionStatus, setConnectionStatus] = useState('testing')

    useEffect(() => {
        const checkConnection = async () => {
        const result = await testConnection()
        setConnectionStatus(result.success ? 'connected' : 'error')
        }
        
        checkConnection()
    }, [])

    // Show connection test for all users on initial load
    if (connectionStatus === 'testing') {
        return <ConnectionTest />
    }

    return (
        <div className="min-h-screen bg-gray-50">
        {user && <Header />}
        <main className={user ? 'py-6' : ''}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {connectionStatus === 'error' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                    <span className="text-yellow-400 text-xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        Backend Connection Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        <p>
                        Some features may not work properly due to backend connection issues.
                        The team has been notified.
                        </p>
                    </div>
                    </div>
                </div>
                </div>
            )}
            
            <Routes>
                <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to="/" />} 
                />
                <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                    <DashboardPage />
                    </ProtectedRoute>
                } 
                />
                <Route 
                path="/links" 
                element={
                    <ProtectedRoute>
                    <LinksPage />
                    </ProtectedRoute>
                } 
                />
                <Route 
                path="/analytics" 
                element={
                    <ProtectedRoute>
                    <AnalyticsPage />
                    </ProtectedRoute>
                } 
                />
            </Routes>
            </div>
        </main>
        </div>
    )
    }

    function App() {
    return (
        <Router>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
        </Router>
    )
    }

    export default App