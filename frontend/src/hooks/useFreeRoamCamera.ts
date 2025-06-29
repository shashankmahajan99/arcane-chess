import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

export const useFreeRoamCamera = (enabled: boolean) => {
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  const direction = new THREE.Vector3();

  useFrame((_, delta) => {
    if (!enabled) return;

    const { forward, backward, leftward, rightward, run } = get();
    
    const speed = run ? 15 : 8;
    
    direction.set(0, 0, 0);

    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (leftward) direction.x -= 1;
    if (rightward) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      direction.multiplyScalar(speed * delta);
      
      // Apply camera rotation to direction
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const right = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
      
      const movement = new THREE.Vector3()
        .addScaledVector(right, direction.x)
        .addScaledVector(cameraDirection, -direction.z);
      
      camera.position.add(movement);
    }
  });
};
