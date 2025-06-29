import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarState } from '../../types';

interface AvatarProps {
  avatarState: AvatarState;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  avatarState, 
  isCurrentUser = false, 
  onClick 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load avatar model based on type
  const { scene, animations } = useGLTF(`/models/avatars/${avatarState.model_type}.glb`);
  const { actions, mixer } = useAnimations(animations, groupRef);
  
  // Memoized materials based on color scheme
  const materials = useMemo(() => {
    const colorMap: { [key: string]: string } = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#10b981',
      purple: '#8b5cf6',
      gold: '#f59e0b',
      silver: '#6b7280',
      black: '#1f2937',
      white: '#f9fafb',
    };
    
    const baseColor = colorMap[avatarState.color_scheme] || '#3b82f6';
    
    return {
      primary: new THREE.MeshStandardMaterial({ 
        color: baseColor,
        metalness: 0.3,
        roughness: 0.4,
      }),
      secondary: new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(baseColor).multiplyScalar(0.7),
        metalness: 0.5,
        roughness: 0.3,
      }),
      glow: new THREE.MeshBasicMaterial({ 
        color: baseColor,
        transparent: true,
        opacity: 0.3,
      }),
    };
  }, [avatarState.color_scheme]);

  // Handle animations
  useEffect(() => {
    if (actions[avatarState.animation]) {
      // Stop current animations
      Object.values(actions).forEach(action => action?.stop());
      
      // Play new animation
      const action = actions[avatarState.animation];
      action?.reset().fadeIn(0.2).play();
    }
  }, [avatarState.animation, actions]);

  // Handle movement animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update position smoothly
    const targetPos = new THREE.Vector3(
      avatarState.position.x,
      avatarState.position.y,
      avatarState.position.z
    );
    
    groupRef.current.position.lerp(targetPos, delta * 5);
    
    // Update rotation
    const targetRotation = avatarState.rotation;
    const currentRotation = groupRef.current.rotation.y;
    const rotationDiff = targetRotation - currentRotation;
    groupRef.current.rotation.y += rotationDiff * delta * 5;

    // Add floating effect for current user
    if (isCurrentUser) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }

    // Update animation mixer
    mixer.update(delta);
  });

  // Apply materials to the model
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name.includes('primary')) {
            child.material = materials.primary;
          } else if (child.name.includes('secondary')) {
            child.material = materials.secondary;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, materials]);

  if (!avatarState.is_visible) {
    return null;
  }

  return (
    <group 
      ref={groupRef}
      onClick={onClick}
      position={[avatarState.position.x, avatarState.position.y, avatarState.position.z]}
      rotation={[0, avatarState.rotation, 0]}
    >
      {/* Avatar model */}
      <primitive 
        ref={meshRef}
        object={scene.clone()} 
        scale={[1, 1, 1]}
      />
      
      {/* Glow effect for current user */}
      {isCurrentUser && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <primitive object={materials.glow} />
        </mesh>
      )}
      
      {/* Name tag */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color={isCurrentUser ? '#10b981' : '#6b7280'}
        anchorX="center"
        anchorY="middle"
      >
        {avatarState.user_id}
      </Text>
      
      {/* Selection indicator */}
      {isCurrentUser && (
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.2, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

// Preload avatar models
useGLTF.preload('/models/avatars/wizard.glb');
useGLTF.preload('/models/avatars/knight.glb');
useGLTF.preload('/models/avatars/dragon.glb');
useGLTF.preload('/models/avatars/archer.glb');
useGLTF.preload('/models/avatars/mage.glb');
useGLTF.preload('/models/avatars/warrior.glb');
