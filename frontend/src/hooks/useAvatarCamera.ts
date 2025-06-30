import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export interface FirstPersonState {
  position: [number, number, number];
  isMoving: boolean;
  speed: number;
}

export const useFirstPersonCamera = (
  enabled: boolean = false,
  onStateChange?: (state: FirstPersonState) => void,
  initialPosition: [number, number, number] = [3, 0.8, 3]
) => {
  const { camera, gl } = useThree();
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const [position, setPosition] = useState<[number, number, number]>(initialPosition);
  const [isMoving, setIsMoving] = useState(false);
  const velocityRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());
  const isPointerLocked = useRef(false);
  
  const keysRef = useRef({
    w: false,
    s: false,
    a: false,
    d: false,
    shift: false,
  });

  // Mouse and keyboard controls
  useEffect(() => {
    if (!enabled) {
      // Reset pointer lock when disabled
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
      return;
    }

    // Small delay to ensure proper initialization
    const initTimeout = setTimeout(() => {
      // Compute initial camera rotation to face board center
      const initDir = new THREE.Vector3(
        -initialPosition[0],
        0,
        -initialPosition[2]
      ).normalize();
      // Yaw angle from -Z axis
      rotationRef.current.yaw = Math.atan2(initDir.x, initDir.z);
      rotationRef.current.pitch = 0;
    }, 100);

    const handleMouseMove = (event: MouseEvent) => {
      // Only process mouse movement if we have pointer lock
      if (document.pointerLockElement === gl.domElement) {
        const sensitivity = 0.002; // Adjust sensitivity for better control
        rotationRef.current.yaw -= event.movementX * sensitivity;
        rotationRef.current.pitch -= event.movementY * sensitivity;
        
        // Restrict pitch to human FOV limits  
        rotationRef.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationRef.current.pitch));
        
        // Log mouse movement for debugging
        if (Math.abs(event.movementX) > 0 || Math.abs(event.movementY) > 0) {
          console.log('Mouse movement detected:', event.movementX, event.movementY, 'New rotation:', rotationRef.current.yaw.toFixed(3), rotationRef.current.pitch.toFixed(3));
        }
        
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleCanvasClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock().then(() => {
          console.log('Pointer lock requested successfully');
        }).catch((error) => {
          console.error('Pointer lock request failed:', error);
        });
      }
    };

    const handlePointerLockChange = () => {
      const hasLock = document.pointerLockElement === gl.domElement;
      isPointerLocked.current = hasLock;
      console.log('Pointer lock changed:', hasLock ? 'LOCKED' : 'UNLOCKED');
    };

    const handlePointerLockError = () => {
      // Handle pointer lock errors silently
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': keysRef.current.w = true; break;
        case 'KeyS': keysRef.current.s = true; break;
        case 'KeyA': keysRef.current.a = true; break;
        case 'KeyD': keysRef.current.d = true; break;
        case 'ShiftLeft': 
        case 'ShiftRight': 
          keysRef.current.shift = true; 
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': keysRef.current.w = false; break;
        case 'KeyS': keysRef.current.s = false; break;
        case 'KeyA': keysRef.current.a = false; break;
        case 'KeyD': keysRef.current.d = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': 
          keysRef.current.shift = false; 
          break;
      }
    };

    // Add event listeners with better management
    gl.domElement.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    
    // Use mousedown instead of click for more reliable pointer lock
    gl.domElement.addEventListener('mousedown', handleCanvasClick);
    
    // Set canvas properties for better pointer lock support
    gl.domElement.style.cursor = 'pointer';
    gl.domElement.tabIndex = 1; // Make canvas focusable
    
    // Focus the canvas to ensure it receives events
    gl.domElement.focus();
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      clearTimeout(initTimeout);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      gl.domElement.removeEventListener('mousedown', handleCanvasClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Exit pointer lock when component unmounts
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    };
  }, [enabled, gl.domElement, initialPosition]);

  // Camera and movement update loop
  useFrame((state, delta) => {
    if (!enabled) return;

    // Always update camera rotation first - this is the key fix!
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotationRef.current.yaw;
    camera.rotation.x = rotationRef.current.pitch;
    camera.rotation.z = 0;

    // Force camera matrix update immediately
    camera.updateMatrixWorld(true);

    // Ensure camera controls are disabled when first person is active
    const orbitControls = (camera as THREE.Camera & { userData?: { orbitControls?: { enabled: boolean } } }).userData?.orbitControls;
    if (orbitControls && enabled) {
      orbitControls.enabled = false;
    }

    // Movement logic
    const direction = new THREE.Vector3();
    const speed = keysRef.current.shift ? 15 : 8; // Faster movement speeds
    const moving = keysRef.current.w || keysRef.current.s || keysRef.current.a || keysRef.current.d;

    if (keysRef.current.w) direction.z -= 1;
    if (keysRef.current.s) direction.z += 1;
    if (keysRef.current.a) direction.x -= 1;
    if (keysRef.current.d) direction.x += 1;

    // Apply movement with smooth velocity
    if (direction.length() > 0) {
      direction.normalize();
      direction.multiplyScalar(speed);
      // Apply camera rotation to movement direction
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationRef.current.yaw);
      targetVelocityRef.current.copy(direction);
    } else {
      targetVelocityRef.current.set(0, 0, 0);
    }

    // Smooth velocity interpolation with more responsive feel
    velocityRef.current.lerp(targetVelocityRef.current, delta * 12);
    
    // Update position
    if (velocityRef.current.length() > 0.01) {
      const newPos = [...position] as [number, number, number];
      newPos[0] += velocityRef.current.x * delta;
      newPos[2] += velocityRef.current.z * delta;
      
      // Boundary checking
      newPos[0] = Math.max(-20, Math.min(20, newPos[0]));
      newPos[2] = Math.max(-20, Math.min(20, newPos[2]));
      
      setPosition(newPos);
      setIsMoving(true);
    } else {
      setIsMoving(false);
    }

    // Camera position with eye height and bobbing
    // Use a fixed eye height to position camera above board surface
    const eyeHeight = 3.0; // Higher eye level for better view of massive board

    let cameraHeightOffset = 0;
    if (moving && velocityRef.current.length() > 0.01) {
      const walkCycle = state.clock.elapsedTime * 8;
      cameraHeightOffset = Math.sin(walkCycle) * 0.05;
    }

    camera.position.set(
      position[0],
      position[1] + eyeHeight + cameraHeightOffset,
      position[2]
    );

    // Notify parent of state changes
    if (onStateChange) {
      onStateChange({
        position,
        isMoving,
        speed: velocityRef.current.length()
      });
    }
  });

  return {
    position,
    isMoving,
    speed: velocityRef.current.length()
  };
};




