    import React from 'react'
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
    import { AuthProvider, useAuth } from './contexts/AuthContext'
    import Header from './components/Header'
    import Login from './components/Login'
    import Dashboard from './components/Dashboard'
    import LinkForm from './components/LinkForm'
    import Analytics from './components/Analytics'
    import './App.css'

    const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }
    
    return user ? children : <Navigate to="/login" />
    }

    const AppContent = () => {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50">
        {user && <Header />}
        <main className={user ? 'py-6' : ''}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
                <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to="/" />} 
                />
                <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                    <Dashboard />
                    </ProtectedRoute>
                } 
                />
                <Route 
                path="/links" 
                element={
                    <ProtectedRoute>
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900">Manage Links</h1>
                        <LinkForm />
                    </div>
                    </ProtectedRoute>
                } 
                />
                <Route 
                path="/analytics" 
                element={
                    <ProtectedRoute>
                    <Analytics />
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