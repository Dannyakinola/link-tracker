    import React from 'react'
    import { useAuth } from '../contexts/AuthContext'
    import { Link, useLocation } from 'react-router-dom'

    const Header = () => {
    const { user, signOut } = useAuth()
    const location = useLocation()

    const handleSignOut = async () => {
        await signOut()
    }

    const isActive = (path) => location.pathname === path

    return (
        <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                Link Tracker
                </Link>
                <nav className="ml-10 flex space-x-8">
                <Link
                    to="/"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/links"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/links') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    Links
                </Link>
                <Link
                    to="/analytics"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/analytics') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    Analytics
                </Link>
                </nav>
            </div>
            
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user?.email}</span>
                <button
                onClick={handleSignOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                Sign Out
                </button>
            </div>
            </div>
        </div>
        </header>
    )
    }

    export default Header