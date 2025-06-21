
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UserAccount from '@/components/UserAccount';

const Account = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation back to main menu */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <a href="/" className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors">
                MüllEimer Melder
              </a>
            </div>

            {/* Navigation back to main menu */}
            <nav className="flex items-center space-x-4">
              <a 
                href="/" 
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Zurück zum Hauptmenü
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* User Account Content */}
      <UserAccount />
    </div>
  );
};

export default Account;
