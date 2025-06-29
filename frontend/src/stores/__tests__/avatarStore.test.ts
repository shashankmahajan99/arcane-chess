import { useAvatarStore } from '../avatarStore';
import { Avatar, AvatarState, Vector3 } from '../../types';

describe('AvatarStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAvatarStore.getState().reset();
  });

  describe('Initial state', () => {
    it('should initialize with correct default values', () => {
      const state = useAvatarStore.getState();
      
      expect(state.myAvatar).toBeNull();
      expect(state.myAvatarState).toBeNull();
      expect(state.otherAvatars).toBeInstanceOf(Map);
      expect(state.otherAvatars.size).toBe(0);
      expect(state.availableModels).toEqual(['wizard', 'knight', 'dragon', 'archer', 'mage', 'warrior']);
      expect(state.availableColors).toEqual(['blue', 'red', 'green', 'purple', 'gold', 'silver', 'black', 'white']);
      expect(state.availableAnimations).toEqual(['idle', 'walk', 'run', 'wave', 'dance', 'cheer', 'think', 'celebrate']);
      expect(state.isMoving).toBe(false);
      expect(state.targetPosition).toBeNull();
      expect(state.movementSpeed).toBe(2.0);
      expect(state.showAvatarCustomization).toBe(false);
      expect(state.selectedAvatarPart).toBeNull();
    });
  });

  describe('Avatar management', () => {
    const mockAvatar: Avatar = {
      id: 'avatar-123',
      user_id: 'user-456',
      arena_id: 'arena-789',
      model_type: 'wizard',
      color_scheme: 'blue',
      position_x: 1.0,
      position_y: 0.0,
      position_z: 2.0,
      rotation_y: 0.5,
      is_visible: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should set my avatar correctly', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatar).toEqual(mockAvatar);
      expect(state.myAvatarState).toEqual({
        user_id: mockAvatar.user_id,
        position: {
          x: mockAvatar.position_x,
          y: mockAvatar.position_y,
          z: mockAvatar.position_z,
        },
        rotation: mockAvatar.rotation_y,
        animation: 'idle',
        model_type: mockAvatar.model_type,
        color_scheme: mockAvatar.color_scheme,
        is_visible: mockAvatar.is_visible,
      });
    });

    it('should clear avatar when setting to null', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      store.setMyAvatar(null);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatar).toBeNull();
    });

    it('should update my position correctly', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      const newPosition: Vector3 = { x: 3.0, y: 0.5, z: 4.0 };
      const newRotation = 1.2;
      
      store.updateMyPosition(newPosition, newRotation);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatarState?.position).toEqual(newPosition);
      expect(state.myAvatarState?.rotation).toBe(newRotation);
    });

    it('should update position without rotation change', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      const originalRotation = useAvatarStore.getState().myAvatarState?.rotation;
      const newPosition: Vector3 = { x: 5.0, y: 1.0, z: 6.0 };
      
      store.updateMyPosition(newPosition);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatarState?.position).toEqual(newPosition);
      expect(state.myAvatarState?.rotation).toBe(originalRotation);
    });

    it('should not update position when no avatar state exists', () => {
      const store = useAvatarStore.getState();
      const newPosition: Vector3 = { x: 1.0, y: 0.0, z: 1.0 };
      
      store.updateMyPosition(newPosition, 0.5);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatarState).toBeNull();
    });
  });

  describe('Other avatars management', () => {
    const mockAvatarState: AvatarState = {
      user_id: 'other-user-123',
      position: { x: 2.0, y: 0.0, z: 3.0 },
      rotation: 0.8,
      animation: 'walk',
      model_type: 'knight',
      color_scheme: 'red',
      is_visible: true,
    };

    it('should add other avatar correctly', () => {
      const store = useAvatarStore.getState();
      store.updateOtherAvatar('other-user-123', mockAvatarState);
      
      const state = useAvatarStore.getState();
      expect(state.otherAvatars.has('other-user-123')).toBe(true);
      expect(state.otherAvatars.get('other-user-123')).toEqual(mockAvatarState);
    });

    it('should update existing other avatar', () => {
      const store = useAvatarStore.getState();
      store.updateOtherAvatar('other-user-123', mockAvatarState);
      
      const updatedState: AvatarState = {
        ...mockAvatarState,
        animation: 'run',
        position: { x: 4.0, y: 0.0, z: 5.0 },
      };
      
      store.updateOtherAvatar('other-user-123', updatedState);
      
      const state = useAvatarStore.getState();
      expect(state.otherAvatars.get('other-user-123')).toEqual(updatedState);
    });

    it('should remove other avatar correctly', () => {
      const store = useAvatarStore.getState();
      store.updateOtherAvatar('other-user-123', mockAvatarState);
      
      expect(useAvatarStore.getState().otherAvatars.has('other-user-123')).toBe(true);
      
      store.removeOtherAvatar('other-user-123');
      
      const state = useAvatarStore.getState();
      expect(state.otherAvatars.has('other-user-123')).toBe(false);
    });

    it('should handle removing non-existent avatar gracefully', () => {
      const store = useAvatarStore.getState();
      
      // Should not throw error
      store.removeOtherAvatar('non-existent-user');
      
      const state = useAvatarStore.getState();
      expect(state.otherAvatars.size).toBe(0);
    });
  });

  describe('Movement management', () => {
    it('should set target position correctly', () => {
      const store = useAvatarStore.getState();
      const targetPosition: Vector3 = { x: 7.0, y: 0.0, z: 8.0 };
      
      store.setTargetPosition(targetPosition);
      
      const state = useAvatarStore.getState();
      expect(state.targetPosition).toEqual(targetPosition);
      expect(state.isMoving).toBe(true);
    });

    it('should clear movement when target position is null', () => {
      const store = useAvatarStore.getState();
      
      // First set a target
      const targetPosition: Vector3 = { x: 1.0, y: 0.0, z: 1.0 };
      store.setTargetPosition(targetPosition);
      expect(useAvatarStore.getState().isMoving).toBe(true);
      
      // Then clear it
      store.setTargetPosition(null);
      
      const state = useAvatarStore.getState();
      expect(state.targetPosition).toBeNull();
      expect(state.isMoving).toBe(false);
    });
  });

  describe('Avatar customization', () => {
    const mockAvatar: Avatar = {
      id: 'avatar-123',
      user_id: 'user-456',
      arena_id: 'arena-789',
      model_type: 'wizard',
      color_scheme: 'blue',
      position_x: 1.0,
      position_y: 0.0,
      position_z: 2.0,
      rotation_y: 0.5,
      is_visible: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should update avatar customization correctly', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      const updates = {
        model_type: 'dragon' as const,
        color_scheme: 'gold' as const,
      };
      
      store.updateAvatarCustomization(updates);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatar?.model_type).toBe('dragon');
      expect(state.myAvatar?.color_scheme).toBe('gold');
      expect(state.myAvatarState?.model_type).toBe('dragon');
      expect(state.myAvatarState?.color_scheme).toBe('gold');
    });

    it('should not update customization when no avatar exists', () => {
      const store = useAvatarStore.getState();
      
      const updates = {
        model_type: 'dragon' as const,
        color_scheme: 'gold' as const,
      };
      
      store.updateAvatarCustomization(updates);
      
      const state = useAvatarStore.getState();
      expect(state.myAvatar).toBeNull();
      expect(state.myAvatarState).toBeNull();
    });

    it('should toggle customization UI', () => {
      const store = useAvatarStore.getState();
      
      expect(useAvatarStore.getState().showAvatarCustomization).toBe(false);
      
      store.toggleCustomization();
      expect(useAvatarStore.getState().showAvatarCustomization).toBe(true);
      
      store.toggleCustomization();
      expect(useAvatarStore.getState().showAvatarCustomization).toBe(false);
    });
  });

  describe('Animation system', () => {
    const mockAvatar: Avatar = {
      id: 'avatar-123',
      user_id: 'user-456',
      arena_id: 'arena-789',
      model_type: 'wizard',
      color_scheme: 'blue',
      position_x: 1.0,
      position_y: 0.0,
      position_z: 2.0,
      rotation_y: 0.5,
      is_visible: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should play animation correctly', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      store.playAnimation('dance');
      
      const state = useAvatarStore.getState();
      expect(state.myAvatarState?.animation).toBe('dance');
    });

    it('should not play animation when no avatar state exists', () => {
      const store = useAvatarStore.getState();
      
      store.playAnimation('wave');
      
      const state = useAvatarStore.getState();
      expect(state.myAvatarState).toBeNull();
    });

    it('should handle all available animations', () => {
      const store = useAvatarStore.getState();
      store.setMyAvatar(mockAvatar);
      
      const animations = useAvatarStore.getState().availableAnimations;
      
      animations.forEach(animation => {
        store.playAnimation(animation);
        expect(useAvatarStore.getState().myAvatarState?.animation).toBe(animation);
      });
    });
  });

  describe('Store reset', () => {
    it('should reset all state to initial values', () => {
      const store = useAvatarStore.getState();
      
      // Set up some state
      const mockAvatar: Avatar = {
        id: 'avatar-123',
        user_id: 'user-456',
        arena_id: 'arena-789',
        model_type: 'wizard',
        color_scheme: 'blue',
        position_x: 1.0,
        position_y: 0.0,
        position_z: 2.0,
        rotation_y: 0.5,
        is_visible: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      store.setMyAvatar(mockAvatar);
      store.setTargetPosition({ x: 1.0, y: 0.0, z: 1.0 });
      store.toggleCustomization();
      store.updateOtherAvatar('other-user', {
        user_id: 'other-user',
        position: { x: 0.0, y: 0.0, z: 0.0 },
        rotation: 0.0,
        animation: 'idle',
        model_type: 'knight',
        color_scheme: 'red',
        is_visible: true,
      });
      
      // Reset
      store.reset();
      
      // Check all values are back to initial state
      const state = useAvatarStore.getState();
      expect(state.myAvatar).toBeNull();
      expect(state.myAvatarState).toBeNull();
      expect(state.otherAvatars.size).toBe(0);
      expect(state.isMoving).toBe(false);
      expect(state.targetPosition).toBeNull();
      expect(state.showAvatarCustomization).toBe(false);
      expect(state.selectedAvatarPart).toBeNull();
    });
  });
});