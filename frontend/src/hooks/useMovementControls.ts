import { useEffect, useCallback, useRef } from 'react';
import { useAvatarStore } from '../stores/avatarStore';
import { Vector3 } from '../types';

interface MovementState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shift: boolean; // Run modifier
}

export const useMovementControls = (enabled: boolean = true) => {
  const { 
    myAvatarState, 
    updateMyPosition, 
    setTargetPosition,
    playAnimation,
    movementSpeed 
  } = useAvatarStore();

  const movement = useRef<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        movement.current.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        movement.current.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        movement.current.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        movement.current.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        movement.current.shift = true;
        break;
    }
  }, [enabled]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        movement.current.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        movement.current.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        movement.current.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        movement.current.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        movement.current.shift = false;
        break;
    }
  }, [enabled]);

  // Movement update logic
  const updateMovement = useCallback(() => {
    if (!enabled || !myAvatarState) return;
    const { forward, backward, left, right, shift } = movement.current;
    const isMoving = forward || backward || left || right;
    if (!isMoving) {
      playAnimation('idle');
      return;
    }
    // Calculate movement direction
    let direction: Vector3 = { x: 0, y: 0, z: 0 };
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;
    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }
    // Apply speed and running modifier
    const speed = movementSpeed * (shift ? 1.8 : 1.0) * 0.016; // 60fps normalization
    const newPosition: Vector3 = {
      x: myAvatarState.position.x + direction.x * speed,
      y: myAvatarState.position.y,
      z: myAvatarState.position.z + direction.z * speed,
    };
    // Boundary checking (arena bounds)
    const bounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
    newPosition.x = Math.max(bounds.minX, Math.min(bounds.maxX, newPosition.x));
    newPosition.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newPosition.z));
    // Calculate rotation to face movement direction
    const rotation = Math.atan2(direction.x, direction.z);
    // Update position and animation
    updateMyPosition(newPosition, rotation);
    playAnimation(shift ? 'run' : 'walk');
  }, [enabled, myAvatarState, movementSpeed, updateMyPosition, playAnimation]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Movement update loop
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(updateMovement, 16); // ~60fps
    return () => clearInterval(interval);
  }, [enabled, updateMovement]);

  return {
    isMoving: movement.current.forward || 
              movement.current.backward || 
              movement.current.left || 
              movement.current.right,
    isRunning: movement.current.shift,
  };
};

