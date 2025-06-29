import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

export const useFreeRoamCamera = (enabled: boolean) => {
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  const velocityRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!enabled) return;

    const { forward, backward, leftward, rightward, run } = get();
    
    const speed = run ? 25 : 15; // Even faster for better navigation
    
    // Calculate target velocity
    targetVelocityRef.current.set(0, 0, 0);

    if (forward) targetVelocityRef.current.z -= 1;
    if (backward) targetVelocityRef.current.z += 1;
    if (leftward) targetVelocityRef.current.x -= 1;
    if (rightward) targetVelocityRef.current.x += 1;

    if (targetVelocityRef.current.length() > 0) {
      targetVelocityRef.current.normalize();
      targetVelocityRef.current.multiplyScalar(speed);
      
      // Apply camera rotation to direction
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const right = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
      
      const movement = new THREE.Vector3()
        .addScaledVector(right, targetVelocityRef.current.x)
        .addScaledVector(cameraDirection, -targetVelocityRef.current.z);
      
      targetVelocityRef.current.copy(movement);
    }

    // Smooth interpolation for movement with better responsiveness
    velocityRef.current.lerp(targetVelocityRef.current, delta * 12);
    
    // Apply movement
    if (velocityRef.current.length() > 0.01) {
      camera.position.add(velocityRef.current.clone().multiplyScalar(delta));
      
      // Boundary checking to keep camera within reasonable bounds
      camera.position.x = Math.max(-50, Math.min(50, camera.position.x));
      camera.position.z = Math.max(-50, Math.min(50, camera.position.z));
      camera.position.y = Math.max(1, Math.min(30, camera.position.y));
    }
  });
};
