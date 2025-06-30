import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface KnightProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

/**
 * A highly detailed, spline-based 3D Knight chess piece with liquid glass effects.
 * Features a classic horse head silhouette created from spline curves and magical materials.
 */
export const Knight: React.FC<KnightProps> = ({
  color,
  position,
  isSelected,
  material,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create horse head spline profile
  const horseHeadProfile = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, 0.04, 0),
      new THREE.Vector3(0.06, 0.08, 0),
      new THREE.Vector3(0.12, 0.14, 0),
      new THREE.Vector3(0.15, 0.20, 0),
      new THREE.Vector3(0.14, 0.28, 0),
      new THREE.Vector3(0.10, 0.34, 0),
      new THREE.Vector3(0.06, 0.32, 0),
      new THREE.Vector3(0.02, 0.28, 0),
      new THREE.Vector3(0.01, 0.20, 0),
      new THREE.Vector3(0.03, 0.12, 0),
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    
    const points = curve.getPoints(50);
    const shape = new THREE.Shape();
    shape.setFromPoints(points.map(p => new THREE.Vector2(p.x, p.y)));
    return shape;
  }, []);

  // Create horse ear profile
  const horseEarProfile = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.01, 0.02, 0),
      new THREE.Vector3(0.02, 0.05, 0),
      new THREE.Vector3(0.015, 0.08, 0),
      new THREE.Vector3(0.005, 0.06, 0),
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    
    const points = curve.getPoints(20);
    const shape = new THREE.Shape();
    shape.setFromPoints(points.map(p => new THREE.Vector2(p.x, p.y)));
    return shape;
  }, []);

  // Liquid glass material with mystical properties
  const liquidGlassMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material;
    }
    
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xf8f8ff : 0x2e1065,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.88,
      thickness: 0.8,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      emissive: new THREE.Color(color === "white" ? 0x87ceeb : 0x6a5acd),
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(color === "white" ? 0xf5f5dc : 0x191970),
      attenuationDistance: 0.5,
    });
  }, [color, material]);

  // Accent material for mane and details
  const accentMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xdaa520 : 0x8a2be2,
      roughness: 0.08,
      metalness: 0.92,
      transmission: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      emissive: new THREE.Color(color === "white" ? 0xb8860b : 0x4b0082),
      emissiveIntensity: 0.25,
    });
  }, [color]);

  // Eye material with mystical glow
  const eyeMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0x00bfff : 0xff69b4,
      emissive: new THREE.Color(color === "white" ? 0x00bfff : 0xff69b4),
      emissiveIntensity: 0.8,
      roughness: 0.01,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.3,
      ior: 1.8,
      clearcoat: 1.0,
    });
  }, [color]);

  // Animation with galloping energy
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isSelected) {
        groupRef.current.rotation.y = Math.sin(time * 2.2) * 0.15;
        groupRef.current.position.y = position[1] + Math.sin(time * 3.5) * 0.03;
        
        // Animate liquid glass intensity
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.15 + Math.sin(time * 4.5) * 0.1;
        }
      } else {
        groupRef.current.rotation.y = Math.sin(time * 0.4) * 0.04;
        groupRef.current.position.y = position[1];
        
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.15;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Liquid glass base */}
      <mesh position={[0, 0.05, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.1, 32]} />
      </mesh>

      {/* Base accent ring */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial} castShadow>
        <torusGeometry args={[0.16, 0.02, 16, 32]} />
      </mesh>

      {/* Horse body foundation */}
      <mesh position={[0, 0.15, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.10, 0.14, 0.12, 32]} />
      </mesh>

      {/* Noble chest */}
      <mesh position={[0, 0.24, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.10, 0.1, 32]} />
      </mesh>

      {/* Neck base with liquid glass */}
      <mesh position={[0, 0.32, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 24]} />
      </mesh>

      {/* Spline-based horse head using extruded profile */}
      <mesh 
        position={[0.08, 0.42, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        material={liquidGlassMaterial} 
        castShadow 
        receiveShadow
      >
        <extrudeGeometry 
          args={[
            horseHeadProfile, 
            { 
              depth: 0.12,
              bevelEnabled: true,
              bevelSegments: 10,
              steps: 12,
              bevelSize: 0.005,
              bevelThickness: 0.005,
              curveSegments: 30
            }
          ]} 
        />
      </mesh>

      {/* Horse ears using spline extrusion */}
      <mesh 
        position={[0.04, 0.52, 0.03]} 
        rotation={[0.3, Math.PI / 3, 0.2]} 
        material={liquidGlassMaterial} 
        castShadow
      >
        <extrudeGeometry 
          args={[
            horseEarProfile, 
            { 
              depth: 0.02,
              bevelEnabled: true,
              bevelSegments: 4,
              steps: 4,
              bevelSize: 0.001,
              bevelThickness: 0.001,
              curveSegments: 15
            }
          ]} 
        />
      </mesh>

      <mesh 
        position={[0.04, 0.52, -0.03]} 
        rotation={[-0.3, Math.PI / 3, -0.2]} 
        material={liquidGlassMaterial} 
        castShadow
      >
        <extrudeGeometry 
          args={[
            horseEarProfile, 
            { 
              depth: 0.02,
              bevelEnabled: true,
              bevelSegments: 4,
              steps: 4,
              bevelSize: 0.001,
              bevelThickness: 0.001,
              curveSegments: 15
            }
          ]} 
        />
      </mesh>

      {/* Mystical eyes with liquid glass glow */}
      <mesh position={[0.14, 0.46, 0.025]} material={eyeMaterial} castShadow>
        <sphereGeometry args={[0.01, 16, 12]} />
      </mesh>

      <mesh position={[0.14, 0.46, -0.025]} material={eyeMaterial} castShadow>
        <sphereGeometry args={[0.01, 16, 12]} />
      </mesh>

      {/* Flowing mane strands with spline curves */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 0.5 - Math.PI * 0.25;
        const length = 0.06 + (i % 2) * 0.02;
        return (
          <mesh
            key={`mane-${i}`}
            position={[
              -0.02 + Math.sin(angle) * 0.03,
              0.38 + i * 0.015,
              Math.cos(angle) * 0.04
            ]}
            rotation={[angle * 0.5, angle, Math.sin(i) * 0.3]}
            material={accentMaterial}
            castShadow
          >
            <capsuleGeometry args={[0.003, length, 4, 8]} />
          </mesh>
        );
      })}

      {/* Magical energy aura around the knight */}
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const radius = 0.22 + Math.sin(i * 0.9) * 0.03;
        const height = 0.15 + Math.sin(i * 0.7) * 0.25;
        return (
          <mesh
            key={`aura-${i}`}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
            material={eyeMaterial}
            castShadow
          >
            <sphereGeometry args={[0.002 + Math.sin(i * 0.5) * 0.001, 12, 8]} />
          </mesh>
        );
      })}

      {/* Floating mystical wisps */}
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 0.18;
        return (
          <mesh
            key={`wisp-${i}`}
            position={[
              Math.cos(angle) * radius,
              0.35 + Math.sin(angle * 1.4) * 0.12,
              Math.sin(angle) * radius
            ]}
            rotation={[angle * 0.6, angle, 0]}
            material={liquidGlassMaterial}
            castShadow
          >
            <capsuleGeometry args={[0.002, 0.025, 4, 8]} />
          </mesh>
        );
      })}

      {/* Knight's bridle details */}
      <mesh position={[0.12, 0.44, 0]} rotation={[0, Math.PI / 2, 0]} material={accentMaterial} castShadow>
        <torusGeometry args={[0.02, 0.003, 8, 16]} />
      </mesh>

      {/* Nostril details with mystical glow */}
      <mesh position={[0.16, 0.42, 0.015]} material={eyeMaterial} castShadow>
        <sphereGeometry args={[0.003, 8, 6]} />
      </mesh>

      <mesh position={[0.16, 0.42, -0.015]} material={eyeMaterial} castShadow>
        <sphereGeometry args={[0.003, 8, 6]} />
      </mesh>
    </group>
  );
};
