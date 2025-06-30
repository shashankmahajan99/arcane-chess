import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface QueenProps {
  color: "white" | "black";
  position: [number, number, number];
  isSelected: boolean;
  material: THREE.Material;
}

/**
 * A highly detailed, spline-based 3D Queen chess piece with liquid glass effects.
 * Features elegant crown geometry created from spline curves and royal materials.
 */
export const Queen: React.FC<QueenProps> = ({
  color,
  position,
  isSelected,
  material,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create elegant crown spline profile
  const crownProfile = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.02, 0),
      new THREE.Vector3(0.05, 0.08, 0),
      new THREE.Vector3(0.08, 0.12, 0),
      new THREE.Vector3(0.06, 0.16, 0),
      new THREE.Vector3(0.04, 0.14, 0),
      new THREE.Vector3(0.02, 0.10, 0),
      new THREE.Vector3(0, 0.06, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    
    const points = curve.getPoints(40);
    const shape = new THREE.Shape();
    shape.setFromPoints(points.map(p => new THREE.Vector2(p.x, p.y)));
    return shape;
  }, []);

  // Liquid glass material with royal elegance
  const liquidGlassMaterial = useMemo(() => {
    if (material instanceof THREE.ShaderMaterial) {
      return material;
    }
    
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xfaf0e6 : 0x1a0d26,
      roughness: 0.03,
      metalness: 0.0,
      transmission: 0.92,
      thickness: 0.9,
      ior: 1.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(color === "white" ? 0xffd700 : 0x9370db),
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(color === "white" ? 0xfff8dc : 0x0f0620),
      attenuationDistance: 0.4,
    });
  }, [color, material]);

  // Royal accent material
  const royalAccentMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xffd700 : 0x9370db,
      roughness: 0.05,
      metalness: 0.95,
      transmission: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(color === "white" ? 0xb8860b : 0x4b0082),
      emissiveIntensity: 0.3,
    });
  }, [color]);

  // Crown jewel material
  const jewelMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color === "white" ? 0xff1493 : 0xda70d6,
      emissive: new THREE.Color(color === "white" ? 0xff1493 : 0xda70d6),
      emissiveIntensity: 0.6,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.5,
      ior: 2.4, // Diamond-like
      clearcoat: 1.0,
    });
  }, [color]);

  // Animation with liquid glass effects
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      if (isSelected) {
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.12;
        groupRef.current.position.y = position[1] + Math.sin(time * 3) * 0.02;
        
        // Animate liquid glass intensity
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.18 + Math.sin(time * 4) * 0.08;
        }
      } else {
        groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;
        groupRef.current.position.y = position[1];
        
        if (liquidGlassMaterial instanceof THREE.MeshPhysicalMaterial) {
          liquidGlassMaterial.emissiveIntensity = 0.18;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Liquid glass base with elegant curves */}
      <mesh position={[0, 0.05, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.1, 32]} />
      </mesh>

      {/* Royal base ring */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={royalAccentMaterial} castShadow>
        <torusGeometry args={[0.17, 0.02, 16, 32]} />
      </mesh>

      {/* Flowing lower body */}
      <mesh position={[0, 0.18, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.15, 0.16, 32]} />
      </mesh>

      {/* Elegant waist accent */}
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} material={royalAccentMaterial} castShadow>
        <torusGeometry args={[0.12, 0.015, 16, 32]} />
      </mesh>

      {/* Graceful middle section */}
      <mesh position={[0, 0.3, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.11, 0.12, 32]} />
      </mesh>

      {/* Royal decorative band */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={royalAccentMaterial} castShadow>
        <torusGeometry args={[0.09, 0.015, 16, 32]} />
      </mesh>

      {/* Refined upper body */}
      <mesh position={[0, 0.4, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 32]} />
      </mesh>

      {/* Crown base with liquid glass */}
      <mesh position={[0, 0.47, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 32]} />
      </mesh>

      {/* Spline-based crown points using extruded profiles */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 10) * Math.PI * 2) * 0.085,
            0.52 + (i % 2 === 0 ? 0.08 : 0.05),
            Math.sin((i / 10) * Math.PI * 2) * 0.085,
          ]}
          rotation={[0, (i / 10) * Math.PI * 2, 0]}
          material={liquidGlassMaterial}
          castShadow
        >
          <extrudeGeometry 
            args={[
              crownProfile, 
              { 
                depth: 0.03,
                bevelEnabled: true,
                bevelSegments: 6,
                steps: 6,
                bevelSize: 0.002,
                bevelThickness: 0.002,
                curveSegments: 20
              }
            ]} 
          />
        </mesh>
      ))}

      {/* Crown jewels with diamond-like liquid glass */}
      {[0, 2, 4, 6, 8].map((i) => (
        <mesh
          key={`jewel-${i}`}
          position={[
            Math.cos((i / 10) * Math.PI * 2) * 0.075,
            0.5,
            Math.sin((i / 10) * Math.PI * 2) * 0.075,
          ]}
          material={jewelMaterial}
          castShadow
        >
          <octahedronGeometry args={[0.015, 0]} />
        </mesh>
      ))}

      {/* Central royal jewel */}
      <mesh position={[0, 0.62, 0]} material={jewelMaterial} castShadow>
        <octahedronGeometry args={[0.03, 1]} />
      </mesh>

      {/* Royal orb with liquid glass */}
      <mesh position={[0, 0.66, 0]} material={liquidGlassMaterial} castShadow receiveShadow>
        <sphereGeometry args={[0.018, 32, 24]} />
      </mesh>

      {/* Liquid glass energy aura */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 0.25 + Math.sin(i * 0.8) * 0.04;
        const height = 0.2 + Math.sin(i * 0.6) * 0.25;
        return (
          <mesh
            key={`aura-${i}`}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
            material={jewelMaterial}
            castShadow
          >
            <sphereGeometry args={[0.002 + Math.sin(i * 0.4) * 0.001, 12, 8]} />
          </mesh>
        );
      })}

      {/* Floating royal wisps */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.2;
        return (
          <mesh
            key={`wisp-${i}`}
            position={[
              Math.cos(angle) * radius,
              0.4 + Math.sin(angle * 1.3) * 0.1,
              Math.sin(angle) * radius
            ]}
            rotation={[angle * 0.4, angle, 0]}
            material={liquidGlassMaterial}
            castShadow
          >
            <capsuleGeometry args={[0.0015, 0.03, 4, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
