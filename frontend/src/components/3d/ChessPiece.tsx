import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ChessPiece as ChessPieceType } from '../../types';

interface ChessPieceProps {
  piece: ChessPieceType;
  position: [number, number, number];
  square: string;
  isSelected: boolean;
  onClick: () => void;
  interactive: boolean;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  position,
  square,
  isSelected,
  onClick,
  interactive
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load piece model
  const { scene } = useGLTF(`/models/chess/${piece.type}.glb`);
  
  // Materials based on piece color
  const material = useMemo(() => {
    const baseColor = piece.color === 'white' ? '#f8fafc' : '#1e293b';
    const accentColor = piece.color === 'white' ? '#e2e8f0' : '#0f172a';
    
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.4,
      roughness: 0.3,
      envMapIntensity: 1.0,
    });
  }, [piece.color]);

  // Glow material for selection
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: piece.color === 'white' ? '#60a5fa' : '#fbbf24',
    transparent: true,
    opacity: 0.3,
  }), [piece.color]);

  // Apply materials to the model
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, material]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth position interpolation
    const targetPos = new THREE.Vector3(...position);
    groupRef.current.position.lerp(targetPos, delta * 8);

    // Selection effects
    if (isSelected) {
      groupRef.current.position.y = position[1] + 0.2 + Math.sin(state.clock.elapsedTime * 6) * 0.05;
      groupRef.current.rotation.y += delta * 2;
    } else {
      groupRef.current.rotation.y = 0;
    }

    // Hover effects
    if (interactive && meshRef.current) {
      const scale = isSelected ? 1.1 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 10);
    }
  });

  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={interactive ? onClick : undefined}
      onPointerEnter={(e) => {
        if (interactive) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerLeave={(e) => {
        if (interactive) {
          document.body.style.cursor = 'default';
        }
      }}
    >
      {/* Piece model */}
      <primitive 
        ref={meshRef}
        object={scene.clone()} 
        scale={[0.8, 0.8, 0.8]}
      />
      
      {/* Selection glow */}
      {isSelected && (
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
          <primitive object={glowMaterial} />
        </mesh>
      )}
      
      {/* Shadow plane */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// Preload piece models
useGLTF.preload('/models/chess/pawn.glb');
useGLTF.preload('/models/chess/rook.glb');
useGLTF.preload('/models/chess/knight.glb');
useGLTF.preload('/models/chess/bishop.glb');
useGLTF.preload('/models/chess/queen.glb');
useGLTF.preload('/models/chess/king.glb');
