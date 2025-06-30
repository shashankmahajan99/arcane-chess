import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PawnProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

export const Pawn: React.FC<PawnProps> = ({ color, position, isSelected, material }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create detailed textures for the pawn
  const baseTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create a gradient texture with decorative rings
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    if (color === "white") {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#f5f5f5');
      gradient.addColorStop(0.7, '#e8e8e8');
      gradient.addColorStop(1, '#d0d0d0');
    } else {
      gradient.addColorStop(0, '#2a2a2a');
      gradient.addColorStop(0.3, '#1a1a1a');
      gradient.addColorStop(0.7, '#0f0f0f');
      gradient.addColorStop(1, '#050505');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add decorative ring patterns
    ctx.strokeStyle = color === "white" ? '#d4af37' : '#8b7355';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, 30 + i * 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);

  // Normal map for surface detail
  const normalTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create normal map pattern
    ctx.fillStyle = '#8080ff'; // Neutral normal
    ctx.fillRect(0, 0, 256, 256);
    
    // Add bump details
    for (let y = 0; y < 256; y += 8) {
      for (let x = 0; x < 256; x += 8) {
        const intensity = Math.random() * 0.2 + 0.8;
        ctx.fillStyle = `rgb(${Math.floor(128 * intensity)}, ${Math.floor(128 * intensity)}, ${Math.floor(255 * intensity)})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Enhanced material with textures
  const enhancedMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material; // Use the liquid glass material as is
    }
    
    return new THREE.MeshPhysicalMaterial({
      map: baseTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
      color: color === "white" ? 0xffffff : 0x1a1a1a,
    });
  }, [material, baseTexture, normalTexture, color]);

  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ornate base with decorative edge */}
      <mesh position={[0, 0.03, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.06, 24]} />
      </mesh>
      
      {/* Decorative base ring */}
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]} material={enhancedMaterial} castShadow>
        <torusGeometry args={[0.13, 0.01, 8, 24]} />
      </mesh>
      
      {/* Lower body with subtle taper */}
      <mesh position={[0, 0.12, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.12, 20]} />
      </mesh>
      
      {/* Decorative middle ring */}
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={enhancedMaterial} castShadow>
        <torusGeometry args={[0.095, 0.008, 6, 20]} />
      </mesh>
      
      {/* Upper body (neck) */}
      <mesh position={[0, 0.22, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.08, 18]} />
      </mesh>
      
      {/* Head (slightly flattened sphere) */}
      <mesh position={[0, 0.3, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <sphereGeometry args={[0.08, 20, 16]} />
      </mesh>
      
      {/* Crown detail - small decorative top */}
      <mesh position={[0, 0.36, 0]} material={enhancedMaterial} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
      </mesh>
      
      {/* Tiny crown points for personality */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * 0.035,
            0.375,
            Math.sin((i / 4) * Math.PI * 2) * 0.035
          ]}
          material={enhancedMaterial}
          castShadow
        >
          <coneGeometry args={[0.005, 0.015, 6]} />
        </mesh>
      ))}
    </group>
  );
};
