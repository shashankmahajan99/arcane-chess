import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RookProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

export const Rook: React.FC<RookProps> = ({ color, position, isSelected, material }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create stone-like texture for the castle
  const stoneTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base stone color
    const baseColor = color === "white" ? '#f0f0f0' : '#2a2a2a';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add stone brick pattern
    ctx.strokeStyle = color === "white" ? '#d0d0d0' : '#1a1a1a';
    ctx.lineWidth = 2;
    
    // Horizontal lines
    for (let y = 0; y < 512; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    
    // Vertical lines (staggered for brick pattern)
    for (let y = 0; y < 512; y += 80) {
      for (let x = 0; x < 512; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x + (y % 80 === 0 ? 0 : 30), y);
        ctx.lineTo(x + (y % 80 === 0 ? 0 : 30), y + 40);
        ctx.stroke();
      }
    }
    
    // Add weathering and age marks
    ctx.fillStyle = color === "white" ? 'rgba(200, 200, 200, 0.3)' : 'rgba(50, 50, 50, 0.3)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 10 + 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);

  // Rough normal map for castle texture
  const roughNormalTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add rough stone surface normals
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const roughness = Math.random() * 0.4 + 0.6;
        ctx.fillStyle = `rgb(${Math.floor(128 * roughness)}, ${Math.floor(128 * roughness)}, ${Math.floor(255 * roughness)})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  const enhancedMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material;
    }
    
    return new THREE.MeshPhysicalMaterial({
      map: stoneTexture,
      normalMap: roughNormalTexture,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.4,
      metalness: 0.05,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      transmission: 0.8,
      thickness: 0.8,
      ior: 1.4,
      color: color === "white" ? 0xf5f5f5 : 0x1a1a1a,
    });
  }, [material, stoneTexture, roughNormalTexture, color]);

  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Massive fortress base */}
      <mesh position={[0, 0.04, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.08, 12]} />
      </mesh>
      
      {/* Base decorative molding */}
      <mesh 
        position={[0, 0.07, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        material={enhancedMaterial} 
        castShadow
      >
        <torusGeometry args={[0.16, 0.015, 8, 12]} />
      </mesh>
      
      {/* Lower tower section */}
      <mesh position={[0, 0.16, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.16, 12]} />
      </mesh>
      
      {/* Middle decorative band */}
      <mesh 
        position={[0, 0.22, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        material={enhancedMaterial} 
        castShadow
      >
        <torusGeometry args={[0.125, 0.01, 6, 12]} />
      </mesh>
      
      {/* Upper tower section */}
      <mesh position={[0, 0.32, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.16, 12]} />
      </mesh>
      
      {/* Battlements platform */}
      <mesh position={[0, 0.42, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 12]} />
      </mesh>
      
      {/* Castle crenellations - alternating heights for authentic look */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 12) * Math.PI * 2) * 0.135,
            0.46 + (i % 2 === 0 ? 0.04 : 0.02),
            Math.sin((i / 12) * Math.PI * 2) * 0.135
          ]}
          material={enhancedMaterial}
          castShadow
        >
          <boxGeometry args={[0.025, i % 2 === 0 ? 0.08 : 0.04, 0.025]} />
        </mesh>
      ))}
      
      {/* Arrow slits in the tower */}
      {[0, 2, 4, 6].map((i) => (
        <mesh
          key={`slit-${i}`}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 0.125,
            0.3,
            Math.sin((i / 8) * Math.PI * 2) * 0.125
          ]}
          rotation={[0, (i / 8) * Math.PI * 2, 0]}
          material={new THREE.MeshBasicMaterial({ color: 0x000000 })}
        >
          <boxGeometry args={[0.005, 0.04, 0.02]} />
        </mesh>
      ))}
      
      {/* Central tower spire */}
      <mesh position={[0, 0.52, 0]} material={enhancedMaterial} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
      </mesh>
      
      {/* Flag pole */}
      <mesh position={[0, 0.58, 0]} material={enhancedMaterial} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.04, 6]} />
      </mesh>
    </group>
  );
};
