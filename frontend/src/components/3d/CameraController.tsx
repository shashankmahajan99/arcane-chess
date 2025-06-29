import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAvatarStore } from '../../stores/avatarStore';

import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControllerProps {
  followAvatar?: boolean;
  enableOrbitControls?: boolean;
  children?: React.ReactNode;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  followAvatar = true,
  enableOrbitControls = true,
  children
}) => {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const { myAvatarState } = useAvatarStore();

  // Camera follow logic
  useFrame((state, delta) => {
    if (followAvatar && myAvatarState && orbitRef.current) {
      // Smooth camera following
      const targetPosition = new THREE.Vector3(
        myAvatarState.position.x,
        myAvatarState.position.y + 2,
        myAvatarState.position.z + 5
      );
      const targetLookAt = new THREE.Vector3(
        myAvatarState.position.x,
        myAvatarState.position.y,
        myAvatarState.position.z
      );
      // Smooth interpolation
      orbitRef.current.target.lerp(targetLookAt, delta * 2);
      camera.position.lerp(targetPosition, delta * 1.5);
    }
  });

  return (
    <>
      {enableOrbitControls && (
        <OrbitControls
          ref={orbitRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={25}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          target={[0, 1, 0]}
          dampingFactor={0.1}
          enableDamping
        />
      )}
      {children}
    </>
  );
};
