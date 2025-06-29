import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FirstPersonHUDProps {
  isMoving: boolean;
  movementSpeed: number;
}

export const FirstPersonHUD: React.FC<FirstPersonHUDProps> = ({ 
  isMoving, 
  movementSpeed 
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const walkCycleRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Position the HUD relative to the camera
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);

    const time = state.clock.elapsedTime;
    
    // Body animations
    if (bodyRef.current) {
      // Breathing animation
      const breathe = Math.sin(time * 1.2) * 0.01;
      bodyRef.current.scale.setScalar(1 + breathe);
      
      // Walking animations when moving
      if (isMoving && movementSpeed > 0.1) {
        walkCycleRef.current += delta * movementSpeed * 12;
        
        // Vertical bobbing
        const bob = Math.sin(walkCycleRef.current) * 0.08;
        bodyRef.current.position.y = -0.8 + bob;
        
        // Horizontal sway
        const sway = Math.sin(walkCycleRef.current * 0.5) * 0.03;
        bodyRef.current.position.x = sway;
        
        // Leg walking animation
        if (leftLegRef.current && rightLegRef.current) {
          const legSwing = Math.sin(walkCycleRef.current) * 0.5;
          leftLegRef.current.rotation.x = legSwing;
          rightLegRef.current.rotation.x = -legSwing;
          
          leftLegRef.current.position.z = Math.sin(walkCycleRef.current) * 0.02;
          rightLegRef.current.position.z = -Math.sin(walkCycleRef.current) * 0.02;
        }
      } else {
        // Return to idle position
        bodyRef.current.position.y = -0.8;
        bodyRef.current.position.x = 0;
        walkCycleRef.current = 0;
        
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = 0;
          rightLegRef.current.rotation.x = 0;
          leftLegRef.current.position.z = 0;
          rightLegRef.current.position.z = 0;
        }
      }
    }

    // Arm animations
    if (leftArmRef.current && rightArmRef.current) {
      if (isMoving && movementSpeed > 0.1) {
        // Walking arm animation
        const armSwing = Math.sin(walkCycleRef.current) * 0.3;
        leftArmRef.current.rotation.x = 0.15 + armSwing;
        rightArmRef.current.rotation.x = 0.15 - armSwing;
        
        const armBob = Math.sin(walkCycleRef.current * 2) * 0.02;
        leftArmRef.current.position.y = -0.3 + armBob;
        rightArmRef.current.position.y = -0.3 - armBob;
      } else {
        // Idle breathing animation
        const breathe = Math.sin(time * 1.5) * 0.015;
        const sway = Math.sin(time * 0.8) * 0.025;
        
        leftArmRef.current.position.y = -0.3 + breathe;
        rightArmRef.current.position.y = -0.3 + breathe;
        
        leftArmRef.current.rotation.z = 0.08 + sway;
        rightArmRef.current.rotation.z = -0.08 - sway;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* First Person Arms */}
      <group position={[0, 0, 0.4]} scale={0.4}>
        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.35, -0.3, 0]} rotation={[0.15, 0.25, 0.08]}>
          {/* Forearm */}
          <mesh position={[0, 0, 0.12]} rotation={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.2, 8]} />
            <meshPhysicalMaterial 
              color="#4f46e5" 
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          {/* Left Hand */}
          <mesh position={[0, -0.04, 0.2]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.05, 0.07, 0.1]} />
            <meshPhysicalMaterial 
              color="#fbbf24" 
              roughness={0.4}
              metalness={0.0}
            />
          </mesh>
          
          {/* Fingers */}
          {[0, 1, 2, 3].map((i) => (
            <mesh 
              key={`left-finger-${i}`}
              position={[
                -0.02 + (i * 0.012), 
                -0.07, 
                0.26
              ]} 
              rotation={[0.08, 0, 0]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.035, 6]} />
              <meshPhysicalMaterial 
                color="#fbbf24" 
                roughness={0.4}
                metalness={0.0}
              />
            </mesh>
          ))}
          
          {/* Thumb */}
          <mesh position={[0.035, -0.025, 0.23]} rotation={[0, 0.4, 0.25]}>
            <cylinderGeometry args={[0.005, 0.005, 0.025, 6]} />
            <meshPhysicalMaterial 
              color="#fbbf24" 
              roughness={0.4}
              metalness={0.0}
            />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.35, -0.3, 0]} rotation={[0.15, -0.25, -0.08]}>
          {/* Forearm */}
          <mesh position={[0, 0, 0.12]} rotation={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.2, 8]} />
            <meshPhysicalMaterial 
              color="#4f46e5" 
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          {/* Right Hand */}
          <mesh position={[0, -0.04, 0.2]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.05, 0.07, 0.1]} />
            <meshPhysicalMaterial 
              color="#fbbf24" 
              roughness={0.4}
              metalness={0.0}
            />
          </mesh>
          
          {/* Fingers */}
          {[0, 1, 2, 3].map((i) => (
            <mesh 
              key={`right-finger-${i}`}
              position={[
                -0.02 + (i * 0.012), 
                -0.07, 
                0.26
              ]} 
              rotation={[0.08, 0, 0]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.035, 6]} />
              <meshPhysicalMaterial 
                color="#fbbf24" 
                roughness={0.4}
                metalness={0.0}
              />
            </mesh>
          ))}
          
          {/* Thumb */}
          <mesh position={[-0.035, -0.025, 0.23]} rotation={[0, -0.4, -0.25]}>
            <cylinderGeometry args={[0.005, 0.005, 0.025, 6]} />
            <meshPhysicalMaterial 
              color="#fbbf24" 
              roughness={0.4}
              metalness={0.0}
            />
          </mesh>
        </group>
      </group>
      
      {/* Lower Body/Torso - visible at bottom of view */}
      <group ref={bodyRef} position={[0, -0.8, 0.5]} scale={0.4}>
        {/* Chest/Torso */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.2, 8]} />
          <meshPhysicalMaterial 
            color="#4f46e5" 
            roughness={0.3}
            metalness={0.1}
            clearcoat={0.5}
          />
        </mesh>
        
        {/* Belt */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 8]} />
          <meshPhysicalMaterial 
            color="#8b4513" 
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
        
        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.08, -0.2, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.3, 6]} />
            <meshPhysicalMaterial 
              color="#4f46e5" 
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          {/* Left Foot */}
          <mesh position={[0, -0.32, 0.04]}>
            <boxGeometry args={[0.08, 0.04, 0.12]} />
            <meshPhysicalMaterial 
              color="#654321" 
              roughness={0.6}
              metalness={0.0}
            />
          </mesh>
        </group>
        
        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.08, -0.2, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.3, 6]} />
            <meshPhysicalMaterial 
              color="#4f46e5" 
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          
          {/* Right Foot */}
          <mesh position={[0, -0.32, 0.04]}>
            <boxGeometry args={[0.08, 0.04, 0.12]} />
            <meshPhysicalMaterial 
              color="#654321" 
              roughness={0.6}
              metalness={0.0}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
