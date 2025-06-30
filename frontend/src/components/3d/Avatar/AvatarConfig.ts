// Avatar configuration interface
export interface AvatarConfig {
  // Physical appearance
  bodyType: 'slim' | 'athletic' | 'robust';
  height: number; // 0.8 - 1.2 scale
  skinColor: string;
  
  // Head features
  headShape: 'oval' | 'round' | 'square';
  eyeColor: string;
  hairStyle: 'bald' | 'short' | 'long' | 'wizard';
  hairColor: string;
  facialHair: 'none' | 'beard' | 'mustache' | 'goatee';
  
  // Clothing
  outfit: 'wizard' | 'knight' | 'casual' | 'formal';
  primaryColor: string;
  secondaryColor: string;
  
  // Accessories
  hat: 'none' | 'wizard' | 'crown' | 'helmet';
  weapon: 'none' | 'staff' | 'sword' | 'wand';
  
  // Animation settings
  walkStyle: 'normal' | 'confident' | 'sneaky' | 'magical';
}

// Default avatar configurations
export const DEFAULT_AVATARS: Record<string, AvatarConfig> = {
  wizard: {
    bodyType: 'slim',
    height: 1.0,
    skinColor: '#fbbf24',
    headShape: 'oval',
    eyeColor: '#3b82f6',
    hairStyle: 'wizard',
    hairColor: '#d4d4d8',
    facialHair: 'beard',
    outfit: 'wizard',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    hat: 'wizard',
    weapon: 'staff',
    walkStyle: 'magical'
  },
  knight: {
    bodyType: 'athletic',
    height: 1.1,
    skinColor: '#f59e0b',
    headShape: 'square',
    eyeColor: '#059669',
    hairStyle: 'short',
    hairColor: '#92400e',
    facialHair: 'none',
    outfit: 'knight',
    primaryColor: '#374151',
    secondaryColor: '#6b7280',
    hat: 'helmet',
    weapon: 'sword',
    walkStyle: 'confident'
  },
  mage: {
    bodyType: 'slim',
    height: 0.95,
    skinColor: '#e5e7eb',
    headShape: 'oval',
    eyeColor: '#8b5cf6',
    hairStyle: 'long',
    hairColor: '#1f2937',
    facialHair: 'none',
    outfit: 'wizard',
    primaryColor: '#5b21b6',
    secondaryColor: '#8b5cf6',
    hat: 'none',
    weapon: 'wand',
    walkStyle: 'magical'
  }
};
