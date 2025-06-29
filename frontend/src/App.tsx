import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { Arena } from './components/3d/Arena'
import { PlayerList } from './components/Game/PlayerList'
import { ArenaSelector } from './components/UI/ArenaSelector'
import { AvatarCustomization } from './components/Game/AvatarCustomization'
import { useGameStore } from './stores/gameStore'
import { useAvatarStore } from './stores/avatarStore'
import './index.css'

type GameState = 'menu' | 'avatar-customization' | 'arena-selection' | 'game'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const { currentGame } = useGameStore()
  const { myAvatar } = useAvatarStore()

  const handleStartGame = () => {
    if (!myAvatar) {
      setGameState('avatar-customization')
    } else {
      setGameState('arena-selection')
    }
  }

  const handleAvatarComplete = () => {
    setGameState('arena-selection')
  }

  const handleArenaSelected = () => {
    setGameState('game')
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 text-blue-400">Arcane Chess</h1>
          <p className="text-xl mb-8 text-gray-300">
            Enter the magical world of 3D chess
          </p>
          <button
            onClick={handleStartGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  if (gameState === 'avatar-customization') {
    return (
      <div className="min-h-screen bg-gray-900">
        <AvatarCustomization onComplete={handleAvatarComplete} />
      </div>
    )
  }

  if (gameState === 'arena-selection') {
    return (
      <div className="min-h-screen bg-gray-900">
        <ArenaSelector onArenaSelected={handleArenaSelected} />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white">
      <div className="h-full flex">
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
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <PlayerList 
            players={[]}
            currentGame={currentGame}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default App