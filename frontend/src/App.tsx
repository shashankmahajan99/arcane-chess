import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AvatarCustomization } from './components/Game/AvatarCustomization';
import { useAvatarStore } from './stores/avatarStore';
import { Lobby } from './components/Lobby/Lobby';
import { Game } from './components/Game/Game';
import { Particles } from './components/UI/Particles';
import './index.css';

type GameState = 'menu' | 'avatar-customization' | 'lobby' | 'game';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const { myAvatar } = useAvatarStore();

  const handleStartGame = () => {
    if (!myAvatar) {
      setGameState('avatar-customization');
    } else {
      setGameState('lobby');
    }
  };

  const handleAvatarComplete = () => {
    setGameState('lobby');
  };

  const handleEnterGame = () => {
    setGameState('game');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'menu':
        return (
          <div className="min-h-screen bg-gray-900 text-white relative">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <Suspense fallback={null}>
                <Particles />
              </Suspense>
            </Canvas>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-8 text-blue-400" style={{ textShadow: '0 0 10px #00aaff' }}>Arcane Chess</h1>
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
          </div>
        );
      case 'avatar-customization':
        return (
          <div className="min-h-screen bg-gray-900">
            <AvatarCustomization onComplete={handleAvatarComplete} />
          </div>
        );
      case 'lobby':
        return <Lobby onEnterGame={handleEnterGame} />;
      case 'game':
        return <Game />;
      default:
        return null;
    }
  };

  return <>{renderGameState()}</>;
}

export default App;
