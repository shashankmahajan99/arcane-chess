import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface KingProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

/**
 * A highly detailed, spline-based 3D King chess piece with liquid glass effects.
 * Features imperial cross crown geometry created from spline curves and majestic materials.
 */
export const King: React.FC<KingProps> = ({ color, position, isSelected, material }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create royal cross spline profile for the crown
  const crossProfile = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, 0.01, 0),
      new THREE.Vector3(0.04, 0.06, 0),
      new THREE.Vector3(0.06, 0.12, 0),
      new THREE.Vector3(0.05, 0.16, 0),
      new THREE.Vector3(0.03, 0.18, 0),
      new THREE.Vector3(0.01, 0.14, 0),
      new THREE.Vector3(0, 0.08, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    
    const points = curve.getPoints(35);
    const shape = new THREE.Shape();
    shape.setFromPoints(points.map(p => new THREE.Vector2(p.x, p.y)));
    return shape;
  }, []);

  // Liquid glass material with imperial grandeur
  const liquidGlassMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material;
    }
    
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xfffaf0 : 0x1a1a2e,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.94,
      thickness: 1.0,
      ior: 1.56,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      emissive: new THREE.Color(color === "white" ? 0xdaa520 : 0x4169e1),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(color === "white" ? 0xfdf5e6 : 0x0a0a0a),
      attenuationDistance: 0.3,
    });
  }, [color, material]);

  // Imperial accent material
  const imperialAccentMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xffd700 : 0x4169e1,
      roughness: 0.04,
      metalness: 0.96,
      transmission: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      emissive: new THREE.Color(color === "white" ? 0xb8860b : 0x191970),
      emissiveIntensity: 0.35,
    });
  }, [color]);

  // Crown jewel material
  const crownJewelMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xff4500 : 0x8a2be2,
      emissive: new THREE.Color(color === "white" ? 0xff4500 : 0x8a2be2),
      emissiveIntensity: 0.8,
      roughness: 0.01,
      metalness: 0.0,
      transmission: 0.95,
      thickness: 0.6,
      ior: 2.5, // Ruby/sapphire-like
      clearcoat: 1.0,
    });
  }, [color]);

  // Animation with imperial majesty
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isSelected) {
        groupRef.current.rotation.y = Math.sin(time * 1.8) * 0.1;
        groupRef.current.position.y = position[1] + Math.sin(time * 2.5) * 0.025;
        
        // Animate liquid glass intensity
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.2 + Math.sin(time * 3.5) * 0.1;
        }
      } else {
        groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.02;
        groupRef.current.position.y = position[1];
        
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.2;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Imperial liquid glass base */}
      <mesh position={[0, 0.06, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.12, 32]} />
      </mesh>

      {/* Royal base ring */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={imperialAccentMaterial} castShadow>
        <torusGeometry args={[0.18, 0.025, 16, 32]} />
      </mesh>

      {/* Majestic lower body */}
      <mesh position={[0, 0.22, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.2, 32]} />
      </mesh>

      {/* Imperial waist band */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={imperialAccentMaterial} castShadow>
        <torusGeometry args={[0.13, 0.02, 16, 32]} />
      </mesh>

      {/* Noble middle section */}
      <mesh position={[0, 0.42, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.18, 32]} />
      </mesh>

      {/* Royal chest band */}
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} material={imperialAccentMaterial} castShadow>
        <torusGeometry args={[0.10, 0.018, 16, 32]} />
      </mesh>

      {/* Regal upper body */}
      <mesh position={[0, 0.58, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 32]} />
      </mesh>

      {/* Crown base with liquid glass */}
      <mesh position={[0, 0.68, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.10, 0.10, 0.08, 32]} />
      </mesh>

      {/* Spline-based crown cross arms */}
      <mesh position={[0.12, 0.78, 0]} rotation={[0, 0, Math.PI / 2]} material={liquidGlassMaterial} castShadow>
        <extrudeGeometry 
          args={[
            crossProfile, 
            { 
              depth: 0.04,
              bevelEnabled: true,
              bevelSegments: 8,
              steps: 8,
              bevelSize: 0.003,
              bevelThickness: 0.003,
              curveSegments: 24
            }
          ]} 
        />
      </mesh>

      <mesh position={[-0.12, 0.78, 0]} rotation={[0, 0, -Math.PI / 2]} material={liquidGlassMaterial} castShadow>
        <extrudeGeometry 
          args={[
            crossProfile, 
            { 
              depth: 0.04,
              bevelEnabled: true,
              bevelSegments: 8,
              steps: 8,
              bevelSize: 0.003,
              bevelThickness: 0.003,
              curveSegments: 24
            }
          ]} 
        />
      </mesh>

      <mesh position={[0, 0.90, 0]} material={liquidGlassMaterial} castShadow>
        <extrudeGeometry 
          args={[
            crossProfile, 
            { 
              depth: 0.04,
              bevelEnabled: true,
              bevelSegments: 8,
              steps: 8,
              bevelSize: 0.003,
              bevelThickness: 0.003,
              curveSegments: 24
            }
          ]} 
        />
      </mesh>

      <mesh position={[0, 0.66, 0]} rotation={[Math.PI, 0, 0]} material={liquidGlassMaterial} castShadow>
        <extrudeGeometry 
          args={[
            crossProfile, 
            { 
              depth: 0.04,
              bevelEnabled: true,
              bevelSegments: 8,
              steps: 8,
              bevelSize: 0.003,
              bevelThickness: 0.003,
              curveSegments: 24
            }
          ]} 
        />
      </mesh>

      {/* Crown jewels at cross intersections */}
      <mesh position={[0, 0.78, 0]} material={crownJewelMaterial} castShadow>
        <octahedronGeometry args={[0.025, 1]} />
      </mesh>

      <mesh position={[0.08, 0.78, 0]} material={crownJewelMaterial} castShadow>
        <octahedronGeometry args={[0.015, 0]} />
      </mesh>

      <mesh position={[-0.08, 0.78, 0]} material={crownJewelMaterial} castShadow>
        <octahedronGeometry args={[0.015, 0]} />
      </mesh>

      <mesh position={[0, 0.86, 0]} material={crownJewelMaterial} castShadow>
        <octahedronGeometry args={[0.015, 0]} />
      </mesh>

      <mesh position={[0, 0.70, 0]} material={crownJewelMaterial} castShadow>
        <octahedronGeometry args={[0.015, 0]} />
      </mesh>

      {/* Imperial orb at the top */}
      <mesh position={[0, 0.95, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <sphereGeometry args={[0.02, 32, 24]} />
      </mesh>

      {/* Liquid glass energy field */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const radius = 0.28 + Math.sin(i * 0.7) * 0.05;
        const height = 0.3 + Math.sin(i * 0.5) * 0.35;
        return (
          <mesh
            key={`energy-${i}`}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
            material={crownJewelMaterial}
            castShadow
          >
            <sphereGeometry args={[0.0015 + Math.sin(i * 0.3) * 0.001, 16, 12]} />
          </mesh>
        );
      })}

      {/* Floating crown wisps */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.15;
        return (
          <mesh
            key={`wisp-${i}`}
            position={[
              Math.cos(angle) * radius,
              0.75 + Math.sin(angle * 1.2) * 0.08,
              Math.sin(angle) * radius
            ]}
            rotation={[angle * 0.3, angle, 0]}
            material={liquidGlassMaterial}
            castShadow
          >
            <capsuleGeometry args={[0.002, 0.03, 4, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
