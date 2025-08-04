import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Arena, Game, User } from '../types';

interface LobbyState {
  // Lobby state
  currentArena: Arena | null;
  availableArenas: Arena[];
  playersInArena: User[];
  activeGames: Game[];
  isInLobby: boolean;
  
  // Matchmaking state
  isSearchingForGame: boolean;
  matchmakingQueue: User[];
  estimatedWaitTime: number;
  
  // UI state
  selectedArenaId: string | null;
  showArenaSelector: boolean;
  showCreateGameModal: boolean;
  
  // Actions
  joinArena: (arenaId: string) => Promise<boolean>;
  leaveArena: () => void;
  setCurrentArena: (arena: Arena | null) => void;
  updatePlayersInArena: (players: User[]) => void;
  updateActiveGames: (games: Game[]) => void;
  
  // Matchmaking actions
  startMatchmaking: (timeControl?: number) => Promise<boolean>;
  stopMatchmaking: () => void;
  createGame: (opponentId?: string, timeControl?: number) => Promise<Game | null>;
  joinGame: (gameId: string) => Promise<boolean>;
  spectateGame: (gameId: string) => void;
  
  // UI actions
  setSelectedArena: (arenaId: string | null) => void;
  toggleArenaSelector: () => void;
  toggleCreateGameModal: () => void;
  setShowLobby: (show: boolean) => void;
  
  // Helper methods
  getArenaByTheme: (theme: string) => Arena[];
  getGamesByStatus: (status: string) => Game[];
  isPlayerInGame: (playerId: string) => boolean;
}

export const useLobbyStore = create<LobbyState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentArena: null,
    availableArenas: [],
    playersInArena: [],
    activeGames: [],
    isInLobby: false,
    isSearchingForGame: false,
    matchmakingQueue: [],
    estimatedWaitTime: 0,
    selectedArenaId: null,
    showArenaSelector: false,
    showCreateGameModal: false,

    // Actions
    joinArena: async (arenaId: string) => {
      try {
        // TODO: Implement actual API call
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/arenas/${arenaId}/join`, {
        //   method: 'POST',
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        // For development, simulate joining
        const mockArena: Arena = {
          id: arenaId,
          name: `Arena ${arenaId}`,
          theme: 'classic',
          max_players: 50,
          max_games: 10,
          is_public: true,
          description: 'A classic chess arena',
          settings: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({
          currentArena: mockArena,
          isInLobby: true,
          showArenaSelector: false,
        });

        return true;
      } catch (error) {
        console.error('Failed to join arena:', error);
        return false;
      }
    },

    leaveArena: () => {
      set({
        currentArena: null,
        isInLobby: false,
        playersInArena: [],
        activeGames: [],
        isSearchingForGame: false,
      });
      
      // TODO: Notify server about leaving arena
    },

    setCurrentArena: (arena) => {
      set({ currentArena: arena, isInLobby: !!arena });
    },

    updatePlayersInArena: (players) => {
      set({ playersInArena: players });
    },

    updateActiveGames: (games) => {
      set({ activeGames: games });
    },

    // Matchmaking actions
    startMatchmaking: async (timeControl = 600) => {
      try {
        set({ isSearchingForGame: true, estimatedWaitTime: 30 });
        
        // TODO: Implement actual matchmaking via WebSocket
        // websocketService.emit('matchmaking:start', { timeControl });
        
        // For development, simulate finding a match after 3 seconds
        setTimeout(() => {
          if (get().isSearchingForGame) {
            // Simulate match found
            get().stopMatchmaking();
            // Create a mock game
            const mockGame: Game = {
              id: `game-${Date.now()}`,
              arena_id: get().currentArena?.id || 'default',
              status: 'active',
              current_turn: 'white',
              board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              move_count: 0,
              time_control: timeControl,
              white_time: timeControl,
              black_time: timeControl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            set(state => ({
              activeGames: [...state.activeGames, mockGame]
            }));
          }
        }, 3000);

        return true;
      } catch (error) {
        console.error('Failed to start matchmaking:', error);
        set({ isSearchingForGame: false });
        return false;
      }
    },

    stopMatchmaking: () => {
      set({ isSearchingForGame: false, estimatedWaitTime: 0 });
      // TODO: Cancel matchmaking on server
    },

    createGame: async (opponentId?: string, timeControl = 600) => {
      try {
        // TODO: Implement actual game creation
        const mockGame: Game = {
          id: `game-${Date.now()}`,
          arena_id: get().currentArena?.id || 'default',
          status: 'waiting',
          current_turn: 'white',
          board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          move_count: 0,
          time_control: timeControl,
          white_time: timeControl,
          black_time: timeControl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set(state => ({
          activeGames: [...state.activeGames, mockGame],
          showCreateGameModal: false,
        }));

        return mockGame;
      } catch (error) {
        console.error('Failed to create game:', error);
        return null;
      }
    },

    joinGame: async (gameId: string) => {
      try {
        // TODO: Implement actual game joining
        console.log('Joining game:', gameId);
        return true;
      } catch (error) {
        console.error('Failed to join game:', error);
        return false;
      }
    },

    spectateGame: (gameId: string) => {
      // TODO: Implement spectating
      console.log('Spectating game:', gameId);
    },

    // UI actions
    setSelectedArena: (arenaId) => {
      set({ selectedArenaId: arenaId });
    },

    toggleArenaSelector: () => {
      set(state => ({ showArenaSelector: !state.showArenaSelector }));
    },

    toggleCreateGameModal: () => {
      set(state => ({ showCreateGameModal: !state.showCreateGameModal }));
    },

    setShowLobby: (show) => {
      set({ isInLobby: show });
    },

    // Helper methods
    getArenaByTheme: (theme: string) => {
      return get().availableArenas.filter(arena => arena.theme === theme);
    },

    getGamesByStatus: (status: string) => {
      return get().activeGames.filter(game => game.status === status);
    },

    isPlayerInGame: (playerId: string) => {
      return get().activeGames.some(game => 
        game.white_player_id === playerId || game.black_player_id === playerId
      );
    },
  }))
);

// Initialize with mock arenas for development
if (process.env.REACT_APP_ENV === 'development') {
  setTimeout(() => {
    const mockArenas: Arena[] = [
      {
        id: 'classic-arena',
        name: 'Classic Arena',
        theme: 'classic',
        max_players: 50,
        max_games: 10,
        is_public: true,
        description: 'Traditional chess with classic pieces',
        settings: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mystic-arena',
        name: 'Mystic Realm',
        theme: 'mystic',
        max_players: 30,
        max_games: 8,
        is_public: true,
        description: 'Magical chess arena with arcane effects',
        settings: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'future-arena',
        name: 'Cyber Arena',
        theme: 'future',
        max_players: 40,
        max_games: 12,
        is_public: true,
        description: 'Futuristic chess with neon aesthetics',
        settings: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    useLobbyStore.setState({ availableArenas: mockArenas });
  }, 500);
}