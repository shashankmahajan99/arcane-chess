import React from 'react';
import { useFirstPersonCamera, FirstPersonState } from '../../hooks/useAvatarCamera';
import { useFreeRoamCamera } from '../../hooks/useFreeRoamCamera';

export interface CameraControllerProps {
  controlMode: 'camera' | 'first-person';
  onFirstPersonStateChange?: (state: FirstPersonState) => void;
  initialPosition?: [number, number, number];
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  controlMode, 
  onFirstPersonStateChange,
  initialPosition = [3, 0.8, 3]
}) => {
  // Use first person camera hook when in first-person mode
  useFirstPersonCamera(
    controlMode === 'first-person',
    onFirstPersonStateChange,
    initialPosition
  );

  // Use free roam camera hook when in camera mode
  useFreeRoamCamera(controlMode === 'camera');

  // This component doesn't render anything, it just manages camera controls
  return null;
};
