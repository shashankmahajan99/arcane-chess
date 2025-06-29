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
  
  const keysRef = useRef({
    w: false,
    s: false,
    a: false,
    d: false,
    shift: false,
  });

  // Mouse and keyboard controls
  useEffect(() => {
    if (!enabled) return;

    // Compute initial camera rotation to face board center
    const initDir = new THREE.Vector3(
      -initialPosition[0],
      0,
      -initialPosition[2]
    ).normalize();
    // Yaw angle from -Z axis
    rotationRef.current.yaw = Math.atan2(initDir.x, initDir.z);
    rotationRef.current.pitch = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        const sensitivity = 0.002;
        rotationRef.current.yaw -= event.movementX * sensitivity;
        rotationRef.current.pitch -= event.movementY * sensitivity;
        
        // Restrict pitch to human FOV limits
        rotationRef.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationRef.current.pitch));
      }
    };

    const handleClick = () => {
      gl.domElement.requestPointerLock();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': keysRef.current.w = true; break;
        case 'KeyS': keysRef.current.s = true; break;
        case 'KeyA': keysRef.current.a = true; break;
        case 'KeyD': keysRef.current.d = true; break;
        case 'ShiftLeft': keysRef.current.shift = true; break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': keysRef.current.w = false; break;
        case 'KeyS': keysRef.current.s = false; break;
        case 'KeyA': keysRef.current.a = false; break;
        case 'KeyD': keysRef.current.d = false; break;
        case 'ShiftLeft': keysRef.current.shift = false; break;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, gl.domElement, initialPosition]);

  // Camera and movement update loop
  useFrame((state, delta) => {
    if (!enabled) return;

    // Update camera rotation
    camera.rotation.set(rotationRef.current.pitch, rotationRef.current.yaw, 0, 'YXZ');

    // Movement logic
    const direction = new THREE.Vector3();
    const speed = keysRef.current.shift ? 12 : 6;
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

    // Smooth velocity interpolation
    velocityRef.current.lerp(targetVelocityRef.current, delta * 8);
    
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
    const eyeHeight = 1.2; // approximate eye level in world units

    let cameraHeightOffset = 0;
    if (moving && velocityRef.current.length() > 0.01) {
      const walkCycle = state.clock.elapsedTime * 12;
      cameraHeightOffset = Math.sin(walkCycle) * 0.02;
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




