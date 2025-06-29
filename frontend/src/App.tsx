import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ChessBoard } from "./components/3d/ChessBoard";
import { OrbitControls, Grid, KeyboardControls } from "@react-three/drei";
import { CameraController } from "./components/3d/CameraController";
import { DummyAvatar } from "./components/3d/Avatar";
import { FirstPersonState } from "./hooks/useAvatarCamera";


// Camera component to use the free roam hook


function App() {
  const [controlMode, setControlMode] = useState<'camera' | 'first-person'>('first-person');
  const [firstPersonState, setFirstPersonState] = useState<FirstPersonState | undefined>();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Toggle control mode with Tab key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        
        // Add transition effect
        setIsTransitioning(true);
        setTimeout(() => {
          setControlMode(prev => prev === 'camera' ? 'first-person' : 'camera');
          setTimeout(() => setIsTransitioning(false), 100);
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          <div className={`w-2 h-2 rounded-full mr-2 ${controlMode === 'camera' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
          Mode: {controlMode === 'camera' ? 'Free Camera' : 'First Person'} Control
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {controlMode === 'camera' 
            ? 'Mouse: Look around • WASD: Move • Scroll: Zoom • Tab: Switch to first person'
            : 'Click to lock cursor • Mouse: Look around • WASD: Move • Shift: Run • Tab: Switch to camera'
          }
        </div>
        {controlMode === 'first-person' && firstPersonState && (
          <div className="text-xs text-yellow-300 mt-1">
            Position: ({firstPersonState.position[0].toFixed(1)}, {firstPersonState.position[2].toFixed(1)}) • 
            Speed: {firstPersonState.speed.toFixed(1)} • 
            {firstPersonState.isMoving ? 'Moving' : 'Stationary'}
          </div>
        )}
      </div>
      
      {/* Crosshair for first-person mode */}
      {controlMode === 'first-person' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative">
            <div className="absolute w-4 h-0.5 bg-white opacity-60 -translate-x-2"></div>
            <div className="absolute h-4 w-0.5 bg-white opacity-60 -translate-y-2"></div>
          </div>
        </div>
      )}
      
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
          { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
          { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
          { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
          { name: 'jump', keys: ['Space'] },
          { name: 'run', keys: ['Shift'] },
        ]}
      >
        <Canvas camera={{ position: [0, 15, 15], fov: 75 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Camera controller for both modes */}
            <CameraController 
              controlMode={controlMode} 
              onFirstPersonStateChange={setFirstPersonState}
              initialPosition={[3 * 2.5, 0.11 * 2.5, 3 * 2.5]} // square elevation .11 * board scale
            />

            {/* Orbit controls - only enabled in camera mode for mouse look */}
            <OrbitControls 
              enabled={controlMode === 'camera'}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={50}
            />
            
            {/* Dummy avatar body for first-person mode */}
            {controlMode === 'first-person' && firstPersonState && (
              <DummyAvatar
                position={firstPersonState.position}
                isCurrentUser={true}
                isControllable={true}
                isFirstPerson={true}
                movementState={firstPersonState}
              />
            )}

            <Grid 
              args={[20, 20]} 
              cellSize={1} 
              cellThickness={0.5} 
              cellColor="#6b7280" 
              sectionSize={5} 
              sectionThickness={1} 
              sectionColor="#9ca3af"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />
            
            <ChessBoard 
              scale={2.5} 
              controlMode={controlMode}
              firstPersonState={firstPersonState}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
