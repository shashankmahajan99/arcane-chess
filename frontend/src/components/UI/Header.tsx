
import React, { useState } from 'react';
import { useAvatarStore } from '../../stores/avatarStore';
import { useAuthStore } from '../../stores/authStore';
import { Settings } from './Settings';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { myAvatar } = useAvatarStore();
  const { 
    isAuthenticated, 
    user, 
    showLogin, 
    showRegister, 
    logout 
  } = useAuthStore();

  return (
    <>
      <header className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-blue-400">Arcane Chess</div>
          <div className="ml-4 text-sm text-gray-400">
            {isAuthenticated ? (
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Online
              </span>
            ) : (
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Guest Mode
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            // Authenticated user display
            <>
              {user && (
                <div className="flex items-center">
                  {myAvatar?.thumbnail ? (
                    <img 
                      src={myAvatar.thumbnail} 
                      alt="My Avatar" 
                      className="w-10 h-10 rounded-full mr-3 border-2 border-blue-400" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mr-3 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="font-semibold text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">Rating: {user.rating || 1200}</div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Settings
              </button>
              
              <button 
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            // Guest user display
            <>
              <div className="text-center">
                <div className="text-yellow-300 text-sm font-medium">Limited Features in Guest Mode</div>
                <div className="text-xs text-gray-400">Sign in for full experience</div>
              </div>
              
              <button 
                onClick={showLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Sign In
              </button>
              
              <button 
                onClick={showRegister}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Sign Up
              </button>
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
            </>
          )}
        </div>
      </header>
      
      {/* Modals */}
      <LoginModal />
      <RegisterModal />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
