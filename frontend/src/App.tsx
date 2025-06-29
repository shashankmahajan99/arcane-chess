import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ChessBoard } from "./components/3d/ChessBoard";
import { OrbitControls, Grid, KeyboardControls } from "@react-three/drei";
import { useFreeRoamCamera } from "./hooks/useFreeRoamCamera";

// Camera component to use the free roam hook
function CameraController({ controlMode }: { controlMode: 'camera' | 'avatar' }) {
  useFreeRoamCamera(controlMode === 'camera');
  return null;
}

function App() {
  const [controlMode, setControlMode] = useState<'camera' | 'avatar'>('camera');

  // Toggle control mode with Tab key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        setControlMode(prev => prev === 'camera' ? 'avatar' : 'camera');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="bg-gray-900 text-white w-screen h-screen overflow-hidden relative"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Control mode indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
        <div className="text-sm font-bold">
          Mode: {controlMode === 'camera' ? 'Camera' : 'Avatar'} Control
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {controlMode === 'camera' 
            ? 'Mouse: Look • WASD: Move • Scroll: Zoom • Tab: Switch to avatar'
            : 'WASD: Move avatar • Tab: Switch to camera'
          }
        </div>
      </div>
      
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
        <Canvas camera={{ position: [0, 10, 10], fov: 75 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Camera controller for free roam */}
            <CameraController controlMode={controlMode} />
            
            {/* Orbit controls - only enabled in camera mode for mouse look */}
            <OrbitControls 
              enabled={controlMode === 'camera'}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={25}
            />
            
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
              scale={1.5} 
              controlMode={controlMode}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default App;
