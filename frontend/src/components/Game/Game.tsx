
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { Arena } from '../3d/Arena';
import { PlayerList } from './PlayerList';
import { Chat } from '../Chat/Chat';
import { Header } from '../UI/Header';
import { useGameStore } from '../../stores/gameStore';
import { useFirstPersonCamera } from '../../hooks/useAvatarCamera';
import { useAvatarStore } from '../../stores/avatarStore';
import { RapierRigidBody } from '@react-three/rapier';

export function Game() {
  const { currentGame } = useGameStore();
  const { myAvatarState, updateMyPosition, setIsFirstPerson } = useAvatarStore();
  const avatarRigidBodyRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        setIsFirstPerson(!myAvatarState?.is_first_person);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [myAvatarState?.is_first_person, setIsFirstPerson]);

  useFirstPersonCamera(
    avatarRigidBodyRef,
    (moving, speed) => {
      // You can use this to trigger avatar animations (walk, run, idle)
      // For now, we'll just update the isMoving state in the store
      // updateMyPosition(myAvatarState?.position, myAvatarState?.rotation, myAvatarState?.is_first_person, moving);
    }
  );

  return (
    <div className="h-screen bg-gray-900 text-white">
      <Header />
      <div className="h-full flex pt-16">
        {/* 3D Game Canvas */}
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [0, 10, 10], fov: 60 }}
            shadows
            className="w-full h-full"
          >
            <Suspense fallback={null}>
              <Environment preset="night" />
              <ambientLight intensity={0.3} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              {!myAvatarState?.is_first_person && (
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxPolarAngle={Math.PI / 2}
                  minDistance={5}
                  maxDistance={50}
                />
              )}
              <Arena isFirstPerson={myAvatarState?.is_first_person} avatarRigidBodyRef={avatarRigidBodyRef} />
            </Suspense>
          </Canvas>
          
          {/* Game UI Overlay */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black bg-opacity-50 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-2">Game Status</h2>
              {currentGame ? (
                <div>
                  <p>Status: {currentGame.status}</p>
                  <p>Turn: {currentGame.current_turn}</p>
                </div>
              ) : (
                <p>No active game</p>
              )}
            </div>
          </div>

          {/* Chat/Controls */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black bg-opacity-50 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                Use WASD to move • Click pieces to select • Right-click to rotate camera
              </p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="flex-1 p-4">
            <PlayerList 
              players={[]}
              currentGame={currentGame}
              onClose={() => {}}
            />
          </div>
          <div className="flex-1 p-4 border-t border-gray-700">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}