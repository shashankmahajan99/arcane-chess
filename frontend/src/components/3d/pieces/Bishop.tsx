import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BishopProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

export const Bishop: React.FC<BishopProps> = ({ color, position, isSelected, material }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create religious vestment texture
  const vestmentTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base vestment color
    const baseColor = color === "white" ? '#f5f5f0' : '#2a1a2a';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add fabric texture with vertical lines (like clergy robes)
    ctx.strokeStyle = color === "white" ? '#e8e8e0' : '#1a101a';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    // Add horizontal decorative bands
    const bandPositions = [100, 200, 300, 400];
    bandPositions.forEach(y => {
      ctx.fillStyle = color === "white" ? '#d4af37' : '#8b7355'; // Gold trim
      ctx.fillRect(0, y, 512, 8);
      
      // Add intricate pattern on bands
      ctx.fillStyle = color === "white" ? '#c19b26' : '#7a6244';
      for (let x = 0; x < 512; x += 16) {
        ctx.fillRect(x, y + 2, 8, 4);
      }
    });
    
    // Add cross symbols on the vestment
    ctx.fillStyle = color === "white" ? '#c0c0c0' : '#606060';
    for (let i = 0; i < 6; i++) {
      const x = 50 + (i % 3) * 150;
      const y = 50 + Math.floor(i / 3) * 200;
      
      // Vertical line of cross
      ctx.fillRect(x - 2, y - 15, 4, 30);
      // Horizontal line of cross
      ctx.fillRect(x - 10, y - 2, 20, 4);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);

  // Create mitre (bishop hat) texture with religious patterns
  const mitreTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base mitre color
    const mitreColor = color === "white" ? '#ffffff' : '#1a1a1a';
    ctx.fillStyle = mitreColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add ornate religious patterns
    ctx.strokeStyle = color === "white" ? '#d4af37' : '#8b7355'; // Gold
    ctx.lineWidth = 2;
    
    // Draw ornate diamond pattern
    for (let y = 0; y < 256; y += 40) {
      for (let x = 0; x < 256; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + 40, y + 20);
        ctx.lineTo(x + 20, y + 40);
        ctx.lineTo(x, y + 20);
        ctx.closePath();
        ctx.stroke();
      }
    }
    
    // Add central religious symbol
    const centerX = 128;
    const centerY = 128;
    ctx.fillStyle = color === "white" ? '#b8860b' : '#cd853f'; // Dark goldenrod
    ctx.fillRect(centerX - 3, centerY - 20, 6, 40); // Vertical
    ctx.fillRect(centerX - 15, centerY - 3, 30, 6); // Horizontal
    
    return new THREE.CanvasTexture(canvas);
  }, [color]);

  const enhancedMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material;
    }
    
    return new THREE.MeshPhysicalMaterial({
      map: vestmentTexture,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      transmission: 0.8,
      thickness: 0.7,
      ior: 1.4,
      color: color === "white" ? 0xffffff : 0x1a1a1a,
    });
  }, [material, vestmentTexture, color]);

  const mitreMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: mitreTexture,
      roughness: 0.2,
      metalness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      transmission: 0.6,
      thickness: 0.5,
      color: color === "white" ? 0xffffff : 0x1a1a1a,
    });
  }, [mitreTexture, color]);

  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.1;
      // Gentle swaying motion like in prayer
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Ornate base platform */}
      <mesh position={[0, 0.04, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.08, 20]} />
      </mesh>
      
      {/* Base decorative ring with religious symbols */}
      <mesh 
        position={[0, 0.07, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        material={new THREE.MeshPhysicalMaterial({
          color: color === "white" ? 0xd4af37 : 0x8b7355,
          roughness: 0.3,
          metalness: 0.8
        })} 
        castShadow
      >
        <torusGeometry args={[0.14, 0.015, 8, 20]} />
      </mesh>
      
      {/* Lower vestment body */}
      <mesh position={[0, 0.14, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.12, 18]} />
      </mesh>
      
      {/* Decorative sash/belt */}
      <mesh 
        position={[0, 0.18, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        material={new THREE.MeshPhysicalMaterial({
          color: color === "white" ? 0xd4af37 : 0x8b7355,
          roughness: 0.4,
          metalness: 0.6
        })} 
        castShadow
      >
        <torusGeometry args={[0.095, 0.012, 8, 18]} />
      </mesh>
      
      {/* Middle body section */}
      <mesh position={[0, 0.26, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.12, 16]} />
      </mesh>
      
      {/* Upper body/shoulders */}
      <mesh position={[0, 0.34, 0]} material={enhancedMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.08, 16]} />
      </mesh>
      
      {/* Shoulder decorations (epaulettes) */}
      <mesh position={[-0.07, 0.36, 0]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0xd4af37 : 0x8b7355,
        roughness: 0.3,
        metalness: 0.7
      })} castShadow>
        <sphereGeometry args={[0.015, 12, 8]} />
      </mesh>
      <mesh position={[0.07, 0.36, 0]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0xd4af37 : 0x8b7355,
        roughness: 0.3,
        metalness: 0.7
      })} castShadow>
        <sphereGeometry args={[0.015, 12, 8]} />
      </mesh>
      
      {/* Mitre (bishop's pointed hat) - main section */}
      <mesh position={[0, 0.46, 0]} material={mitreMaterial} castShadow receiveShadow>
        <coneGeometry args={[0.08, 0.18, 16]} />
      </mesh>
      
      {/* Mitre decorative band */}
      <mesh 
        position={[0, 0.42, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
        material={new THREE.MeshPhysicalMaterial({
          color: color === "white" ? 0xd4af37 : 0x8b7355,
          roughness: 0.2,
          metalness: 0.8
        })} 
        castShadow
      >
        <torusGeometry args={[0.078, 0.008, 8, 16]} />
      </mesh>
      
      {/* Mitre side decorations */}
      {[0, 1].map((i) => (
        <mesh
          key={i}
          position={[
            (i === 0 ? -1 : 1) * 0.06,
            0.46,
            0
          ]}
          material={new THREE.MeshPhysicalMaterial({
            color: color === "white" ? 0xff6b6b : 0x8b0000,
            roughness: 0.3,
            metalness: 0.1
          })}
          castShadow
        >
          <sphereGeometry args={[0.012, 12, 8]} />
        </mesh>
      ))}
      
      {/* Cross on top - vertical */}
      <mesh position={[0, 0.58, 0]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0xd4af37 : 0x8b7355,
        roughness: 0.2,
        metalness: 0.8
      })} castShadow>
        <boxGeometry args={[0.015, 0.08, 0.015]} />
      </mesh>
      
      {/* Cross on top - horizontal */}
      <mesh position={[0, 0.56, 0]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0xd4af37 : 0x8b7355,
        roughness: 0.2,
        metalness: 0.8
      })} castShadow>
        <boxGeometry args={[0.05, 0.015, 0.015]} />
      </mesh>
      
      {/* Cross decoration - small sphere at intersection */}
      <mesh position={[0, 0.56, 0]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0xff6b6b : 0x8b0000,
        roughness: 0.2,
        metalness: 0.3
      })} castShadow>
        <sphereGeometry args={[0.008, 12, 8]} />
      </mesh>
      
      {/* Religious staff/crosier (if space allows) */}
      <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, -0.3]} material={new THREE.MeshPhysicalMaterial({
        color: color === "white" ? 0x8b4513 : 0x654321,
        roughness: 0.6,
        metalness: 0.2
      })} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
      </mesh>
      
      {/* Crosier curved top */}
      <mesh 
        position={[0.15, 0.4, 0]} 
        rotation={[0, 0, -0.3]} 
        material={new THREE.MeshPhysicalMaterial({
          color: color === "white" ? 0xd4af37 : 0x8b7355,
          roughness: 0.3,
          metalness: 0.7
        })} 
        castShadow
      >
        <torusGeometry args={[0.02, 0.005, 8, 16]} />
      </mesh>
    </group>
  );
};
