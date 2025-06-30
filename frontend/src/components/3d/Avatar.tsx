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
    // Stop current animations
    Object.values(actions).forEach(action => action?.stop());
    
    // Play new animation
    const action = actions[avatarState.animation];
    action?.reset().fadeIn(0.2).play();
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

    // Remove floating effect for current user when in first person
    if (isCurrentUser && !avatarState.is_first_person) {
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
      onClick={onClick}
      position={[avatarState.position.x, avatarState.position.y, avatarState.position.z]}
      rotation={[0, avatarState.rotation, 0]}
    >
      {/* Avatar model - hide if current user and in first person */}
      {!(isCurrentUser && avatarState.is_first_person) && (
        <primitive 
          object={scene.clone()} 
          scale={[1, 1, 1]}
        />
      )}
      
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

// Dummy Avatar component - fallback/default avatar for first-person mode
interface DummyAvatarProps {
  position?: [number, number, number];
  color?: string;
  name?: string;
  isCurrentUser?: boolean;
  isControllable?: boolean;
  isFirstPerson?: boolean;
  onClick?: () => void;
  movementState?: {
    isMoving: boolean;
    speed: number;
    position: [number, number, number];
  };
}

export const DummyAvatar: React.FC<DummyAvatarProps> = ({ 
  position = [0, 0, 0],
  name = "Player",
  isCurrentUser = false,
  isControllable = false,
  isFirstPerson = false,
  onClick,
  movementState
}) => {
  const avatarRef = useRef<THREE.Group>(null);
  const currentPosition = movementState?.position || position;
  const isMoving = movementState?.isMoving || false;
  const movementSpeed = movementState?.speed || 0;

  // Animation calculations for first person arms
  const walkCycle = Date.now() * 0.01 * (movementSpeed + 1);
  const armSwing = isMoving ? Math.sin(walkCycle) * 0.3 : 0;

  // Animation frame for avatar floating and body animations
  useFrame((state) => {
    if (!isFirstPerson && avatarRef.current) {
      // Floating animation for third person
      const baseY = position[1];
      avatarRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      avatarRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (isFirstPerson) {
    return (
      <group position={currentPosition} onClick={onClick} scale={0.15}>
        {/* First person view - only show arms/hands in front of camera */}
        <group position={[0, 2.5, 0.8]} scale={1.5}>
          {/* First Person Arms/Hands - positioned relative to camera */}
          <group position={[0, 0, 0]}>
            {/* Left Arm */}
            <group 
              position={[-0.35, -0.2, 0]} 
              rotation={[0.15 + armSwing, 0.25, 0.08]}
            >
              <mesh position={[0, 0, 0.12]} rotation={[0.25, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.035, 0.2, 8]} />
                <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, -0.04, 0.2]} rotation={[0, 0, 0.08]}>
                <boxGeometry args={[0.05, 0.07, 0.1]} />
                <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh 
                  key={`left-finger-${i}`} 
                  position={[-0.02 + (i * 0.012), -0.07, 0.26]} 
                  rotation={[0.08 + (isMoving ? Math.sin(walkCycle + i) * 0.02 : 0), 0, 0]}
                >
                  <cylinderGeometry args={[0.005, 0.005, 0.035, 6]} />
                  <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} />
                </mesh>
              ))}
            </group>

            {/* Right Arm */}
            <group 
              position={[0.35, -0.2, 0]} 
              rotation={[0.15 - armSwing, -0.25, -0.08]}
            >
              <mesh position={[0, 0, 0.12]} rotation={[0.25, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.035, 0.2, 8]} />
                <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, -0.04, 0.2]} rotation={[0, 0, -0.08]}>
                <boxGeometry args={[0.05, 0.07, 0.1]} />
                <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh 
                  key={`right-finger-${i}`} 
                  position={[-0.02 + (i * 0.012), -0.07, 0.26]} 
                  rotation={[0.08 + (isMoving ? Math.sin(walkCycle + i + 2) * 0.02 : 0), 0, 0]}
                >
                  <cylinderGeometry args={[0.005, 0.005, 0.035, 6]} />
                  <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
        
        {/* Full body (invisible in first person but present for physics/collision) */}
        <group visible={false}>
          {/* Chess Wizard Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
            <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} clearcoat={0.5} />
          </mesh>
          
          {/* Other body parts hidden but present */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} clearcoat={0.3} />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group ref={avatarRef} position={currentPosition} onClick={onClick} scale={0.15}>
      {/* Chess Wizard Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
        <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} clearcoat={0.5} />
      </mesh>

      {/* Wizard Head */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial color="#fbbf24" roughness={0.4} metalness={0.0} clearcoat={0.3} />
      </mesh>

      {/* Wizard Hat */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshPhysicalMaterial color="#4c1d95" roughness={0.2} metalness={0.3} clearcoat={0.7} />
      </mesh>

      {/* Wizard Staff (in right hand) */}
      <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
        <meshPhysicalMaterial color="#8b4513" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Staff Crystal */}
      <mesh position={[0.35, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshPhysicalMaterial color="#60a5fa" emissive="#1e40af" emissiveIntensity={0.2} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} />
      </mesh>

      <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshPhysicalMaterial color="#8b5a3c" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Wizard Robe Cape */}
      <mesh position={[0, -0.1, -0.1]} castShadow>
        <coneGeometry args={[0.25, 0.4, 8]} />
        <meshPhysicalMaterial color="#4c1d95" roughness={0.4} metalness={0.0} />
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

      {/* Control indicator */}
      {isControllable && !isFirstPerson && (
        <Text
          position={[0, 1.3, 0]}
          fontSize={0.1}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          WASD to move • TAB to switch to first person
        </Text>
      )}
    </group>
  );
};


