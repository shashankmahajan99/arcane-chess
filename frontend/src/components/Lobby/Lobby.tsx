
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { Arena } from '../3d/Arena';
import { PlayerList } from '../Game/PlayerList';
import { Chat } from '../Chat/Chat';
import { Modal } from '../UI/Modal';
import { Header } from '../UI/Header';
import { useGameStore } from '../../stores/gameStore';

interface LobbyProps {
  onEnterGame: () => void;
}

export function Lobby({ onEnterGame }: LobbyProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentGame } = useGameStore();

  const handleFindMatch = () => {
    setIsModalOpen(true);
  };

  const handleConfirmMatch = () => {
    setIsModalOpen(false);
    onEnterGame();
  };

  return (
    <>
      <Header />
      <div className="h-screen bg-gray-900 text-white">
        <div className="h-full flex pt-16">
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
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxPolarAngle={Math.PI / 2}
                  minDistance={5}
                  maxDistance={50}
                />
                <Arena />
              </Suspense>
            </Canvas>
            
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-black bg-opacity-50 rounded-lg p-4">
                <h2 className="text-xl font-bold mb-2">Lobby</h2>
                <p>Explore the arena and challenge other players.</p>
                <button
                  onClick={handleFindMatch}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Find Match
                </button>
              </div>
            </div>
          </div>

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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-4">Start a New Game?</h2>
        <p className="mb-6">Are you sure you want to find a match and start a new game?</p>
        <div className="flex justify-end">
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmMatch} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Confirm
          </button>
        </div>
      </Modal>
    </>
  );
}
