import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ChessBoard } from "./components/3d/ChessBoard";
import { OrbitControls, Grid } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { AvatarBuilder } from "./components/3d/Avatar/AvatarBuilder";
import { AvatarSelector } from "./components/3d/Avatar/AvatarSelector";
import { DEFAULT_AVATARS, AvatarConfig } from "./components/3d/Avatar/AvatarConfig";
import { useCameraSystem, AvatarMovementState } from "./hooks/useCameraSystem";
import { useGameStore } from "./stores/gameStore";
import * as THREE from 'three';

// Camera Controller Component
const CameraController: React.FC<{
  mode: 'free-camera' | 'first-person';
  onMovementChange: (state: AvatarMovementState) => void;
}> = ({ mode, onMovementChange }) => {
  useCameraSystem({
    mode,
    onMovementChange,
    initialPosition: [7.5, 0.3, 7.5], // Start on the scaled chess board
    boardScale: 6
  });
  return null;
};

function App() {
  const [controlMode, setControlMode] = useState<'free-camera' | 'first-person'>('first-person');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState('wizard');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATARS.wizard);
  
  // Initialize chess game
  const { initializeChess } = useGameStore();
  
  // Avatar movement state
  const [avatarState, setAvatarState] = useState<AvatarMovementState>({
    position: [7.5, 0.3, 7.5],
    isMoving: false,
    speed: 0,
    direction: 0
  });

  // Initialize chess game on component mount
  useEffect(() => {
    initializeChess(); // This will create a new chess game with the starting position
  }, [initializeChess]);

  // Toggle control mode with Tab key and avatar selector with C key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        
        setIsTransitioning(true);
        setTimeout(() => {
          setControlMode(prev => prev === 'free-camera' ? 'first-person' : 'free-camera');
          setTimeout(() => setIsTransitioning(false), 200);
        }, 100);
      } else if (event.code === 'KeyC') {
        event.preventDefault();
        setShowAvatarSelector(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle avatar change
  const handleAvatarChange = (avatarKey: string, config: AvatarConfig) => {
    setSelectedAvatarKey(avatarKey);
    setAvatarConfig(config);
    setShowAvatarSelector(false);
  };

  return (
    <div
      className="bg-gray-900 text-white w-screen h-screen overflow-hidden relative"
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    >
      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="text-white text-lg font-bold">Switching camera mode...</div>
        </div>
      )}
      {/* Control mode indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <div className="text-sm font-bold flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${controlMode === 'free-camera' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
          Mode: {controlMode === 'free-camera' ? 'Free Camera' : 'First Person'} Control
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {controlMode === 'free-camera'
            ? 'Mouse: Orbit • Scroll: Zoom • Tab: Switch to first person • C: Avatar'
            : 'Click to lock cursor • Mouse: Look around • WASD: Move • Shift: Run • Tab: Switch to camera • C: Avatar'
          }
        </div>
        {controlMode === 'first-person' && (
          <div className="text-xs text-orange-300 mt-1">
            {typeof document !== 'undefined' && document.pointerLockElement 
              ? '🔒 Mouse locked - move to look around' 
              : '👆 Click canvas to lock mouse for look controls'
            }
          </div>
        )}
        <div className="text-xs text-yellow-300 mt-1">
          Position: ({avatarState.position[0].toFixed(1)}, {avatarState.position[2].toFixed(1)}) • 
          Speed: {avatarState.speed.toFixed(1)} • 
          {avatarState.isMoving ? 'Moving' : 'Stationary'}
        </div>
      </div>
      
      {/* Avatar Selector */}
      {showAvatarSelector && (
        <AvatarSelector
          selectedAvatar={selectedAvatarKey}
          onAvatarChange={handleAvatarChange}
          className="absolute top-4 right-4 z-10 w-80"
        />
      )}
      
      {/* Crosshair for first-person mode */}
      {controlMode === 'first-person' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            <div className="absolute w-4 h-0.5 bg-white opacity-60 -translate-x-2"></div>
            <div className="absolute h-4 w-0.5 bg-white opacity-60 -translate-y-2"></div>
          </div>
        </div>
      )}
      
      <Canvas 
        camera={{ position: [15, 20, 15], fov: 75, near: 0.01, far: 1000 }}
        style={{ display: 'block', outline: 'none' }}
        tabIndex={1}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[0, 10, 0]} intensity={0.3} color="#60a5fa" />
          
          <Physics gravity={[0, -9.81, 0]} debug={false}>
            {/* Camera controller */}
            <CameraController 
              mode={controlMode}
              onMovementChange={setAvatarState}
            />

            {/* Orbit controls for free camera mode */}
            {controlMode === 'free-camera' && (
              <OrbitControls 
                makeDefault
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                enableDamping={true}
                dampingFactor={0.08}
                minDistance={2}
                maxDistance={40}
                maxPolarAngle={Math.PI / 2.1}
                minPolarAngle={0.2}
                target={[avatarState.position[0], avatarState.position[1] + 1.5, avatarState.position[2]]}
                panSpeed={1.5}
                rotateSpeed={0.8}
                zoomSpeed={1.0}
                screenSpacePanning={true}
                mouseButtons={{
                  LEFT: THREE.MOUSE.ROTATE,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.PAN
                }}
              />
            )}
            
            {/* Avatar - always visible */}
            <AvatarBuilder
              config={avatarConfig}
              position={avatarState.position}
              isFirstPerson={controlMode === 'first-person'}
              movementState={{
                isMoving: avatarState.isMoving,
                speed: avatarState.speed,
                direction: avatarState.direction
              }}
              showNameTag={controlMode === 'free-camera'}
              name={`${selectedAvatarKey.charAt(0).toUpperCase() + selectedAvatarKey.slice(1)} Player`}
            />

            {/* Chess Board */}
            <ChessBoard 
              scale={6} 
              controlMode={controlMode === 'free-camera' ? 'camera' : 'first-person'}
            />
            
            {/* Physics ground plane */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
              <boxGeometry args={[100, 0.2, 100]} />
              <meshPhysicalMaterial color="#2d3748" visible={false} />
            </mesh>
          </Physics>

          {/* Environment Grid */}
          <Grid 
            args={[30, 30]} 
            cellSize={1} 
            cellThickness={0.5} 
            cellColor="#4a5568" 
            sectionSize={5} 
            sectionThickness={1} 
            sectionColor="#6b7280"
            fadeDistance={40}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
