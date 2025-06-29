import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Avatar, AvatarState, Vector3 } from '../types';

interface AvatarStoreState {
  // Current user's avatar
  myAvatar: Avatar | null;
  myAvatarState: AvatarState | null;
  
  // Other players' avatars in the arena
  otherAvatars: Map<string, AvatarState>;
  
  // Avatar customization
  availableModels: string[];
  availableColors: string[];
  availableAnimations: string[];
  
  // Movement state
  isMoving: boolean;
  targetPosition: Vector3 | null;
  movementSpeed: number;
  
  // UI state
  showAvatarCustomization: boolean;
  selectedAvatarPart: string | null;
  
  // Actions
  setMyAvatar: (avatar: Avatar | null) => void;
  updateMyPosition: (position: Vector3, rotation?: number) => void;
  updateOtherAvatar: (userId: string, state: AvatarState) => void;
  removeOtherAvatar: (userId: string) => void;
  setTargetPosition: (position: Vector3 | null) => void;
  updateAvatarCustomization: (updates: Partial<Avatar>) => void;
  playAnimation: (animation: string) => void;
  toggleCustomization: () => void;
  reset: () => void;
}

export const useAvatarStore = create<AvatarStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    myAvatar: null,
    myAvatarState: null,
    otherAvatars: new Map(),
    availableModels: ['wizard', 'knight', 'dragon', 'archer', 'mage', 'warrior'],
    availableColors: ['blue', 'red', 'green', 'purple', 'gold', 'silver', 'black', 'white'],
    availableAnimations: ['idle', 'walk', 'run', 'wave', 'dance', 'cheer', 'think', 'celebrate'],
    isMoving: false,
    targetPosition: null,
    movementSpeed: 2.0,
    showAvatarCustomization: false,
    selectedAvatarPart: null,

    // Actions
    setMyAvatar: (avatar) => {
      set({ myAvatar: avatar });
      if (avatar) {
        set({
          myAvatarState: {
            user_id: avatar.user_id,
            position: {
              x: avatar.position_x,
              y: avatar.position_y,
              z: avatar.position_z,
            },
            rotation: avatar.rotation_y,
            animation: 'idle',
            model_type: avatar.model_type,
            color_scheme: avatar.color_scheme,
            name: avatar.name, // Added missing property
            accessories: avatar.accessories, // Added missing property
            is_visible: avatar.is_visible,
          }
        });
      }
    },

    updateMyPosition: (position, rotation) => {
      const { myAvatarState } = get();
      if (!myAvatarState) return;

      const newState = {
        ...myAvatarState,
        position,
        rotation: rotation !== undefined ? rotation : myAvatarState.rotation,
      };

      set({ myAvatarState: newState });
      // Emit position update to server (would be implemented in network layer)
      // avatarService.updatePosition(position, rotation);
    },

    updateOtherAvatar: (userId, state) => {
      set(prevState => {
        const newOtherAvatars = new Map(prevState.otherAvatars);
        newOtherAvatars.set(userId, state);
        return { otherAvatars: newOtherAvatars };
      });
    },

    removeOtherAvatar: (userId) => {
      set(prevState => {
        const newOtherAvatars = new Map(prevState.otherAvatars);
        newOtherAvatars.delete(userId);
        return { otherAvatars: newOtherAvatars };
      });
    },

    setTargetPosition: (position) => {
      set({ 
        targetPosition: position,
        isMoving: position !== null 
      });
    },

    updateAvatarCustomization: (updates) => {
      const { myAvatar, myAvatarState } = get();
      if (!myAvatar || !myAvatarState) return;

      const updatedAvatar = { ...myAvatar, ...updates };
      const updatedState = {
        ...myAvatarState,
        model_type: updates.model_type || myAvatarState.model_type,
        color_scheme: updates.color_scheme || myAvatarState.color_scheme,
      };

      set({ 
        myAvatar: updatedAvatar,
        myAvatarState: updatedState 
      });
      // Send updates to server
      // avatarService.updateAvatar(updates);
    },

    playAnimation: (animation) => {
      const { myAvatarState } = get();
      if (!myAvatarState) return;

      set({
        myAvatarState: {
          ...myAvatarState,
          animation
        }
      });
      // Send animation to server
      // avatarService.playAnimation(animation);
    },

    toggleCustomization: () => set(state => ({ 
      showAvatarCustomization: !state.showAvatarCustomization 
    })),

    reset: () => set({
      myAvatar: null,
      myAvatarState: null,
      otherAvatars: new Map(),
      isMoving: false,
      targetPosition: null,
      showAvatarCustomization: false,
      selectedAvatarPart: null,
    }),
  }))
);
