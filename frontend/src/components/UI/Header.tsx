
import React, { useState } from 'react';
import { useAvatarStore } from '../../stores/avatarStore';
import { Settings } from './Settings';

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { myAvatar } = useAvatarStore();

  return (
    <>
      <header className="bg-gray-800 bg-opacity-50 p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-20">
        <div className="text-2xl font-bold text-blue-400">Arcane Chess</div>
        <div className="flex items-center">
          {myAvatar && (
            <div className="flex items-center mr-4">
              <img src={myAvatar.thumbnail} alt="My Avatar" className="w-10 h-10 rounded-full mr-2" />
              <span className="font-semibold">{myAvatar.name}</span>
            </div>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Settings
          </button>
        </div>
      </header>
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
