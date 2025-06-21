
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, User, LogIn, Menu, X } from 'lucide-react';
import UserAccount from '@/components/UserAccount';

const Account = () => {
  const { isLoggedIn, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigation = (view: string) => {
    if (view === 'home') {
      navigate('/');
    } else {
      navigate(`/?view=${view}`);
    }
  };

  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between w-full min-h-[48px]">
          {/* Logo - Fixed width to prevent shifting */}
          <div className="flex items-center space-x-2 cursor-pointer w-48 flex-shrink-0" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-green-800 whitespace-nowrap">CleanCity</h1>
          </div>

          {/* Desktop Navigation - Centered with fixed spacing */}
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button 
                onClick={() => handleNavigation('report')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow-md transform transition hover:scale-105"
              >
                Mülleimer melden
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('karte')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Karte
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('home')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Startseite
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('products')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Produkte
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('about')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Über uns
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation('info')}
                className="px-4 py-2 rounded-md transition-colors whitespace-nowrap min-w-[100px] text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                Informationen
              </Button>
            </div>
          </nav>

          {/* User Authentication - Fixed width to prevent shifting */}
          <div className="hidden md:flex items-center justify-end w-48 flex-shrink-0">
            <div className="flex items-center space-x-3">
              {/* User Profile Widget - Current page indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">{user?.username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button - Fixed right position */}
          <div className="md:hidden flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 w-10 h-10"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden bg-white border-t border-green-100 px-4 py-2 shadow-lg mt-4">
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white mb-4 py-3 rounded-md font-semibold"
              onClick={() => { handleNavigation('report'); setShowMenu(false); }}
            >
              Mülleimer melden
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => { handleNavigation('karte'); setShowMenu(false); }}
            >
              Karte
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => { handleNavigation('home'); setShowMenu(false); }}
            >
              Startseite
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => { handleNavigation('products'); setShowMenu(false); }}
            >
              Produkte
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-2 px-4 py-3 rounded-md transition-colors text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => { handleNavigation('about'); setShowMenu(false); }}
            >
              Über uns
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-4 px-4 py-3 rounded-md transition-colors text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => { handleNavigation('info'); setShowMenu(false); }}
            >
              Informationen
            </Button>
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => { handleLogout(); setShowMenu(false); }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      <UserAccount />
    </div>
  );
};

export default Account;
