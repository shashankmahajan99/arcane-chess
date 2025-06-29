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

// Dummy Avatar component - fallback/default avatar when no model is available
interface DummyAvatarProps {
  position?: [number, number, number];
  color?: string;
  name?: string;
  isCurrentUser?: boolean;
  isControllable?: boolean;
  onClick?: () => void;
}

export const DummyAvatar: React.FC<DummyAvatarProps> = ({ 
  position = [0, 0, 0],
  color = "#4f46e5",
  name = "Player",
  isCurrentUser = false,
  isControllable = false,
  onClick
}) => {
  const avatarRef = useRef<THREE.Group>(null);
  const [currentPosition, setCurrentPosition] = React.useState<[number, number, number]>(position);

  useFrame((state) => {
    if (avatarRef.current) {
      // Gentle floating animation
      const baseY = isControllable ? currentPosition[1] : position[1];
      avatarRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Subtle rotation for non-controllable avatars
      if (!isControllable) {
        avatarRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    }
  });

  // Simple movement for controllable avatars
  React.useEffect(() => {
    if (!isControllable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const speed = 0.1;
      const newPos = [...currentPosition] as [number, number, number];

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          newPos[2] -= speed;
          break;
        case 'KeyS':
        case 'ArrowDown':
          newPos[2] += speed;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          newPos[0] -= speed;
          break;
        case 'KeyD':
        case 'ArrowRight':
          newPos[0] += speed;
          break;
      }

      // Boundary checking
      newPos[0] = Math.max(-8, Math.min(8, newPos[0]));
      newPos[2] = Math.max(-8, Math.min(8, newPos[2]));

      setCurrentPosition(newPos);
      
      if (avatarRef.current) {
        avatarRef.current.position.set(newPos[0], newPos[1], newPos[2]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isControllable, currentPosition]);

  return (
    <group 
      ref={avatarRef} 
      position={isControllable ? currentPosition : position} 
      onClick={onClick}
    >
      {/* Avatar Body (Cylinder) */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.5}
        />
      </mesh>

      {/* Avatar Head (Sphere) */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial 
          color="#fbbf24" 
          roughness={0.4}
          metalness={0.0}
          clearcoat={0.3}
        />
      </mesh>

      {/* Hat/Crown */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshPhysicalMaterial 
          color="#dc2626" 
          roughness={0.2}
          metalness={0.3}
          clearcoat={0.7}
        />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Staff/Weapon */}
      <mesh position={[0.35, 0.2, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshPhysicalMaterial 
          color="#8b5cf6" 
          roughness={0.1}
          metalness={0.4}
          clearcoat={0.8}
        />
      </mesh>

      {/* Staff Orb */}
      <mesh position={[0.42, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshPhysicalMaterial 
          color="#06b6d4" 
          roughness={0.0}
          metalness={0.0}
          clearcoat={1.0}
          transmission={0.5}
          opacity={0.8}
          transparent={true}
        />
      </mesh>

      {/* Base/Shadow circle */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.3} 
        />
      </mesh>

      {/* Name tag */}
      {name && (
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.15}
          color={isCurrentUser ? '#10b981' : '#6b7280'}
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      )}

      {/* Glow effect for current user */}
      {isCurrentUser && (
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial 
            color="#10b981"
            transparent 
            opacity={0.2}
          />
        </mesh>
      )}

      {/* Selection indicator */}
      {(isCurrentUser || isControllable) && (
        <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Control indicator for controllable avatars */}
      {isControllable && (
        <Text
          position={[0, 1.3, 0]}
          fontSize={0.1}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          WASD to move • TAB to switch camera
        </Text>
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
