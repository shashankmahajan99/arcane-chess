import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface WizardAvatarProps {
  position: [number, number, number];
  name?: string;
  isCurrentUser?: boolean;
  isFirstPerson?: boolean;
  movementState?: {
    isMoving: boolean;
    speed: number;
    direction?: number; // yaw rotation for body orientation
  };
  colorScheme?: 'blue' | 'red' | 'green' | 'purple' | 'gold';
}

export const WizardAvatar: React.FC<WizardAvatarProps> = ({
  position,
  name = "Wizard",
  isCurrentUser = false,
  isFirstPerson = false,
  movementState,
  colorScheme = 'blue'
}) => {
  const { camera } = useThree();
  const avatarRef = useRef<THREE.Group>(null);
  const staffRef = useRef<THREE.Group>(null);
  const robeRef = useRef<THREE.Group>(null);
  const handsRef = useRef<THREE.Group>(null);
  
  const isMoving = movementState?.isMoving || false;
  const speed = movementState?.speed || 0;
  const direction = movementState?.direction || 0;

  // Color schemes for different wizard types
  const colors = useMemo(() => {
    const schemes = {
      blue: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa', robe: '#1e3a8a' },
      red: { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171', robe: '#991b1b' },
      green: { primary: '#10b981', secondary: '#059669', accent: '#34d399', robe: '#065f46' },
      purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa', robe: '#5b21b6' },
      gold: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24', robe: '#92400e' }
    };
    return schemes[colorScheme];
  }, [colorScheme]);

  // Animation frame for wizard effects and movement
  useFrame((state) => {
    if (!avatarRef.current) return;

    const time = state.clock.elapsedTime;

    // Body orientation based on movement direction
    if (movementState?.direction !== undefined) {
      avatarRef.current.rotation.y = direction;
    }

    // Floating animation (wizards hover slightly)
    const baseY = position[1];
    const floatOffset = Math.sin(time * 2) * 0.05;
    avatarRef.current.position.y = baseY + floatOffset + 0.1;

    // Staff animation - gentle sway
    if (staffRef.current) {
      staffRef.current.rotation.z = Math.sin(time * 1.5) * 0.05;
    }

    // Robe animation - subtle movement
    if (robeRef.current) {
      robeRef.current.rotation.y = Math.sin(time * 2) * 0.02;
    }

    // Walking animation when moving
    if (isMoving && speed > 0.1) {
      const walkCycle = time * 8;
      avatarRef.current.position.y += Math.sin(walkCycle) * 0.02;
    }
  });

  // In first-person mode, show hands/arms in front of camera + visible body below
  if (isFirstPerson) {
    const walkCycle = Date.now() * 0.01 * (speed + 1);
    const armSwing = isMoving ? Math.sin(walkCycle) * 0.1 : 0;
    
    // Calculate hand position relative to camera
    const cameraQuaternion = camera.quaternion.clone();
    const forwardVector = new THREE.Vector3(0, 0, -0.8).applyQuaternion(cameraQuaternion);
    const downVector = new THREE.Vector3(0, -0.3, 0).applyQuaternion(cameraQuaternion);
    
    const handsPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(forwardVector)
      .add(downVector);
    
    return (
      <group>
        {/* First Person Hands/Arms positioned relative to camera */}
        <group 
          ref={handsRef} 
          position={[handsPosition.x, handsPosition.y, handsPosition.z]} 
          rotation={[camera.rotation.x * 0.5, camera.rotation.y, camera.rotation.z]}
          scale={0.4}
        >
          {/* Left Hand with magical energy */}
          <group position={[-1.2, -0.5, 0]} rotation={[0.2 + armSwing, 0.3, 0.1]}>
            {/* Forearm */}
            <mesh position={[0, 0.2, 0]} rotation={[0.1, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.06, 0.4, 8]} />
              <meshPhysicalMaterial color={colors.primary} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.1, 0.1]} rotation={[0, 0, 0.1]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshPhysicalMaterial color="#fbbf24" roughness={0.4} />
            </mesh>
            {/* Fingers */}
            {[0, 1, 2, 3].map((i) => (
              <mesh 
                key={`left-finger-${i}`} 
                position={[-0.08 + (i * 0.04), -0.15, 0.15]} 
                rotation={[0.1 + (isMoving ? Math.sin(walkCycle + i) * 0.03 : 0), 0, 0]}
              >
                <cylinderGeometry args={[0.01, 0.008, 0.06, 6]} />
                <meshPhysicalMaterial color="#fbbf24" roughness={0.4} />
              </mesh>
            ))}
            {/* Enhanced magical sparkles */}
            <mesh position={[0, -0.1, 0.2]}>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshBasicMaterial color={colors.accent} transparent opacity={0.7} />
            </mesh>
          </group>

          {/* Right Hand holding staff */}
          <group position={[1.2, -0.4, 0]} rotation={[0.1 - armSwing, -0.2, -0.1]}>
            {/* Forearm */}
            <mesh position={[0, 0.2, 0]} rotation={[0.1, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.06, 0.4, 8]} />
              <meshPhysicalMaterial color={colors.primary} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.1, 0.1]} rotation={[0, 0, -0.1]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshPhysicalMaterial color="#fbbf24" roughness={0.4} />
            </mesh>
            
            {/* Staff in right hand */}
            <group ref={staffRef} position={[0, -0.4, 0]} rotation={[0.3, 0, 0.05]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.015, 1.8, 8]} />
                <meshPhysicalMaterial color="#8b4513" roughness={0.8} />
              </mesh>
              {/* Enhanced staff crystal for first person */}
              <group position={[0, 0.9, 0]}>
                <mesh>
                  <octahedronGeometry args={[0.08]} />
                  <meshPhysicalMaterial 
                    color={colors.accent} 
                    emissive={colors.secondary} 
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
                {/* Enhanced magical aura */}
                <mesh>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshBasicMaterial 
                    color={colors.accent} 
                    transparent 
                    opacity={0.15}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* Visible body parts in first person */}
        <group position={[position[0], position[1], position[2]]} scale={0.4}>
          {/* Wizard Body/Torso */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
            <meshPhysicalMaterial 
              color={colors.primary} 
              roughness={0.4} 
              metalness={0.1} 
              clearcoat={0.3}
            />
          </mesh>

          {/* Wizard Robe - visible part */}
          <group ref={robeRef} position={[0, -0.1, 0]}>
            <mesh>
              <coneGeometry args={[0.6, 1.0, 8]} />
              <meshPhysicalMaterial 
                color={colors.robe} 
                roughness={0.6} 
                clearcoat={0.1}
              />
            </mesh>
          </group>

          {/* Legs visible when looking down */}
          <group position={[0, -0.8, 0]}>
            <mesh position={[-0.15, 0, 0]} rotation={[isMoving ? Math.sin(walkCycle) * 0.3 : 0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.06, 0.8, 6]} />
              <meshPhysicalMaterial color={colors.primary} roughness={0.4} />
            </mesh>
            <mesh position={[0.15, 0, 0]} rotation={[isMoving ? -Math.sin(walkCycle) * 0.3 : 0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.06, 0.8, 6]} />
              <meshPhysicalMaterial color={colors.primary} roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    );
  }

  // Third person view - full wizard avatar
  return (
    <group ref={avatarRef} position={[position[0], position[1], position[2]]} scale={0.4}>
      {/* Wizard Body */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
        <meshPhysicalMaterial 
          color={colors.primary} 
          roughness={0.4} 
          metalness={0.1} 
          clearcoat={0.3}
        />
      </mesh>

      {/* Wizard Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshPhysicalMaterial 
          color="#fbbf24" 
          roughness={0.5} 
          clearcoat={0.2}
        />
      </mesh>

      {/* Wizard Hat */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.1]}>
        <coneGeometry args={[0.2, 0.6, 8]} />
        <meshPhysicalMaterial 
          color={colors.robe} 
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>

      {/* Beard */}
      <mesh position={[0, 0.6, 0.2]} rotation={[-0.2, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 6]} />
        <meshPhysicalMaterial color="#d4d4d8" roughness={0.8} />
      </mesh>

      {/* Staff */}
      <group ref={staffRef} position={[0.4, 0.3, 0]} rotation={[0, 0, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshPhysicalMaterial color="#8b4513" roughness={0.8} />
        </mesh>
        
        {/* Staff Crystal */}
        <group position={[0, 0.75, 0]}>
          <mesh>
            <octahedronGeometry args={[0.1]} />
            <meshPhysicalMaterial 
              color={colors.accent} 
              emissive={colors.secondary} 
              emissiveIntensity={0.2}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Crystal glow effect */}
          <mesh>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial 
              color={colors.accent} 
              transparent 
              opacity={0.1}
            />
          </mesh>
        </group>
      </group>

      {/* Wizard Robe */}
      <group ref={robeRef} position={[0, -0.3, 0]}>
        <mesh>
          <coneGeometry args={[0.6, 1.0, 8]} />
          <meshPhysicalMaterial 
            color={colors.robe} 
            roughness={0.6} 
            clearcoat={0.1}
          />
        </mesh>
        
        {/* Robe trim */}
        <mesh position={[0, 0.4, 0]}>
          <torusGeometry args={[0.45, 0.02, 8, 16]} />
          <meshPhysicalMaterial 
            color={colors.accent} 
            roughness={0.3} 
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Arms */}
      <mesh position={[-0.35, 0.2, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
        <meshPhysicalMaterial color={colors.primary} roughness={0.4} />
      </mesh>

      <mesh position={[0.35, 0.2, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
        <meshPhysicalMaterial color={colors.primary} roughness={0.4} />
      </mesh>

      {/* Magical Aura Effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial 
          color={colors.accent} 
          transparent 
          opacity={0.05}
        />
      </mesh>

      {/* Name tag */}
      {name && (
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.2}
          color={isCurrentUser ? colors.accent : '#9ca3af'}
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.01}
        >
          {name}
        </Text>
      )}

      {/* Control hints for current user */}
      {isCurrentUser && (
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.12}
          color={colors.accent}
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.005}
        >
          WASD: Move • Tab: Switch View • Click: Cast Spell
        </Text>
      )}
    </group>
  );
};
