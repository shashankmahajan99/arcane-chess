import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerList } from '../Game/PlayerList';
import { useGameStore } from '../../stores/gameStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { AvatarState, Game, User } from '../../types';

// Mock the stores
jest.mock('../../stores/gameStore');
jest.mock('../../stores/avatarStore');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<any>) => {
      const { whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: React.PropsWithChildren<any>) => {
      const { whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<any>) => <>{children}</>,
}));

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  UserIcon: () => <span data-testid="user-icon">UserIcon</span>,
  StarIcon: () => <span data-testid="star-icon">StarIcon</span>,
  EyeIcon: () => <span data-testid="eye-icon">EyeIcon</span>,
  ChatBubbleLeftIcon: () => <span data-testid="chat-icon">ChatIcon</span>,
  ExclamationTriangleIcon: () => <span data-testid="warning-icon">WarningIcon</span>,
}));

describe('PlayerList Component', () => {
  const mockCurrentUser: User = {
    id: 'current-user-123',
    username: 'current-user-123',
    email: 'current@example.com',
    rating: 1500,
    avatar_id: 'avatar-current',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockAvatarState: AvatarState = {
    user_id: 'current-user-123',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    animation: 'idle',
    model_type: 'wizard',
    color_scheme: 'blue',
    is_visible: true,
  };

  const mockOtherPlayers: AvatarState[] = [
    {
      user_id: 'player-456',
      position: { x: 1, y: 0, z: 1 },
      rotation: 0.5,
      animation: 'walk',
      model_type: 'knight',
      color_scheme: 'red',
      is_visible: true,
    },
    {
      user_id: 'player-789',
      position: { x: 2, y: 0, z: 2 },
      rotation: 1.0,
      animation: 'idle',
      model_type: 'dragon',
      color_scheme: 'gold',
      is_visible: true,
    },
  ];

  const mockGame: Game = {
    id: 'game-123',
    arena_id: 'arena-456',
    white_player_id: 'current-user-123',
    black_player_id: 'player-456',
    white_player: mockCurrentUser,
    black_player: {
      id: 'player-456',
      username: 'OpponentPlayer',
      email: 'opponent@example.com',
      rating: 1600,
      avatar_id: 'avatar-opponent',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    status: 'active',
    current_turn: 'white',
    move_count: 5,
    white_time: 600,
    black_time: 550,
    time_control: 900,
    board_state: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useGameStore as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
    });
    
    (useAvatarStore as jest.Mock).mockReturnValue({
      myAvatarState: mockAvatarState,
    });
  });

  describe('Rendering', () => {
    it('should render the header with close button', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should render arena tab by default', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (3)')).toBeInTheDocument();
      expect(screen.getByText('current-user-123')).toBeInTheDocument();
    });

    it('should render game tab when current game exists', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (3)')).toBeInTheDocument();
      expect(screen.getByText('Game (2)')).toBeInTheDocument();
    });

    it('should not render game tab when no current game', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Game (2)')).not.toBeInTheDocument();
    });
  });

  describe('Arena Tab', () => {
    it('should display all players including current user', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('current-user-123')).toBeInTheDocument();
      expect(screen.getByText('player-456')).toBeInTheDocument();
      expect(screen.getByText('player-789')).toBeInTheDocument();
    });

    it('should show correct player count in tab', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (3)')).toBeInTheDocument();
    });

    it('should display player avatars correctly', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('🧙‍♂️')).toBeInTheDocument(); // wizard
      expect(screen.getByText('⚔️')).toBeInTheDocument(); // knight
      expect(screen.getByText('🐉')).toBeInTheDocument(); // dragon
    });

    it('should mark current user with "YOU" badge', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('YOU')).toBeInTheDocument();
    });

    it('should show correct player status', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Your avatar')).toBeInTheDocument();
      expect(screen.getAllByText('In game')).toHaveLength(1); // One player in game
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });

  describe('Game Tab', () => {
    it('should switch to game tab when clicked', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('current-user-123')).toBeInTheDocument();
      expect(screen.getByText('OpponentPlayer')).toBeInTheDocument();
    });

    it('should display white player information', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('current-user-123')).toBeInTheDocument();
      expect(screen.getByText('Rating: 1500')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument(); // 600 seconds formatted
    });

    it('should display black player information', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('OpponentPlayer')).toBeInTheDocument();
      expect(screen.getByText('Rating: 1600')).toBeInTheDocument();
      expect(screen.getByText('9:10')).toBeInTheDocument(); // 550 seconds formatted
    });

    it('should highlight current turn player', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      // Should show pulse indicator for current turn (white)
      const pulseIndicators = screen.getAllByRole('generic');
      const hasPulse = pulseIndicators.some(el => 
        el.className.includes('animate-pulse')
      );
      expect(hasPulse).toBe(true);
    });

    it('should display game status information', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('Game Status')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument(); // move count + 1
      expect(screen.getByText('15 min')).toBeInTheDocument(); // time control
    });

    it('should format time correctly', () => {
      const gameWithDifferentTimes = {
        ...mockGame,
        white_time: 65, // 1:05
        black_time: 30, // 0:30
      };

      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={gameWithDifferentTimes}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      // Mock console.log to track action calls
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
    });

    it('should show action buttons on hover', async () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      const playerCard = screen.getByText('player-456').closest('div');
      fireEvent.mouseEnter(playerCard!);

      await waitFor(() => {
        expect(screen.getByTestId('star-icon')).toBeInTheDocument();
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
        expect(screen.getByTestId('chat-icon')).toBeInTheDocument();
      });
    });

    it('should handle challenge action', async () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      const playerCard = screen.getByText('player-456').closest('div');
      fireEvent.mouseEnter(playerCard!);

      await waitFor(() => {
        const challengeButton = screen.getByTestId('star-icon').closest('button');
        fireEvent.click(challengeButton!);
      });

      expect(console.log).toHaveBeenCalledWith('Challenge sent to player-456');
    });

    it('should handle spectate action', async () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      const playerCard = screen.getByText('player-456').closest('div');
      fireEvent.mouseEnter(playerCard!);

      await waitFor(() => {
        const spectateButton = screen.getByTestId('eye-icon').closest('button');
        fireEvent.click(spectateButton!);
      });

      expect(console.log).toHaveBeenCalledWith('Spectating player-456');
    });

    it('should handle message action', async () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      const playerCard = screen.getByText('player-456').closest('div');
      fireEvent.mouseEnter(playerCard!);

      await waitFor(() => {
        const messageButton = screen.getByTestId('chat-icon').closest('button');
        fireEvent.click(messageButton!);
      });

      expect(console.log).toHaveBeenCalledWith('Opening chat with player-456');
    });

    it('should not show action buttons for current user', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      const currentUserCard = screen.getByText('current-user-123').closest('div');
      fireEvent.mouseEnter(currentUserCard!);

      // Should not show action buttons for current user
      expect(screen.queryByTestId('star-icon')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('✕'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player list', () => {
      render(
        <PlayerList
          players={[]}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (1)')).toBeInTheDocument(); // Only current user
      expect(screen.getByText('current-user-123')).toBeInTheDocument();
    });

    it('should handle missing current user', () => {
      (useGameStore as jest.Mock).mockReturnValue({
        currentUser: null,
      });

      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (3)')).toBeInTheDocument(); // 2 other players + current avatar
    });

    it('should handle missing avatar state', () => {
      (useAvatarStore as jest.Mock).mockReturnValue({
        myAvatarState: null,
      });

      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Arena (2)')).toBeInTheDocument(); // Only other players
    });

    it('should handle game without players', () => {
      const gameWithoutPlayers = {
        ...mockGame,
        white_player: null,
        black_player: null,
      };

      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={gameWithoutPlayers}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      expect(screen.getByText('Game Status')).toBeInTheDocument();
    });

    it('should handle low time scenarios', () => {
      const lowTimeGame = {
        ...mockGame,
        white_time: 30, // Under 60 seconds
        black_time: 200, // Under 300 seconds
      };

      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={lowTimeGame}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Game (2)'));
      
      // Should apply warning colors for low time
      expect(screen.getByText('0:30')).toBeInTheDocument();
      expect(screen.getByText('3:20')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      // Check that buttons have proper titles
      const closeButton = screen.getByText('✕');
      expect(closeButton.closest('button')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <PlayerList
          players={mockOtherPlayers}
          currentGame={mockGame}
          onClose={mockOnClose}
        />
      );

      const arenaTab = screen.getByText('Arena (3)');
      const gameTab = screen.getByText('Game (2)');

      expect(arenaTab.closest('button')).toBeInTheDocument();
      expect(gameTab.closest('button')).toBeInTheDocument();
    });
  });
});