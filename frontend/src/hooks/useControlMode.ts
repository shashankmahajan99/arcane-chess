import { useState, useEffect, useCallback } from 'react';

export type ControlMode = 'camera' | 'avatar';

export const useControlMode = (initialMode: ControlMode = 'camera') => {
  const [controlMode, setControlMode] = useState<ControlMode>(initialMode);

  const toggleControlMode = useCallback(() => {
    setControlMode(prev => prev === 'camera' ? 'avatar' : 'camera');
  }, []);

  const switchToCamera = useCallback(() => {
    setControlMode('camera');
  }, []);

  const switchToAvatar = useCallback(() => {
    setControlMode('avatar');
  }, []);

  // Handle key press to toggle control modes
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        toggleControlMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleControlMode]);

  return {
    controlMode,
    toggleControlMode,
    switchToCamera,
    switchToAvatar,
    isCameraMode: controlMode === 'camera',
    isAvatarMode: controlMode === 'avatar',
  };
};
