import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Sky, Stars, useGLTF, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Arena as ArenaType, ArenaTheme } from '../../types';
import { ChessBoard } from './ChessBoard';
import { Avatar } from './Avatar';
import { useAvatarStore } from '../../stores/avatarStore';

interface ArenaProps {
  arena?: ArenaType;
  children?: React.ReactNode;
}

export const Arena: React.FC<ArenaProps> = ({ arena, children }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { myAvatarState, otherAvatars } = useAvatarStore();

  // Load arena model based on theme with fallback
  const arenaTheme = arena?.theme || 'classic';
  
  // Create fallback arena if model fails to load
  const createFallbackArena = () => {
    return (
      <group>
        {/* Floor */}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <boxGeometry args={[30, 0.2, 30]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        
        {/* Chess board area */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[8, 0.1, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        {/* Audience stands */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 12;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          return (
            <mesh key={i} position={[x, 1, z]} castShadow>
              <boxGeometry args={[2, 2, 1]} />
              <meshStandardMaterial color="#4a5568" />
            </mesh>
          );
        })}
      </group>
    );
  };

  // For now, always use fallback arena since we don't have 3D models
  const arenaModel = null;

  // Theme-based environment settings
  const environmentSettings = useMemo(() => {
    const settings = {
      classic: {
        skyColor: '#87CEEB',
        fogColor: '#87CEEB',
        lightColor: '#ffffff',
        ambientIntensity: 0.4,
        directionalIntensity: 1.0,
        fogDensity: 0.01,
      },
      mystic: {
        skyColor: '#4c1d95',
        fogColor: '#312e81',
        lightColor: '#a855f7',
        ambientIntensity: 0.3,
        directionalIntensity: 0.8,
        fogDensity: 0.02,
      },
      future: {
        skyColor: '#0c4a6e',
        fogColor: '#075985',
        lightColor: '#06b6d4',
        ambientIntensity: 0.5,
        directionalIntensity: 1.2,
        fogDensity: 0.005,
      },
      nature: {
        skyColor: '#065f46',
        fogColor: '#047857',
        lightColor: '#10b981',
        ambientIntensity: 0.6,
        directionalIntensity: 0.9,
        fogDensity: 0.008,
      },
      fire: {
        skyColor: '#7c2d12',
        fogColor: '#9a3412',
        lightColor: '#ea580c',
        ambientIntensity: 0.4,
        directionalIntensity: 1.1,
        fogDensity: 0.015,
      },
      ice: {
        skyColor: '#1e3a8a',
        fogColor: '#1e40af',
        lightColor: '#3b82f6',
        ambientIntensity: 0.5,
        directionalIntensity: 1.0,
        fogDensity: 0.01,
      },
    };
    return settings[arenaTheme] || settings.classic;
  }, [arenaTheme]);

  // Arena boundaries for avatar movement
  const arenaBounds = useMemo(() => ({
    minX: -15,
    maxX: 15,
    minZ: -15,
    maxZ: 15,
    centerX: 0,
    centerZ: 0,
  }), []);

  useFrame((state, delta) => {
    // Gentle arena rotation for dynamic feel
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Environment and Lighting */}
      <Environment preset="sunset" />
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      
      {/* Dynamic Stars for magical themes */}
      {(arenaTheme === 'mystic' || arenaTheme === 'ice') && (
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
      )}

      {/* Atmospheric Fog */}
      <fog 
        attach="fog" 
        args={[environmentSettings.fogColor, 30, 100]} 
      />

      {/* Lighting Setup */}
      <ambientLight 
        color={environmentSettings.lightColor} 
        intensity={environmentSettings.ambientIntensity} 
      />
      
      <directionalLight
        position={[10, 20, 5]}
        color={environmentSettings.lightColor}
        intensity={environmentSettings.directionalIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Spotlight on chess board */}
      <spotLight
        position={[0, 15, 0]}
        angle={0.3}
        penumbra={0.1}
        intensity={1.5}
        color="#ffffff"
        castShadow
        target-position={[0, 0, 0]}
      />

      {/* Arena Stadium Model */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
        {arenaModel ? (
          <primitive 
            object={arenaModel} 
            scale={[2, 2, 2]}
            position={[0, -2, 0]}
          />
        ) : (
          createFallbackArena()
        )}
      </Float>

      {/* Chess Board - Central Focus */}
      <ChessBoard 
        position={[0, 1, 0]}
        scale={1.2}
      />

      {/* Spectator Stands */}
      <SpectatorStands theme={arenaTheme} />

      {/* Interactive Elements */}
      <ArenaDecorations theme={arenaTheme} />

      {/* Avatar Rendering */}
      {myAvatarState && (
        <Avatar
          avatarState={myAvatarState}
          isCurrentUser={true}
        />
      )}

      {Array.from(otherAvatars.values()).map((avatarState) => (
        <Avatar
          key={avatarState.user_id}
          avatarState={avatarState}
          isCurrentUser={false}
        />
      ))}

      {/* Particle Effects */}
      <ArenaParticles theme={arenaTheme} />

      {/* Floor with reflections */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color={environmentSettings.fogColor}
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={1.0}
        />
      </mesh>

      {children}
    </group>
  );
};

// Spectator Stands Component
const SpectatorStands: React.FC<{ theme: ArenaTheme }> = ({ theme }) => {
  const stands = useMemo(() => {
    const standElements = [];
    const radius = 12;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      standElements.push(
        <mesh
          key={i}
          position={[x, 2, z]}
          rotation={[0, angle + Math.PI, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[3, 4, 1]} />
          <meshStandardMaterial
            color={theme === 'mystic' ? '#4c1d95' : '#6b7280'}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      );
    }

    return standElements;
  }, [theme]);

  return <group>{stands}</group>;
};

// Arena Decorations Component
const ArenaDecorations: React.FC<{ theme: ArenaTheme }> = ({ theme }) => {
  const decorations = useMemo(() => {
    switch (theme) {
      case 'mystic':
        return (
          <group>
            {/* Floating Crystals */}
            {Array.from({ length: 6 }, (_, i) => (
              <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2}>
                <mesh position={[
                  Math.cos(i * Math.PI / 3) * 8,
                  4 + Math.sin(i) * 2,
                  Math.sin(i * Math.PI / 3) * 8
                ]}>
                  <octahedronGeometry args={[0.5]} />
                  <meshStandardMaterial
                    color="#a855f7"
                    emissive="#4c1d95"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              </Float>
            ))}
          </group>
        );

      case 'fire':
        return (
          <group>
            {/* Flame Torches */}
            {Array.from({ length: 8 }, (_, i) => (
              <group key={i} position={[
                Math.cos(i * Math.PI / 4) * 10,
                3,
                Math.sin(i * Math.PI / 4) * 10
              ]}>
                <mesh>
                  <cylinderGeometry args={[0.2, 0.2, 4]} />
                  <meshStandardMaterial color="#654321" />
                </mesh>
                <Sparkles
                  count={50}
                  scale={[2, 4, 2]}
                  size={3}
                  speed={2}
                  color="#ea580c"
                />
              </group>
            ))}
          </group>
        );

      case 'nature':
        return (
          <group>
            {/* Tree-like Structures */}
            {Array.from({ length: 5 }, (_, i) => (
              <Float key={i} speed={0.5} rotationIntensity={0.1}>
                <mesh position={[
                  Math.cos(i * Math.PI * 2 / 5) * 9,
                  2,
                  Math.sin(i * Math.PI * 2 / 5) * 9
                ]}>
                  <cylinderGeometry args={[0.3, 0.5, 4]} />
                  <meshStandardMaterial color="#059669" />
                </mesh>
              </Float>
            ))}
          </group>
        );

      default:
        return null;
    }
  }, [theme]);

  return decorations;
};

// Arena Particles Component
const ArenaParticles: React.FC<{ theme: ArenaTheme }> = ({ theme }) => {
  const particleSettings = useMemo(() => {
    switch (theme) {
      case 'mystic':
        return { color: '#a855f7', count: 200, speed: 0.5 };
      case 'fire':
        return { color: '#ea580c', count: 300, speed: 1.0 };
      case 'ice':
        return { color: '#3b82f6', count: 150, speed: 0.3 };
      case 'nature':
        return { color: '#10b981', count: 100, speed: 0.4 };
      default:
        return { color: '#ffffff', count: 50, speed: 0.2 };
    }
  }, [theme]);

  return (
    <Sparkles
      count={particleSettings.count}
      scale={[20, 10, 20]}
      size={2}
      speed={particleSettings.speed}
      color={particleSettings.color}
      opacity={0.6}
    />
  );
};

// Preload arena models
useGLTF.preload('/models/arenas/classic.glb');
useGLTF.preload('/models/arenas/mystic.glb');
useGLTF.preload('/models/arenas/future.glb');
useGLTF.preload('/models/arenas/nature.glb');
useGLTF.preload('/models/arenas/fire.glb');
useGLTF.preload('/models/arenas/ice.glb');
