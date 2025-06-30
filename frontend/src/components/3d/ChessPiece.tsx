import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as ChessPieceType } from "../../types";
import { Pawn } from "./pieces/Pawn";
import { Rook } from "./pieces/Rook";
import { Knight } from "./pieces/Knight";
import { Bishop } from "./pieces/Bishop";
import { Queen } from "./pieces/Queen";
import { King } from "./pieces/King";

interface ChessPieceProps {
  piece: ChessPieceType;
  position: [number, number, number];
  square?: string; // Board square identifier (e.g., "e4")
  isSelected: boolean;
  onClick: () => void;
  interactive: boolean;
}

// Liquid Glass Material with enhanced effects
const createLiquidGlassMaterial = (color: "white" | "black") => {
  const isWhite = color === "white";

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uAccentColor;
    uniform float uOpacity;
    uniform bool uIsWhite;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    // Enhanced noise function
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }
    
    // 3D noise with more complexity
    float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = mix(
        mix(mix(noise(i), noise(i + vec3(1,0,0)), f.x),
            mix(noise(i + vec3(0,1,0)), noise(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(noise(i + vec3(0,0,1)), noise(i + vec3(1,0,1)), f.x),
            mix(noise(i + vec3(0,1,1)), noise(i + vec3(1,1,1)), f.x), f.y), f.z);
      
      return n;
    }
    
    void main() {
      vec3 viewDirection = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Enhanced Fresnel effect
      float fresnel = pow(1.0 - dot(normal, viewDirection), 1.8);
      
      // More complex liquid animation
      float time = uTime * 0.4;
      vec3 noisePos = vWorldPosition * 1.5 + time * 0.5;
      float liquidNoise = noise3D(noisePos) * 0.4 + 
                         noise3D(noisePos * 2.0) * 0.25 + 
                         noise3D(noisePos * 4.0) * 0.15;
      
      // Different effects for white vs black pieces
      vec3 baseColor = uColor;
      vec3 accentColor = uAccentColor;
      
      if (uIsWhite) {
        // White pieces: warm, golden liquid glass with pearl-like shimmer
        vec3 shimmer = vec3(1.0, 0.95, 0.85) * (sin(time * 2.0 + vWorldPosition.y * 10.0) * 0.1 + 0.9);
        baseColor = mix(baseColor, shimmer, fresnel * 0.3);
        
        // Golden veining effect
        float veining = sin(vWorldPosition.x * 8.0 + time) * sin(vWorldPosition.z * 8.0 + time * 0.7);
        baseColor = mix(baseColor, vec3(0.9, 0.8, 0.6), veining * 0.1);
      } else {
        // Black pieces: deep mystical liquid with purple/blue shimmer
        vec3 mysticalShimmer = vec3(0.3, 0.2, 0.6) * (sin(time * 1.5 + vWorldPosition.y * 12.0) * 0.2 + 0.8);
        baseColor = mix(baseColor, mysticalShimmer, fresnel * 0.4);
        
        // Mystical energy lines
        float energy = sin(vWorldPosition.x * 6.0 + time * 2.0) * sin(vWorldPosition.z * 6.0 + time * 1.3);
        baseColor = mix(baseColor, vec3(0.2, 0.1, 0.4), energy * 0.15);
      }
      
      // Create enhanced liquid glass effect
      vec3 liquidColor = mix(baseColor, accentColor, liquidNoise + fresnel * 0.6);
      
      // Enhanced rim lighting
      float rimLight = pow(fresnel, 2.5);
      liquidColor += rimLight * accentColor * 0.7;
      
      // Dynamic transparency with more character
      float alpha = uOpacity + fresnel * 0.25 + liquidNoise * 0.08;
      alpha = clamp(alpha, 0.75, 0.95);
      
      // Add depth and richness
      liquidColor = mix(liquidColor, liquidColor * liquidColor, 0.3);
      
      gl_FragColor = vec4(liquidColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: {
        value: isWhite
          ? new THREE.Color(0.98, 0.96, 0.94) // Warm ivory white with personality
          : new THREE.Color(0.02, 0.02, 0.08), // Deep mystical black
      },
      uAccentColor: {
        value: isWhite
          ? new THREE.Color(0.85, 0.82, 0.75) // Rich golden-white accent
          : new THREE.Color(0.3, 0.15, 0.45), // Deep purple accent
      },
      uOpacity: { value: 0.88 },
      uIsWhite: { value: isWhite },
    },
    transparent: true,
    depthWrite: true,
    blending: THREE.NormalBlending,
    side: THREE.FrontSide,
  });
};

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  position,
  square, // Board square identifier - could be useful for debugging or advanced features
  isSelected,
  onClick,
  interactive,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create liquid glass material
  const material = useMemo(
    () => createLiquidGlassMaterial(piece.color),
    [piece.color]
  );

  // Get piece symbol for display
  const getPieceSymbol = (type: string) => {
    // Handle both single letter and full name formats
    const normalizedType = type.toLowerCase();
    
    switch (normalizedType) {
      case "p":
      case "pawn": return "♟";
      case "r":
      case "rook": return "♜";
      case "n":
      case "knight": return "♞";
      case "b":
      case "bishop": return "♝";
      case "q":
      case "queen": return "♛";
      case "k":
      case "king": return "♚";
      default: 
        console.warn('Unknown piece type:', type);
        return "?";
    }
  };

  // Get the modular component for this piece type
  const renderPieceComponent = () => {
    const commonProps = {
      color: piece.color,
      isSelected,
      material,
    };

    // Handle both single letter and full name formats
    const normalizedType = piece.type.toLowerCase();

    switch (normalizedType) {
      case "p":
      case "pawn":
        return <Pawn {...commonProps} position={[0, 0, 0]} />;
      case "r":
      case "rook":
        return <Rook {...commonProps} position={[0, 0, 0]} />;
      case "n":
      case "knight":
        return <Knight {...commonProps} position={[0, 0, 0]} />;
      case "b":
      case "bishop":
        return <Bishop {...commonProps} position={[0, 0, 0]} />;
      case "q":
      case "queen":
        return <Queen {...commonProps} position={[0, 0, 0]} />;
      case "k":
      case "king":
        return <King {...commonProps} position={[0, 0, 0]} />;
      default:
        console.warn('Unknown piece type, defaulting to pawn:', piece.type);
        return <Pawn {...commonProps} position={[0, 0, 0]} />;
    }
  };

  // Animation loop
  useFrame((state) => {
    if (material.uniforms?.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (groupRef.current) {
      // Scale effects for interaction
      if (isSelected) {
        groupRef.current.scale.setScalar(1.05);
      } else {
        groupRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Main piece group - sits properly on the board */}
      <group
        ref={groupRef}
        position={[0, 0, 0]} // Pieces sit directly on the board surface (y=0)
        onClick={interactive ? onClick : undefined}
        onPointerEnter={() => {
          if (interactive) {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        {renderPieceComponent()}
      </group>

      {/* Interaction glow for possible moves */}
      {interactive && (
        <mesh position={[0, 0.002, 0]}> {/* Just above board surface */}
          <cylinderGeometry args={[0.25, 0.25, 0.005, 32]} />
          <meshBasicMaterial
            color={piece.color === "white" ? "#60a5fa" : "#fbbf24"}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Piece type symbol for identification - positioned above tallest piece */}
      <Text
        position={[0, 0.9, 0]} // High above the pieces
        fontSize={0.12}
        color={piece.color === "white" ? "#d4af37" : "#ffffff"} // Gold for white, white for black
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor={piece.color === "white" ? "#8b7355" : "#000000"}
      >
        {getPieceSymbol(piece.type)}
      </Text>
    </group>
  );
};
