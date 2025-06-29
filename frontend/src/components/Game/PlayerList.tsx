import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  
  StarIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  
} from '@heroicons/react/24/outline';
import { AvatarState, Game, User } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { useAvatarStore } from '../../stores/avatarStore';

// Helper functions for status display
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'online': return '🟢'
    case 'playing': return '⚔️'
    case 'spectating': return '👁️'
    case 'you': return '👤'
    default: return '⚪'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return 'text-green-400'
    case 'playing': return 'text-blue-400'
    case 'spectating': return 'text-yellow-400'
    case 'you': return 'text-purple-400'
    default: return 'text-gray-400'
  }
}

interface PlayerListProps {
  players: AvatarState[];
  currentGame: Game | null;
  onClose: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentGame,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<'arena' | 'game'>('arena');
  const { currentUser } = useGameStore();
  const { myAvatarState } = useAvatarStore();

  // Combine current user with other players
  const allPlayers = myAvatarState ? [myAvatarState, ...players] : players;

  


  const handlePlayerAction = (playerId: string, action: 'challenge' | 'spectate' | 'message' | 'report') => {
    switch (action) {
      case 'challenge':
        console.log(`Challenge sent to ${playerId}`);
        break;
      case 'spectate':
        console.log(`Spectating ${playerId}`);
        break;
      case 'message':
        console.log(`Opening chat with ${playerId}`);
        break;
      case 'report':
        console.log(`Reporting ${playerId}`);
        break;
    }
  };

  const getPlayerStatus = (player: AvatarState) => {
    if (player.user_id === currentUser?.id) return 'you';
    if (currentGame?.white_player_id === player.user_id || 
        currentGame?.black_player_id === player.user_id) return 'playing';
    return 'available';
  };


  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="font-game text-white">Players</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setSelectedTab('arena')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            selectedTab === 'arena'
              ? 'text-white bg-slate-800 border-b-2 border-magic-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Arena ({allPlayers.length})
        </button>
        {currentGame && (
          <button
            onClick={() => setSelectedTab('game')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === 'game'
                ? 'text-white bg-slate-800 border-b-2 border-magic-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Game (2)
          </button>
        )}
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {selectedTab === 'arena' && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {allPlayers.map((player) => {
                const status = getPlayerStatus(player);
                const isCurrentUser = player.user_id === currentUser?.id;
                
                return (
                  <PlayerCard
                    key={player.user_id}
                    player={player}
                    status={status}
                    isCurrentUser={isCurrentUser}
                    onAction={handlePlayerAction}
                  />
                );
              })}
            </motion.div>
          )}

          {selectedTab === 'game' && currentGame && (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* White Player */}
              {currentGame.white_player && (
                <GamePlayerCard
                  player={currentGame.white_player}
                  color="white"
                  isCurrentTurn={currentGame.current_turn === 'white'}
                  timeLeft={currentGame.white_time}
                />
              )}

              {/* Black Player */}
              {currentGame.black_player && (
                <GamePlayerCard
                  player={currentGame.black_player}
                  color="black"
                  isCurrentTurn={currentGame.current_turn === 'black'}
                  timeLeft={currentGame.black_time}
                />
              )}

              {/* Game Info */}
              <div className="bg-slate-800/50 rounded-lg p-3 mt-4">
                <h4 className="text-white font-medium mb-2">Game Status</h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>Status: <span className="text-green-400">{currentGame.status}</span></div>
                  <div>Move: <span className="text-white">{currentGame.move_count + 1}</span></div>
                  <div>Time Control: <span className="text-white">{Math.floor(currentGame.time_control / 60)} min</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Individual Player Card Component
const PlayerCard: React.FC<{
  player: AvatarState;
  status: string;
  isCurrentUser: boolean;
  onAction: (playerId: string, action: 'challenge' | 'spectate' | 'message' | 'report') => void;
}> = ({ player, status, isCurrentUser, onAction }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar Preview */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            player.model_type === 'wizard' ? 'bg-purple-600' :
            player.model_type === 'knight' ? 'bg-blue-600' :
            player.model_type === 'dragon' ? 'bg-red-600' :
            'bg-gray-600'
          }`}>
            {player.model_type === 'wizard' ? '🧙‍♂️' :
             player.model_type === 'knight' ? '⚔️' :
             player.model_type === 'dragon' ? '🐉' : '👤'}
          </div>

          {/* Player Info */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{player.user_id}</span>
              <span className="text-lg">{getStatusIcon(status)}</span>
              {isCurrentUser && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  YOU
                </span>
              )}
            </div>
            <div className={`text-xs ${getStatusColor(status)}`}>
              {status === 'you' ? 'Your avatar' :
               status === 'playing' ? 'In game' :
               'Available'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {showActions && !isCurrentUser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex space-x-1"
            >
              <button
                onClick={() => onAction(player.user_id, 'challenge')}
                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                title="Challenge"
              >
                <StarIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onAction(player.user_id, 'spectate')}
                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                title="Spectate"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onAction(player.user_id, 'message')}
                className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
                title="Message"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Game Player Card Component
const GamePlayerCard: React.FC<{
  player: User;
  color: 'white' | 'black';
  isCurrentTurn: boolean;
  timeLeft: number;
}> = ({ player, color, isCurrentTurn, timeLeft }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 border-2 transition-colors ${
      isCurrentTurn ? 'border-green-500 bg-green-900/20' : 'border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Color Indicator */}
          <div className={`w-8 h-8 rounded-full border-2 ${
            color === 'white' 
              ? 'bg-white border-gray-300' 
              : 'bg-gray-800 border-gray-600'
          }`} />
          
          {/* Player Info */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{player.username}</span>
              {isCurrentTurn && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="text-sm text-gray-400">
              Rating: {player.rating}
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className={`text-right ${
          timeLeft < 60 ? 'text-red-400' : 
          timeLeft < 300 ? 'text-yellow-400' : 
          'text-white'
        }`}>
          <div className="font-mono text-lg font-bold">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-400">
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
};
