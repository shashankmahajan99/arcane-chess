import React from 'react';
import { DEFAULT_AVATARS, AvatarConfig } from './AvatarConfig';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onAvatarChange: (avatarKey: string, config: AvatarConfig) => void;
  className?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onAvatarChange,
  className = ""
}) => {
  const avatarKeys = Object.keys(DEFAULT_AVATARS);

  return (
    <div className={`bg-black bg-opacity-70 text-white p-4 rounded-lg backdrop-blur-sm ${className}`}>
      <h3 className="text-sm font-bold mb-3 text-center">Choose Your Avatar</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {avatarKeys.map((key) => {
          const config = DEFAULT_AVATARS[key];
          const isSelected = selectedAvatar === key;
          
          return (
            <button
              key={key}
              onClick={() => onAvatarChange(key, config)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-xs
                ${isSelected 
                  ? 'border-blue-400 bg-blue-500 bg-opacity-20 text-blue-300' 
                  : 'border-gray-600 bg-gray-700 bg-opacity-50 text-gray-300 hover:border-gray-400 hover:bg-gray-600 hover:bg-opacity-70'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                {/* Avatar preview (colored circle representing the avatar) */}
                <div 
                  className="w-8 h-8 rounded-full border-2"
                  style={{ 
                    backgroundColor: config.primaryColor,
                    borderColor: config.secondaryColor
                  }}
                />
                
                <div className="font-semibold capitalize">{key}</div>
                
                <div className="text-xs text-gray-400 text-center">
                  {config.weapon !== 'none' && (
                    <span className="block">{config.weapon}</span>
                  )}
                  <span className="block">{config.outfit}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Current avatar info */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="text-xs text-gray-300 text-center">
          <strong className="text-white capitalize">{selectedAvatar}</strong>
          <br />
          {DEFAULT_AVATARS[selectedAvatar]?.outfit} • {DEFAULT_AVATARS[selectedAvatar]?.weapon}
          <br />
          <span className="text-yellow-300">Press 'C' to toggle selector</span>
        </div>
      </div>
    </div>
  );
};
