import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AvatarConfig } from './AvatarConfig';

interface AvatarBuilderProps {
  config: AvatarConfig;
  position: [number, number, number];
  isFirstPerson?: boolean;
  movementState?: {
    isMoving: boolean;
    speed: number;
    direction: number;
  };
  showNameTag?: boolean;
  name?: string;
}

export const AvatarBuilder: React.FC<AvatarBuilderProps> = ({
  config,
  position,
  isFirstPerson = false,
  movementState,
  showNameTag = true,
  name = "Player"
}) => {
  const { camera } = useThree();
  const avatarRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const handsRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  
  const isMoving = movementState?.isMoving || false;
  const speed = movementState?.speed || 0;
  const direction = movementState?.direction || 0;
  
  // Calculate body proportions based on config
  const scale = config.height;
  const bodyWidth = config.bodyType === 'slim' ? 0.25 : config.bodyType === 'athletic' ? 0.3 : 0.35;
  
  // Animation frame
  useFrame((state) => {
    if (!avatarRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Body orientation based on movement direction (only in third-person)
    if (movementState?.direction !== undefined && !isFirstPerson) {
      avatarRef.current.rotation.y = direction;
    }
    
    // Floating/hovering effect for magical characters
    if (config.walkStyle === 'magical') {
      const floatOffset = Math.sin(time * 2) * 0.025;
      avatarRef.current.position.y = position[1] + floatOffset + 0.05;
    }
    
    // Enhanced walking animation that matches actual movement
    if (isMoving && speed > 0.1) {
      const actualSpeed = Math.min(speed, 8); // Cap the speed for animation
      const walkCycle = time * actualSpeed * 1.5; // Scale animation with actual speed
      
      switch (config.walkStyle) {
        case 'confident':
          if (!isFirstPerson) avatarRef.current.position.y += Math.sin(walkCycle) * 0.018;
          break;
        case 'sneaky':
          if (!isFirstPerson) avatarRef.current.position.y += Math.sin(walkCycle * 1.2) * 0.008;
          break;
        case 'magical':
          if (!isFirstPerson) avatarRef.current.position.y += Math.sin(walkCycle * 0.8) * 0.035;
          break;
        default:
          if (!isFirstPerson) avatarRef.current.position.y += Math.sin(walkCycle) * 0.012;
      }
    }
  });
  
  // First-person view
  if (isFirstPerson) {
    return (
      <FirstPersonAvatar 
        config={config}
        camera={camera}
        isMoving={isMoving}
        speed={speed}
        handsRef={handsRef}
        weaponRef={weaponRef}
      />
    );
  }
  
  // Third-person view
  return (
    <ThirdPersonAvatar 
      config={config}
      position={position}
      scale={scale * 0.25} // Make avatar smaller relative to chess board (0.4x of chess square)
      bodyWidth={bodyWidth}
      avatarRef={avatarRef}
      headRef={headRef}
      bodyRef={bodyRef}
      weaponRef={weaponRef}
      showNameTag={showNameTag}
      name={name}
      isMoving={isMoving}
      speed={speed}
    />
  );
};

// First-person avatar component
const FirstPersonAvatar: React.FC<{
  config: AvatarConfig;
  camera: THREE.Camera;
  isMoving: boolean;
  speed: number;
  handsRef: React.RefObject<THREE.Group>;
  weaponRef: React.RefObject<THREE.Group>;
}> = ({ config, camera, isMoving, speed, handsRef, weaponRef }) => {
  
  // Use useFrame to update hands position smoothly every frame
  useFrame(() => {
    if (!handsRef.current) return;
    
    // Get camera world position and rotation
    const cameraWorldPosition = new THREE.Vector3();
    const cameraWorldQuaternion = new THREE.Quaternion();
    camera.getWorldPosition(cameraWorldPosition);
    camera.getWorldQuaternion(cameraWorldQuaternion);
    
    // Calculate offset position in front of camera (positioned more naturally)
    const forwardOffset = new THREE.Vector3(0, -0.3, -0.5);
    forwardOffset.applyQuaternion(cameraWorldQuaternion);
    
    // Update hands position to follow camera smoothly
    const targetPosition = cameraWorldPosition.clone().add(forwardOffset);
    handsRef.current.position.lerp(targetPosition, 0.12);
    
    // Create a rotation that naturally follows camera direction
    const handRotation = new THREE.Quaternion();
    handRotation.copy(cameraWorldQuaternion);
    
    // Update hands rotation to match camera orientation
    handsRef.current.quaternion.slerp(handRotation, 0.12);
  });
  
  // Calculate smooth walk cycle with realistic timing
  const time = Date.now() * 0.001;
  const walkSpeed = Math.min(speed * 2, 12); // More responsive to movement speed
  const walkCycle = isMoving ? Math.sin(time * walkSpeed) * 0.2 : 0;
  
  // Natural arm swing - opposite to walking pattern
  const leftArmSwing = isMoving ? walkCycle : 0;
  const rightArmSwing = isMoving ? -walkCycle : 0;
  
  return (
    <group>
      {/* First-person hands positioned relative to camera */}
      <group ref={handsRef}>
        {/* Left hand/arm */}
        <group 
          position={[-0.22, 0, 0.15]} 
          rotation={[0.1 + leftArmSwing * 0.2, 0.2, 0.1]}
        >
          <EnhancedHandArm config={config} side="left" isMoving={isMoving} />
        </group>
        
        {/* Right hand/arm with weapon */}
        <group 
          position={[0.22, 0, 0.15]} 
          rotation={[0.1 + rightArmSwing * 0.2, -0.2, -0.1]}
        >
          <EnhancedHandArm config={config} side="right" isMoving={isMoving} />
          {config.weapon !== 'none' && (
            <group ref={weaponRef} position={[0.02, -0.06, 0.08]} rotation={[0.1, 0, 0]}>
              <Weapon type={config.weapon} config={config} scale={0.3} />
            </group>
          )}
        </group>
      </group>
      
      {/* Visible body when looking down - positioned relative to camera */}
      <group position={[0, -1.4, 0]}>
        <FirstPersonBody config={config} />
      </group>
    </group>
  );
};

// Third-person avatar component
const ThirdPersonAvatar: React.FC<{
  config: AvatarConfig;
  position: [number, number, number];
  scale: number;
  bodyWidth: number;
  avatarRef: React.RefObject<THREE.Group>;
  headRef: React.RefObject<THREE.Group>;
  bodyRef: React.RefObject<THREE.Group>;
  weaponRef: React.RefObject<THREE.Group>;
  showNameTag: boolean;
  name: string;
  isMoving: boolean;
  speed: number;
}> = ({ 
  config, 
  position, 
  scale, 
  avatarRef, 
  headRef, 
  bodyRef, 
  weaponRef, 
  showNameTag, 
  name 
}) => {
  return (
    <group ref={avatarRef} position={position} scale={scale}>
      {/* Head */}
      <group ref={headRef} position={[0, 1.7, 0]}>
        <Head config={config} />
      </group>
      
      {/* Body */}
      <group ref={bodyRef} position={[0, 0.8, 0]}>
        <Body config={config} />
      </group>
      
      {/* Arms */}
      <group position={[0, 1.2, 0]}>
        <Arms config={config} />
      </group>
      
      {/* Legs */}
      <group position={[0, 0.4, 0]}>
        <Legs config={config} />
      </group>
      
      {/* Weapon */}
      {config.weapon !== 'none' && (
        <group ref={weaponRef} position={[0.4, 1.0, 0]} rotation={[0, 0, 0.3]}>
          <Weapon type={config.weapon} config={config} />
        </group>
      )}
      
      {/* Hat/Helmet */}
      {config.hat !== 'none' && (
        <group position={[0, 2.0, 0]}>
          <Hat type={config.hat} config={config} />
        </group>
      )}
      
      {/* Name tag */}
      {showNameTag && name && (
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[1, 0.2]} />
          <meshBasicMaterial color={config.primaryColor} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Component parts
const Head: React.FC<{ config: AvatarConfig }> = ({ config }) => (
  <group>
    {/* Base head shape */}
    <mesh>
      <sphereGeometry args={config.headShape === 'round' ? [0.15, 16, 16] : [0.15, 12, 16]} />
      <meshPhysicalMaterial color={config.skinColor} roughness={0.4} />
    </mesh>
    
    {/* Eyes */}
    <mesh position={[-0.05, 0.02, 0.13]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color={config.eyeColor} />
    </mesh>
    <mesh position={[0.05, 0.02, 0.13]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color={config.eyeColor} />
    </mesh>
    
    {/* Hair */}
    {config.hairStyle !== 'bald' && (
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshPhysicalMaterial color={config.hairColor} roughness={0.8} />
      </mesh>
    )}
    
    {/* Facial hair */}
    {config.facialHair !== 'none' && (
      <mesh position={[0, -0.05, 0.12]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshPhysicalMaterial color={config.hairColor} roughness={0.9} />
      </mesh>
    )}
  </group>
);

const Body: React.FC<{ config: AvatarConfig; scale?: number; firstPerson?: boolean }> = ({ 
  config, 
  scale = 1, 
  firstPerson = false 
}) => (
  <group scale={scale}>
    {/* Torso */}
    <mesh>
      <cylinderGeometry args={[0.25, 0.3, 0.8, 8]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
    
    {/* Outfit details */}
    {config.outfit === 'wizard' && (
      <mesh position={[0, -0.2, 0]}>
        <coneGeometry args={[0.4, 0.6, 8]} />
        <meshPhysicalMaterial color={config.secondaryColor} roughness={0.6} />
      </mesh>
    )}
    
    {!firstPerson && (
      <>
        {/* Chest details */}
        <mesh position={[0, 0.2, 0.28]}>
          <boxGeometry args={[0.3, 0.4, 0.05]} />
          <meshPhysicalMaterial color={config.secondaryColor} roughness={0.3} />
        </mesh>
      </>
    )}
  </group>
);

const EnhancedHandArm: React.FC<{ 
  config: AvatarConfig; 
  side: 'left' | 'right';
  isMoving: boolean;
}> = ({ config, side, isMoving }) => {
  const time = Date.now() * 0.001;
  const fingerAnimation = isMoving ? Math.sin(time * 4) * 0.02 : 0;
  const breathingAnimation = Math.sin(time * 3) * 0.005; // Subtle breathing
  
  return (
    <group>
      {/* Upper arm */}
      <mesh position={[0, 0.05, -0.05]} rotation={[0.2, 0, side === 'left' ? 0.05 : -0.05]}>
        <cylinderGeometry args={[0.035, 0.03, 0.14, 8]} />
        <meshPhysicalMaterial color={config.primaryColor} roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Forearm */}
      <mesh position={[0, -0.04, -0.02]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.025, 0.13, 8]} />
        <meshPhysicalMaterial color={config.skinColor} roughness={0.4} />
      </mesh>
      
      {/* Hand - pointing forward naturally */}
      <mesh position={[0, -0.1, 0.02]} rotation={[0, side === 'left' ? 0.1 : -0.1, side === 'left' ? 0.05 : -0.05]}>
        <boxGeometry args={[0.05, 0.02, 0.06]} />
        <meshPhysicalMaterial color={config.skinColor} roughness={0.4} />
      </mesh>
      
      {/* Thumb */}
      <mesh position={[side === 'left' ? -0.025 : 0.025, -0.08, 0.04]} 
            rotation={[0.2, side === 'left' ? -0.3 : 0.3, side === 'left' ? -0.2 : 0.2]}>
        <cylinderGeometry args={[0.005, 0.003, 0.018, 6]} />
        <meshPhysicalMaterial color={config.skinColor} roughness={0.4} />
      </mesh>
      
      {/* Fingers - pointing forward */}
      {[0, 1, 2, 3].map((i) => (
        <mesh 
          key={`${side}-finger-${i}`}
          position={[-0.015 + (i * 0.008), -0.12, 0.05]}
          rotation={[0.1 + fingerAnimation * (i * 0.03), 0, 0]}
        >
          <cylinderGeometry args={[0.003, 0.002, 0.018, 6]} />
          <meshPhysicalMaterial color={config.skinColor} roughness={0.4} />
        </mesh>
      ))}
      
      {/* Wrist/Sleeve detail */}
      <mesh position={[0, 0.02, -0.02]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.03, 0.025, 8]} />
        <meshPhysicalMaterial color={config.secondaryColor} roughness={0.3} />
      </mesh>
      
      {/* Subtle breathing/idle animation */}
      <group position={[0, breathingAnimation, 0]} />
    </group>
  );
};

const FirstPersonBody: React.FC<{ config: AvatarConfig }> = ({ config }) => (
  <group>
    {/* Chest/Torso visible when looking down */}
    <mesh position={[0, 0.2, 0]} scale={[0.7, 0.5, 0.7]}>
      <cylinderGeometry args={[0.22, 0.25, 0.35, 8]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
    
    {/* Outfit details */}
    {config.outfit === 'wizard' && (
      <>
        <mesh position={[0, 0, 0]} scale={[0.8, 0.7, 0.8]}>
          <cylinderGeometry args={[0.28, 0.32, 0.25, 8]} />
          <meshPhysicalMaterial color={config.secondaryColor} roughness={0.6} />
        </mesh>
        
        {/* Belt */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.03, 8]} />
          <meshPhysicalMaterial color="#8b4513" roughness={0.8} />
        </mesh>
      </>
    )}
    
    {/* Legs visible when looking down */}
    <group position={[0, -0.35, 0]}>
      {/* Left leg */}
      <mesh position={[-0.08, -0.2, 0]} scale={[0.6, 0.8, 0.6]}>
        <cylinderGeometry args={[0.05, 0.06, 0.35, 6]} />
        <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
      </mesh>
      
      {/* Right leg */}
      <mesh position={[0.08, -0.2, 0]} scale={[0.6, 0.8, 0.6]}>
        <cylinderGeometry args={[0.05, 0.06, 0.35, 6]} />
        <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.08, -0.4, 0.03]} scale={[0.7, 0.5, 1.1]}>
        <boxGeometry args={[0.06, 0.03, 0.1]} />
        <meshPhysicalMaterial color="#2d1810" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, -0.4, 0.03]} scale={[0.7, 0.5, 1.1]}>
        <boxGeometry args={[0.06, 0.03, 0.1]} />
        <meshPhysicalMaterial color="#2d1810" roughness={0.9} />
      </mesh>
    </group>
  </group>
);

const Arms: React.FC<{ config: AvatarConfig }> = ({ config }) => (
  <group>
    <mesh position={[-0.35, 0, 0]} rotation={[0, 0, -0.4]}>
      <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
    <mesh position={[0.35, 0, 0]} rotation={[0, 0, 0.4]}>
      <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
  </group>
);

const Legs: React.FC<{ config: AvatarConfig }> = ({ config }) => (
  <group>
    <mesh position={[-0.12, 0, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
    <mesh position={[0.12, 0, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
      <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
    </mesh>
  </group>
);

const Weapon: React.FC<{ type: string; config: AvatarConfig; scale?: number }> = ({ 
  type, 
  config, 
  scale = 1 
}) => {
  switch (type) {
    case 'staff':
      return (
        <group scale={scale}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
            <meshPhysicalMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <octahedronGeometry args={[0.06]} />
            <meshPhysicalMaterial 
              color={config.secondaryColor} 
              emissive={config.primaryColor}
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      );
    case 'sword':
      return (
        <group scale={scale}>
          <mesh>
            <boxGeometry args={[0.02, 0.8, 0.05]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.1, 0.05, 0.02]} />
            <meshPhysicalMaterial color="#8b4513" roughness={0.6} />
          </mesh>
        </group>
      );
    case 'wand':
      return (
        <group scale={scale}>
          <mesh>
            <cylinderGeometry args={[0.008, 0.008, 0.6, 8]} />
            <meshPhysicalMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.03]} />
            <meshPhysicalMaterial 
              color={config.secondaryColor} 
              emissive={config.primaryColor}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      );
    default:
      return null;
  }
};

const Hat: React.FC<{ type: string; config: AvatarConfig }> = ({ type, config }) => {
  switch (type) {
    case 'wizard':
      return (
        <mesh rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.12, 0.4, 8]} />
          <meshPhysicalMaterial color={config.primaryColor} roughness={0.4} />
        </mesh>
      );
    case 'crown':
      return (
        <mesh>
          <cylinderGeometry args={[0.16, 0.14, 0.08, 8]} />
          <meshPhysicalMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
      );
    case 'helmet':
      return (
        <mesh>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshPhysicalMaterial color="#708090" metalness={0.8} roughness={0.2} />
        </mesh>
      );
    default:
      return null;
  }
};
