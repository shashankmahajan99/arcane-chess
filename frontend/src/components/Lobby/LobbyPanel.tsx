import React, { useState } from 'react';
import { useLobbyStore } from '../../stores/lobbyStore';
import { useAuthStore } from '../../stores/authStore';
import { Arena, Game } from '../../types';

const ArenaCard: React.FC<{ arena: Arena; onJoin: (id: string) => void }> = ({ arena, onJoin }) => {
  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'classic': return '♟️';
      case 'mystic': return '🔮';
      case 'future': return '🤖';
      case 'nature': return '🌿';
      case 'fire': return '🔥';
      case 'ice': return '❄️';
      default: return '♟️';
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'classic': return 'border-yellow-500 bg-yellow-900/20';
      case 'mystic': return 'border-purple-500 bg-purple-900/20';
      case 'future': return 'border-cyan-500 bg-cyan-900/20';
      case 'nature': return 'border-green-500 bg-green-900/20';
      case 'fire': return 'border-red-500 bg-red-900/20';
      case 'ice': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all hover:border-opacity-100 ${getThemeColor(arena.theme)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getThemeIcon(arena.theme)}</span>
          <h3 className="font-bold text-white">{arena.name}</h3>
        </div>
        <span className="text-green-400 text-sm font-medium">
          {Math.floor(Math.random() * 30) + 10} players
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-3">{arena.description}</p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Max: {arena.max_players} players • {arena.max_games} games
        </div>
        <button
          onClick={() => onJoin(arena.id)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Join Arena
        </button>
      </div>
    </div>
  );
};

const GameListItem: React.FC<{ game: Game; onJoin: (id: string) => void; onSpectate: (id: string) => void }> = ({ 
  game, 
  onJoin, 
  onSpectate 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400';
      case 'active': return 'text-green-400';
      case 'finished': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for player';
      case 'active': return 'In progress';
      case 'finished': return 'Finished';
      default: return status;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-white font-medium">Game #{game.id.slice(-6)}</span>
          <span className={`text-xs ${getStatusColor(game.status)}`}>
            {getStatusText(game.status)}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {game.white_player?.username || 'Waiting...'} vs {game.black_player?.username || 'Waiting...'}
        </div>
        <div className="text-xs text-gray-500">
          Time: {Math.floor(game.time_control / 60)}min • Move: {game.move_count}
        </div>
      </div>
      <div className="flex space-x-2">
        {game.status === 'waiting' && (
          <button
            onClick={() => onJoin(game.id)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
          >
            Join
          </button>
        )}
        <button
          onClick={() => onSpectate(game.id)}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
        >
          {game.status === 'active' ? 'Watch' : 'View'}
        </button>
      </div>
    </div>
  );
};

export const LobbyPanel: React.FC = () => {
  const {
    currentArena,
    availableArenas,
    activeGames,
    isInLobby,
    isSearchingForGame,
    estimatedWaitTime,
    joinArena,
    leaveArena,
    startMatchmaking,
    stopMatchmaking,
    createGame,
    joinGame,
    spectateGame,
    toggleCreateGameModal,
  } = useLobbyStore();

  const { isAuthenticated } = useAuthStore();
  const [selectedTimeControl, setSelectedTimeControl] = useState(600); // 10 minutes

  if (!isInLobby) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-40 flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Arcane Chess</h1>
            <p className="text-gray-300 text-lg">Choose an arena to begin your magical chess journey</p>
          </div>

          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
              <p className="text-yellow-300 text-center">
                🚧 You're in guest mode with limited features. Sign in for the full experience!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableArenas.map((arena) => (
              <ArenaCard
                key={arena.id}
                arena={arena}
                onJoin={joinArena}
              />
            ))}
          </div>

          {availableArenas.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">🏗️</div>
              <p>Arenas are being prepared. Please wait...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-30 bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-600 bg-gray-750">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{currentArena?.name}</h3>
            <p className="text-sm text-gray-400">Lobby • {activeGames.length} active games</p>
          </div>
          <button
            onClick={leaveArena}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-80">
        {/* Matchmaking Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-white">Quick Match</h4>
          
          {!isSearchingForGame ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Time Control</label>
                <select
                  value={selectedTimeControl}
                  onChange={(e) => setSelectedTimeControl(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={180}>3 minutes</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={900}>15 minutes</option>
                  <option value={1800}>30 minutes</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startMatchmaking(selectedTimeControl)}
                  disabled={!isAuthenticated}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-colors"
                >
                  Find Match
                </button>
                <button
                  onClick={toggleCreateGameModal}
                  disabled={!isAuthenticated}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Create
                </button>
              </div>
              
              {!isAuthenticated && (
                <p className="text-xs text-gray-400 text-center">Sign in to play games</p>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white">Searching for opponent...</span>
              </div>
              <p className="text-sm text-gray-400">Estimated wait: {estimatedWaitTime}s</p>
              <button
                onClick={stopMatchmaking}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>

        {/* Active Games */}
        <div className="space-y-3">
          <h4 className="font-medium text-white flex items-center justify-between">
            Active Games
            <span className="text-sm text-gray-400">{activeGames.length}</span>
          </h4>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeGames.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">
                No active games. Start one!
              </p>
            ) : (
              activeGames.map((game) => (
                <GameListItem
                  key={game.id}
                  game={game}
                  onJoin={joinGame}
                  onSpectate={spectateGame}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};