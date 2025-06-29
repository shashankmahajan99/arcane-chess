import { renderHook, act } from '@testing-library/react';
import { useMovementControls } from '../useMovementControls';
import { useAvatarStore } from '../../stores/avatarStore';

// Mock the avatar store
jest.mock('../../stores/avatarStore');

describe('useMovementControls', () => {
  const mockAvatarStore = {
    myAvatarState: null as AvatarState | null,
    updateMyPosition: jest.fn(),
    setTargetPosition: jest.fn(),
    playAnimation: jest.fn(),
    movementSpeed: 2.0,
  };

  const mockAvatarState: AvatarState = {
    user_id: 'user-123',
    position: { x: 0.0, y: 0.0, z: 0.0 },
    rotation: 0.0,
    animation: 'idle',
    model_type: 'wizard',
    color_scheme: 'blue',
    is_visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset mock store
    mockAvatarStore.myAvatarState = null;
    mockAvatarStore.updateMyPosition.mockClear();
    mockAvatarStore.setTargetPosition.mockClear();
    mockAvatarStore.playAnimation.mockClear();
    
    (useAvatarStore as jest.Mock).mockReturnValue(mockAvatarStore);
    
    // Mock event listeners
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Hook initialization', () => {
    it('should initialize with default values when disabled', () => {
      const { result } = renderHook(() => useMovementControls(false));
      
      expect(result.current.isMoving).toBe(false);
      expect(result.current.isRunning).toBe(false);
    });

    it('should set up event listeners when enabled', () => {
      renderHook(() => useMovementControls(true));
      
      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should not set up event listeners when disabled', () => {
      renderHook(() => useMovementControls(false));
      
      expect(window.addEventListener).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useMovementControls(true));
      
      unmount();
      
      expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    });
  });

  describe('Keyboard input handling', () => {
    it('should handle WASD key presses', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      // Get the keydown handler
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Simulate W key press
      await act(async () => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        await jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.updateMyPosition).toHaveBeenCalled();
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('walk');
      expect(result.current.isMoving).toBe(true);
    });

    it('should handle arrow key presses', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Simulate ArrowUp key press
      await act(async () => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
        await jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.updateMyPosition).toHaveBeenCalled();
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('walk');
      expect(result.current.isMoving).toBe(true);
    });

    it('should handle shift key for running', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Simulate W + Shift key press
      await act(async () => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        keydownHandler(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
        await jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('run');
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isMoving).toBe(true);
    });

    it('should handle key releases', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      const keyupHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keyup')?.[1];
      
      // Press and release W key
      await act(async () => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
      });
      
      await act(async () => {
        keyupHandler(new KeyboardEvent('keyup', { code: 'KeyW' }));
      });
      
      await act(async () => {
        jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('idle');
      expect(result.current.isMoving).toBe(false);
      expect(result.current.isRunning).toBe(false);
    });

    it('should not handle input when disabled', () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(false));
      
      // Even if we somehow get a keydown event, it shouldn't be processed
      // This tests the enabled check in the handler
      expect(result.current.isMoving).toBe(false);
    });
  });

  describe('Movement calculation', () => {
    beforeEach(() => {
      mockAvatarStore.myAvatarState = mockAvatarState;
    });

    it('should calculate forward movement correctly', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Forward movement should move in negative Z direction
      expect(newPosition.z).toBeLessThan(mockAvatarState.position.z);
      expect(newPosition.x).toBe(mockAvatarState.position.x);
      expect(newPosition.y).toBe(mockAvatarState.position.y);
    });

    it('should calculate backward movement correctly', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyS' }));
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Backward movement should move in positive Z direction
      expect(newPosition.z).toBeGreaterThan(mockAvatarState.position.z);
    });

    it('should calculate left movement correctly', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyA' }));
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Left movement should move in negative X direction
      expect(newPosition.x).toBeLessThan(mockAvatarState.position.x);
    });

    it('should calculate right movement correctly', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyD' }));
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Right movement should move in positive X direction
      expect(newPosition.x).toBeGreaterThan(mockAvatarState.position.x);
    });

    it('should calculate diagonal movement correctly', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyD' }));
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Diagonal movement should move in both X and Z directions
      expect(newPosition.x).toBeGreaterThan(mockAvatarState.position.x);
      expect(newPosition.z).toBeLessThan(mockAvatarState.position.z);
    });

    it('should normalize diagonal movement speed', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Single direction movement
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        jest.advanceTimersByTime(16);
      });
      
      const singleMoveCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [singleMovePosition] = singleMoveCall;
      const singleMoveDistance = Math.abs(singleMovePosition.z - mockAvatarState.position.z);
      
      // Reset mock
      mockAvatarStore.updateMyPosition.mockClear();
      
      // Diagonal movement
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyD' }));
        jest.advanceTimersByTime(16);
      });
      
      const diagonalMoveCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [diagonalMovePosition] = diagonalMoveCall;
      const diagonalMoveDistanceX = Math.abs(diagonalMovePosition.x - mockAvatarState.position.x);
      const diagonalMoveDistanceZ = Math.abs(diagonalMovePosition.z - mockAvatarState.position.z);
      const totalDiagonalDistance = Math.sqrt(diagonalMoveDistanceX ** 2 + diagonalMoveDistanceZ ** 2);
      
      // Diagonal movement should have similar total distance due to normalization
      expect(Math.abs(totalDiagonalDistance - singleMoveDistance)).toBeLessThan(0.001);
    });

    it('should apply running speed modifier', () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Normal movement
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        jest.advanceTimersByTime(16);
      });
      
      const normalMoveCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [normalMovePosition] = normalMoveCall;
      const normalMoveDistance = Math.abs(normalMovePosition.z - mockAvatarState.position.z);
      
      // Reset mock
      mockAvatarStore.updateMyPosition.mockClear();
      
      // Running movement
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
        jest.advanceTimersByTime(16);
      });
      
      const runningMoveCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [runningMovePosition] = runningMoveCall;
      const runningMoveDistance = Math.abs(runningMovePosition.z - mockAvatarState.position.z);
      
      // Running should be faster (1.8x modifier)
      expect(runningMoveDistance).toBeGreaterThan(normalMoveDistance * 1.7);
    });

    it('should apply arena boundary constraints', () => {
      // Set avatar at edge of arena
      const edgeAvatarState: AvatarState = {
        ...mockAvatarState,
        position: { x: 11.5, y: 0.0, z: 11.5 }, // Near boundary
      };
      mockAvatarStore.myAvatarState = edgeAvatarState;
      
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      // Try to move further out of bounds
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyD' })); // Move right
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyS' })); // Move back
        jest.advanceTimersByTime(16);
      });
      
      const lastCall = mockAvatarStore.updateMyPosition.mock.calls[0];
      const [newPosition] = lastCall;
      
      // Position should be clamped to boundary
      expect(newPosition.x).toBeLessThanOrEqual(12);
      expect(newPosition.z).toBeLessThanOrEqual(12);
      expect(newPosition.x).toBeGreaterThanOrEqual(-12);
      expect(newPosition.z).toBeGreaterThanOrEqual(-12);
    });
  });

  describe('Animation handling', () => {
    beforeEach(() => {
      mockAvatarStore.myAvatarState = mockAvatarState;
    });

    it('should play idle animation when not moving', async () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      await act(async () => {
        jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('idle');
      expect(result.current.isMoving).toBe(false);
      expect(result.current.isRunning).toBe(false);
    });

    it('should play walk animation when moving normally', async () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('walk');
    });

    it('should play run animation when shift is pressed', async () => {
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      await act(async () => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        keydownHandler(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
        jest.advanceTimersByTime(16);
      });
      
      expect(mockAvatarStore.playAnimation).toHaveBeenCalledWith('run');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing avatar state gracefully', async () => {
      mockAvatarStore.myAvatarState = null;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        jest.advanceTimersByTime(16);
      });
      
      // Should not crash or call any store methods
      expect(mockAvatarStore.updateMyPosition).not.toHaveBeenCalled();
      expect(mockAvatarStore.playAnimation).not.toHaveBeenCalled();
    });

    it('should handle rapid key presses correctly', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      const keyupHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keyup')?.[1];
      
      // Rapid press and release
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
        keyupHandler(new KeyboardEvent('keyup', { code: 'KeyW' }));
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyA' }));
        jest.advanceTimersByTime(16);
      });
      
      // Should handle the state correctly
      expect(mockAvatarStore.updateMyPosition).toHaveBeenCalled();
    });

    it('should update movement state at consistent intervals', async () => {
      mockAvatarStore.myAvatarState = mockAvatarState;
      const { result } = renderHook(() => useMovementControls(true));
      
      const keydownHandler = (window.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'keydown')?.[1];
      
      act(() => {
        keydownHandler(new KeyboardEvent('keydown', { code: 'KeyW' }));
      });
      
      // Check multiple frame updates
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(16);
        });
      }
      
      // Should have been called multiple times (once per frame)
      expect(mockAvatarStore.updateMyPosition.mock.calls.length).toBeGreaterThan(1);
    });
  });
});