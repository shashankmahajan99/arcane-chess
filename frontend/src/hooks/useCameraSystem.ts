import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface AvatarMovementState {
  position: [number, number, number];
  isMoving: boolean;
  speed: number;
  direction: number; // yaw rotation for avatar body
}

interface CameraSystemProps {
  mode: 'free-camera' | 'first-person';
  onMovementChange?: (state: AvatarMovementState) => void;
  initialPosition?: [number, number, number];
  boardScale?: number;
}

export const useCameraSystem = ({
  mode,
  onMovementChange,
  initialPosition = [7.5, 2, 7.5], // Default position on scaled board
  boardScale = 2.5
}: CameraSystemProps) => {
  const { camera, gl } = useThree();
  
  // Camera rotation (yaw, pitch)
  const rotationRef = useRef({ yaw: -Math.PI / 4, pitch: -0.1 });
  
  // Avatar position and movement
  const [position, setPosition] = useState<[number, number, number]>(initialPosition);
  const velocityRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());
  
  // Input state
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });

  // Mouse control for first-person
  const mouseRef = useRef({ locked: false });

  // Camera bobbing state
  const bobbingRef = useRef({
    time: 0,
    currentIntensity: 0,
    targetIntensity: 0,
    bobOffset: 0,
    headSway: 0,
    lastBobOffset: 0,
    lastHeadSway: 0
  });

  // Initialize camera position and rotation
  useEffect(() => {
    if (mode === 'free-camera') {
      // Set initial camera position for free roam mode but let OrbitControls take over
      camera.position.set(
        initialPosition[0] + 8,
        initialPosition[1] + 12,
        initialPosition[2] + 8
      );
      camera.lookAt(initialPosition[0], initialPosition[1], initialPosition[2]);
      camera.updateMatrixWorld();
      
      // Reset any pointer lock from first-person mode
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      mouseRef.current.locked = false;
    } else {
      // Set camera for first-person mode
      camera.position.set(position[0], position[1] + 2.8, position[2]);
      camera.rotation.order = 'YXZ';
    }
  }, [mode, camera, initialPosition, position]);

  // Mouse movement handler for first-person mode
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (mode !== 'first-person' || !mouseRef.current.locked) return;

    const sensitivity = 0.002;
    rotationRef.current.yaw -= event.movementX * sensitivity;
    rotationRef.current.pitch -= event.movementY * sensitivity;
    
    // Clamp pitch to reasonable values
    rotationRef.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.pitch));
  }, [mode]);

  // Pointer lock handlers
  const handleClick = useCallback(() => {
    if (mode === 'first-person' && !mouseRef.current.locked) {
      gl.domElement.requestPointerLock();
    }
  }, [mode, gl.domElement]);

  const handlePointerLockChange = useCallback(() => {
    mouseRef.current.locked = document.pointerLockElement === gl.domElement;
  }, [gl.domElement]);

  // Keyboard handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keysRef.current.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keysRef.current.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keysRef.current.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keysRef.current.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keysRef.current.run = true;
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keysRef.current.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keysRef.current.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keysRef.current.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keysRef.current.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keysRef.current.run = false;
        break;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    if (mode === 'first-person') {
      gl.domElement.addEventListener('click', handleClick);
      gl.domElement.style.cursor = 'pointer';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      gl.domElement.removeEventListener('click', handleClick);
      
      // Exit pointer lock on cleanup
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [handleMouseMove, handleKeyDown, handleKeyUp, handlePointerLockChange, handleClick, mode, gl.domElement]);

  // Main update loop
  useFrame((state, delta) => {
    // Only handle movement and camera updates in first-person mode
    // In free-camera mode, let OrbitControls handle everything
    if (mode === 'free-camera') {
      // Don't interfere with camera in free-camera mode
      return;
    }

    // First-person mode logic below
    // Calculate movement with improved responsiveness
    const moveSpeed = keysRef.current.run ? 10 : 5;
    const direction = new THREE.Vector3();
    
    if (keysRef.current.forward) direction.z -= 1;
    if (keysRef.current.backward) direction.z += 1;
    if (keysRef.current.left) direction.x -= 1;
    if (keysRef.current.right) direction.x += 1;

    const isMoving = direction.length() > 0;
    
    if (isMoving) {
      direction.normalize();
      // Apply camera rotation to movement direction (for first-person)
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationRef.current.yaw);
      direction.multiplyScalar(moveSpeed);
      targetVelocityRef.current.copy(direction);
    } else {
      targetVelocityRef.current.set(0, 0, 0);
    }

    // Smoother velocity interpolation for more responsive movement
    const lerpFactor = isMoving ? 15 : 20; // Faster acceleration, faster deceleration
    velocityRef.current.lerp(targetVelocityRef.current, Math.min(delta * lerpFactor, 1));

    // Update position with improved movement
    if (velocityRef.current.length() > 0.01) {
      const newPos: [number, number, number] = [
        position[0] + velocityRef.current.x * delta,
        position[1],
        position[2] + velocityRef.current.z * delta
      ];
      
      // Boundary constraints (keep within reasonable area around board)
      const maxDistance = boardScale * 10;
      newPos[0] = Math.max(-maxDistance, Math.min(maxDistance, newPos[0]));
      newPos[2] = Math.max(-maxDistance, Math.min(maxDistance, newPos[2]));
      
      setPosition(newPos);
    }

    // Update first-person camera with ultra-smooth bobbing
    const eyeHeight = 2.8;
    
    // Calculate smooth bobbing with consistent timing
    if (isMoving && velocityRef.current.length() > 0.1) {
      // Update bobbing time with consistent frequency
      const bobFrequency = 4.0; // Fixed frequency for more predictable bobbing
      bobbingRef.current.time += delta * bobFrequency;
      
      // Target intensity based on speed (walking vs running)
      bobbingRef.current.targetIntensity = keysRef.current.run ? 0.025 : 0.015;
      
    } else {
      // Smooth transition to rest when stopping
      bobbingRef.current.targetIntensity = 0;
    }
    
    // Always smooth the intensity regardless of movement state
    bobbingRef.current.currentIntensity = THREE.MathUtils.lerp(
      bobbingRef.current.currentIntensity,
      bobbingRef.current.targetIntensity,
      delta * 6 // Slower, smoother intensity changes
    );
    
    // Calculate bobbing effects
    let newBobOffset = 0;
    let newHeadSway = 0;
    
    if (bobbingRef.current.currentIntensity > 0.001) {
      // Create smooth step pattern using sine wave
      const stepCycle = Math.sin(bobbingRef.current.time);
      const stepIntensity = bobbingRef.current.currentIntensity;
      
      // Vertical bob (main up/down movement) - use absolute value for realistic bounce
      newBobOffset = Math.abs(stepCycle) * stepIntensity;
      
      // Subtle horizontal sway (side to side like real walking)
      newHeadSway = Math.sin(bobbingRef.current.time * 0.5) * stepIntensity * 0.2;
    } else {
      // Fade out when stopping
      bobbingRef.current.time *= 0.95; // Slowly reduce time to prevent sudden stops
    }
    
    // Apply additional smoothing to bobbing values to eliminate jitter
    bobbingRef.current.bobOffset = THREE.MathUtils.lerp(
      bobbingRef.current.lastBobOffset,
      newBobOffset,
      delta * 20 // High lerp factor for smooth transitions
    );
    
    bobbingRef.current.headSway = THREE.MathUtils.lerp(
      bobbingRef.current.lastHeadSway,
      newHeadSway,
      delta * 20
    );
    
    // Store for next frame
    bobbingRef.current.lastBobOffset = bobbingRef.current.bobOffset;
    bobbingRef.current.lastHeadSway = bobbingRef.current.headSway;
    
    // Calculate final camera position with smooth interpolation
    const targetCameraPos = new THREE.Vector3(
      position[0] + bobbingRef.current.headSway * 0.05, // Reduced side sway
      position[1] + eyeHeight + bobbingRef.current.bobOffset,
      position[2]
    );
    
    // Ultra-smooth camera position updates
    camera.position.lerp(targetCameraPos, delta * 25); // Higher lerp for smoother movement
    
    // Smooth rotation with minimal head movement
    const subtleHeadTilt = bobbingRef.current.currentIntensity > 0.001 ? 
      Math.sin(bobbingRef.current.time * 0.8) * 0.0005 : 0; // Very subtle head tilt
    
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotationRef.current.yaw;
    camera.rotation.x = rotationRef.current.pitch;
    camera.rotation.z = subtleHeadTilt;
    camera.updateMatrixWorld();

    // Notify parent of movement state with actual movement data
    if (onMovementChange) {
      onMovementChange({
        position,
        isMoving,
        speed: velocityRef.current.length(),
        direction: rotationRef.current.yaw
      });
    }
  });

  return {
    position,
    isMoving: velocityRef.current.length() > 0.1,
    speed: velocityRef.current.length(),
    direction: rotationRef.current.yaw,
    isPointerLocked: mouseRef.current.locked
  };
};
